import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { InventoryService } from '../services/inventory.service';

const router = Router();

// Get all kits
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: kits });
  } catch (error) {
    next(error);
  }
});

// Get kit by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
router.get('/:id/availability', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const quantity = parseInt(req.query.quantity as string) || 1;

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
router.post('/', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { code, name, description, products } = req.body;

    if (!code || !name) {
      throw new AppError('Código y nombre son requeridos', 400);
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new AppError('El kit debe tener al menos un producto', 400);
    }

    const existing = await prisma.kit.findUnique({ where: { code } });
    if (existing) {
      throw new AppError('Ya existe un kit con ese código', 400);
    }

    // Validate all products exist
    for (const p of products) {
      const product = await prisma.product.findUnique({ where: { id: p.productId } });
      if (!product) {
        throw new AppError(`Producto ${p.productId} no encontrado`, 404);
      }
    }

    const kit = await prisma.kit.create({
      data: {
        code,
        name,
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

    await auditService.log('Kit', kit.id, 'CREATE', req.user!.id, null, kit);

    res.status(201).json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// Update kit
router.put('/:id', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
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

      // If products are provided, replace all
      if (products && Array.isArray(products)) {
        await tx.kitProduct.deleteMany({ where: { kitId: req.params.id } });
        
        for (const p of products) {
          await tx.kitProduct.create({
            data: {
              kitId: req.params.id,
              productId: p.productId,
              quantity: p.quantity
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
router.get('/:id/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { startDate, endDate, status } = req.query;

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

    // Calculate stats
    const totalKitsDelivered = deliveries.reduce((sum: number, d: any) => 
      sum + (d.deliveryDetails?.reduce((s: number, dd: any) => s + dd.quantity, 0) || 0), 0);
    
    const stats = {
      totalDeliveries: deliveries.length,
      totalKitsDelivered,
      byStatus: deliveries.reduce((acc: any, d: any) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {}),
      lastDelivery: deliveries[0]?.createdAt || null
    };

    res.json({ 
      success: true, 
      data: {
        kit,
        deliveries,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete (deactivate) kit
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
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
