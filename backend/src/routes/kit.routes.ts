import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { InventoryService } from '../services/inventory.service';
import { CodeGenerator } from '../services/codeGenerator';
import { kitZodSchemas, validateZodRequest } from '../middleware/validation.middleware';

const router = Router();

// Get all kits
router.get('/', authenticate, validateZodRequest({ query: kitZodSchemas.listQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const includeInactive = req.query.includeInactive === 'true';

    const kits = await prisma.kit.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        kitProducts: {
          include: {
            product: {
              include: { category: true }
            }
          }
        },
        inventory: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: kits });
  } catch (error) {
    next(error);
  }
});

// Get kits available for exit (with stock)
router.get('/available-for-exit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    // Get all kits and check their inventory through inventory service
    const kits = await prisma.kit.findMany({
      where: { isActive: true },
      include: {
        kitProducts: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Check inventory for each kit
    const kitsWithStock = [];
    for (const kit of kits) {
      try {
        const inventory = await InventoryService.getKitInventory(kit.id);
        if (inventory && inventory.quantity > 0) {
          kitsWithStock.push({
            id: kit.id,
            code: kit.code,
            name: kit.name,
            isActive: kit.isActive,
            totalAvailable: inventory.quantity,
            kitProducts: kit.kitProducts
          });
        }
      } catch (error) {
        // Skip kits without inventory
        continue;
      }
    }

    // Sort by available quantity (descending)
    kitsWithStock.sort((a, b) => b.totalAvailable - a.totalAvailable);

    res.json({ 
      success: true, 
      data: kitsWithStock,
      meta: {
        total: kitsWithStock.length,
        totalStock: kitsWithStock.reduce((sum, kit) => sum + kit.totalAvailable, 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get kit by ID
router.get('/:id', authenticate, validateZodRequest({ params: kitZodSchemas.idParam }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const kit = await prisma.kit.findUnique({
      where: { id: req.params.id },
      include: {
        kitProducts: {
          include: {
            product: {
              include: { 
                category: true,
                lots: { where: { isActive: true } }
              }
            }
          }
        }
      }
    });

    if (!kit) {
      throw new AppError('Kit no encontrado', 404);
    }

    res.json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// Get kit availability (check if all products have enough stock)
router.get('/:id/availability', authenticate, validateZodRequest({ params: kitZodSchemas.idParam, query: kitZodSchemas.availabilityQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const { quantity = 1 } = req.query as { quantity?: number };

    const kit = await prisma.kit.findUnique({
      where: { id: req.params.id },
      include: {
        kitProducts: {
          include: {
            product: true
          }
        }
      }
    });

    if (!kit) {
      throw new AppError('Kit no encontrado', 404);
    }

    const availability = await Promise.all(
      kit.kitProducts.map(async (kp) => {
        const stock = await inventoryService.getProductStock(kp.productId);
        const required = kp.quantity * quantity;
        return {
          productId: kp.productId,
          productName: kp.product.name,
          required,
          available: stock,
          sufficient: stock >= required
        };
      })
    );

    const canDeliver = availability.every(a => a.sufficient);
    const maxKits = Math.min(
      ...availability.map(a => Math.floor(a.available / (a.required / quantity)))
    );

    res.json({
      success: true,
      data: {
        kitId: kit.id,
        kitName: kit.name,
        requestedQuantity: quantity,
        canDeliver,
        maxAvailable: maxKits,
        products: availability
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create kit
router.post('/', authenticate, authorize('ADMIN', 'WAREHOUSE'), validateZodRequest({ body: kitZodSchemas.create }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const codeGenerator = new CodeGenerator(prisma);
    const { code, name, type, description, products } = req.body;

    // Si no se proporciona código, generarlo automáticamente
    let kitCode = code;
    if (!kitCode) {
      kitCode = await codeGenerator.generateKitCode(type || 'GENERAL');
    } else {
      // Si se proporciona código, verificar unicidad
      const existing = await prisma.kit.findUnique({ where: { code: kitCode } });
      if (existing) {
        throw new AppError('Ya existe un kit con ese código', 400);
      }
    }

    // Validate all products exist
    for (const p of products) {
      const product = await prisma.product.findUnique({ where: { id: p.productId } });
      if (!product) {
        throw new AppError(`Producto ${p.productId} no encontrado`, 404);
      }
    }

    // Create kit and stock movements in a transaction
    const kit = await prisma.$transaction(async (tx) => {
      const newKit = await tx.kit.create({
        data: {
          code: kitCode,
          name,
          type: type || 'GENERAL',
          description,
          kitProducts: {
            create: products.map((p: { productId: string; quantity: number }) => ({
              productId: p.productId,
              quantity: p.quantity
            }))
          }
        },
        include: {
          kitProducts: {
            include: { product: true }
          }
        }
      });

      // Generate stock movements for each product in the kit
      for (const kitProduct of newKit.kitProducts) {
        await tx.stockMovement.create({
          data: {
            productId: kitProduct.productId,
            lotId: null, // Initial kit creation doesn't assign to specific lot
            type: 'ENTRY',
            quantity: kitProduct.quantity,
            reason: `Entrada kit ${code} x${kitProduct.quantity}`,
            reference: `KIT_ENTRY:${code}`,
            userId: req.user!.id
          }
        });
      }

      return newKit;
    });

    await auditService.log('Kit', kit.id, 'CREATE', req.user!.id, null, kit);

    res.status(201).json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// Update kit
router.put('/:id', authenticate, authorize('ADMIN', 'WAREHOUSE'), validateZodRequest({ params: kitZodSchemas.idParam, body: kitZodSchemas.update }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { code, name, description, products, isActive } = req.body;

    const existing = await prisma.kit.findUnique({ 
      where: { id: req.params.id },
      include: { kitProducts: true }
    });

    if (!existing) {
      throw new AppError('Kit no encontrado', 404);
    }

    if (code && code !== existing.code) {
      const duplicate = await prisma.kit.findUnique({ where: { code } });
      if (duplicate) {
        throw new AppError('Ya existe un kit con ese código', 400);
      }
    }

    // Update kit and products in a transaction
    const kit = await prisma.$transaction(async (tx) => {
      // Update basic kit info
      const updatedKit = await tx.kit.update({
        where: { id: req.params.id },
        data: { code, name, description, isActive }
      });

      // If products are provided, replace all and generate movements
      if (products && Array.isArray(products)) {
        await tx.kitProduct.deleteMany({ where: { kitId: req.params.id } });
        
        const newKitProducts = [];
        for (const p of products) {
          const newKitProduct = await tx.kitProduct.create({
            data: {
              kitId: req.params.id,
              productId: p.productId,
              quantity: p.quantity
            },
            include: { product: true }
          });
          newKitProducts.push(newKitProduct);
        }

        // Generate stock movements for updated kit products
        const finalCode = code || existing.code;
        for (const kitProduct of newKitProducts) {
          await tx.stockMovement.create({
            data: {
              productId: kitProduct.productId,
              lotId: null,
              type: 'ENTRY',
              quantity: kitProduct.quantity,
              reason: `Entrada kit ${finalCode} x${kitProduct.quantity}`,
              reference: `KIT_ENTRY:${finalCode}`,
              userId: req.user!.id
            }
          });
        }
      }

      return tx.kit.findUnique({
        where: { id: req.params.id },
        include: {
          kitProducts: {
            include: { product: true }
          }
        }
      });
    });

    await auditService.log('Kit', kit!.id, 'UPDATE', req.user!.id, existing, kit);

    res.json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// Get kit delivery history
router.get('/:id/history', authenticate, validateZodRequest({ params: kitZodSchemas.idParam, query: kitZodSchemas.historyQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { startDate, endDate, status } = req.query as {
      startDate?: string;
      endDate?: string;
      status?: 'PENDING_AUTHORIZATION' | 'AUTHORIZED' | 'RECEIVED_WAREHOUSE' | 'IN_PREPARATION' | 'READY' | 'DELIVERED' | 'CANCELLED';
    };

    const kit = await prisma.kit.findUnique({
      where: { id: req.params.id },
      include: {
        kitProducts: {
          include: { product: true }
        }
      }
    });

    if (!kit) {
      throw new AppError('Kit no encontrado', 404);
    }

    // Get all deliveries that include this kit
    const where: any = {
      deliveryDetails: {
        some: { kitId: req.params.id }
      }
    };

    if (status) where.status = status;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        deliveryDetails: {
          where: { kitId: req.params.id }
        },
        request: {
          include: {
            beneficiary: true
          }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        authorizedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        preparedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        deliveredBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get stock entries for this kit
    const stockEntries = await prisma.stockMovement.findMany({
      where: {
        type: 'ENTRY',
        OR: [
          { reference: { startsWith: `KIT_ENTRY:${kit.code}:` } },
          { reason: { contains: kit.code } }
        ]
      },
      include: {
        product: { select: { id: true, name: true, code: true, unit: true } },
        user: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const totalKitsDelivered = deliveries.reduce((sum: number, d: any) => 
      sum + (d.deliveryDetails?.reduce((s: number, dd: any) => s + dd.quantity, 0) || 0), 0);

    // Parse total kits entered from reason strings (format: "Entrada kit CODE xN")
    const kitQtyFromReason = (reason: string | null): number => {
      if (!reason) return 0;
      const m = reason.match(/x(\d+)/);
      return m ? parseInt(m[1]) : 0;
    };
    const uniqueEntryEvents = new Map<string, string | null>();
    stockEntries.forEach((e: any) => {
      const key = e.reference || `${e.reason}|${new Date(e.createdAt).toISOString().slice(0, 16)}`;
      if (!uniqueEntryEvents.has(key)) uniqueEntryEvents.set(key, e.reason);
    });
    const totalKitsEntered = Array.from(uniqueEntryEvents.values()).reduce((sum: number, reason: string | null) => {
      return sum + kitQtyFromReason(reason);
    }, 0);
    
    const stats = {
      totalDeliveries: deliveries.length,
      totalKitsDelivered,
      totalEntries: uniqueEntryEvents.size,
      totalKitsEntered,
      byStatus: deliveries.reduce((acc: any, d: any) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {}),
      lastDelivery: deliveries[0]?.createdAt || null,
      lastEntry: stockEntries[0]?.createdAt || null
    };

    res.json({ 
      success: true, 
      data: {
        kit,
        deliveries,
        stockEntries,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete (deactivate) kit
router.delete('/:id', authenticate, authorize('ADMIN'), validateZodRequest({ params: kitZodSchemas.idParam }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);

    const existing = await prisma.kit.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError('Kit no encontrado', 404);
    }

    const kit = await prisma.kit.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    await auditService.log('Kit', kit.id, 'DELETE', req.user!.id, existing, kit);

    res.json({ success: true, message: 'Kit desactivado' });
  } catch (error) {
    next(error);
  }
});

export default router;
