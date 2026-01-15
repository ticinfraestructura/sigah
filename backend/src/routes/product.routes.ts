import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { InventoryService } from '../services/inventory.service';
import { validate, productValidations, commonValidations } from '../middleware/validation.middleware';

const router = Router();

// Get all products with filters
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      categoryId, 
      isPerishable, 
      search, 
      includeInactive,
      page = '1',
      limit = '50'
    } = req.query;

    const where: any = {};
    
    if (includeInactive !== 'true') {
      where.isActive = true;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (isPerishable !== undefined) {
      where.isPerishable = isPerishable === 'true';
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          lots: {
            where: { isActive: true },
            orderBy: { expiryDate: 'asc' }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.product.count({ where })
    ]);

    // Add total stock to each product
    const productsWithStock = products.map(product => ({
      ...product,
      totalStock: product.lots.reduce((sum, lot) => sum + lot.quantity, 0)
    }));

    res.json({
      success: true,
      data: productsWithStock,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get product by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        lots: {
          where: { isActive: true },
          orderBy: { expiryDate: 'asc' }
        }
      }
    });

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    const totalStock = product.lots.reduce((sum, lot) => sum + lot.quantity, 0);

    res.json({
      success: true,
      data: { ...product, totalStock }
    });
  } catch (error) {
    next(error);
  }
});

// Get product lots
router.get('/:id/lots', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const lots = await prisma.productLot.findMany({
      where: { 
        productId: req.params.id,
        isActive: true
      },
      orderBy: { expiryDate: 'asc' }
    });

    res.json({ success: true, data: lots });
  } catch (error) {
    next(error);
  }
});

// Get product movements
router.get('/:id/movements', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { startDate, endDate, type, page = '1', limit = '50' } = req.query;

    const where: any = { productId: req.params.id };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (type) {
      where.type = type;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          lot: true,
          user: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.stockMovement.count({ where })
    ]);

    res.json({
      success: true,
      data: movements,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create product
router.post('/', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { code, name, description, categoryId, unit, isPerishable, minStock } = req.body;

    if (!code || !name || !categoryId) {
      throw new AppError('Código, nombre y categoría son requeridos', 400);
    }

    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) {
      throw new AppError('Ya existe un producto con ese código', 400);
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        description,
        categoryId,
        unit: unit || 'UNIT',
        isPerishable: isPerishable || false,
        minStock: minStock || 0
      },
      include: { category: true }
    });

    await auditService.log('Product', product.id, 'CREATE', req.user!.id, null, product);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/:id', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { code, name, description, categoryId, unit, isPerishable, minStock, isActive } = req.body;

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError('Producto no encontrado', 404);
    }

    if (code && code !== existing.code) {
      const duplicate = await prisma.product.findUnique({ where: { code } });
      if (duplicate) {
        throw new AppError('Ya existe un producto con ese código', 400);
      }
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { code, name, description, categoryId, unit, isPerishable, minStock, isActive },
      include: { category: true }
    });

    await auditService.log('Product', product.id, 'UPDATE', req.user!.id, existing, product);

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// Add lot to product
router.post('/:id/lots', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const { lotNumber, quantity, expiryDate, reason } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('La cantidad debe ser mayor a 0', 400);
    }

    const lot = await inventoryService.registerEntry(
      req.params.id,
      quantity,
      req.user!.id,
      lotNumber,
      expiryDate ? new Date(expiryDate) : undefined,
      reason
    );

    res.status(201).json({ success: true, data: lot });
  } catch (error) {
    next(error);
  }
});

// Update lot
router.put('/:id/lots/:lotId', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { lotNumber, quantity, expiryDate } = req.body;
    const { id: productId, lotId } = req.params;

    // Verificar que el lote existe y pertenece al producto
    const existingLot = await prisma.productLot.findFirst({
      where: { id: lotId, productId }
    });

    if (!existingLot) {
      throw new AppError('Lote no encontrado', 404);
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (lotNumber !== undefined) updateData.lotNumber = lotNumber;
    if (quantity !== undefined) {
      if (quantity < 0) throw new AppError('La cantidad no puede ser negativa', 400);
      updateData.quantity = quantity;
    }
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }

    const lot = await prisma.productLot.update({
      where: { id: lotId },
      data: updateData
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'ProductLot',
        entityId: lotId,
        oldValues: JSON.stringify(existingLot),
        newValues: JSON.stringify(updateData)
      }
    });

    res.json({ success: true, data: lot });
  } catch (error) {
    next(error);
  }
});

// Delete lot
router.delete('/:id/lots/:lotId', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id: productId, lotId } = req.params;
    const { reason } = req.body || {};

    // Verificar que el lote existe y pertenece al producto
    const existingLot = await prisma.productLot.findFirst({
      where: { id: lotId, productId }
    });

    if (!existingLot) {
      throw new AppError('Lote no encontrado', 404);
    }

    // Registrar movimiento de salida por eliminación (antes de desactivar)
    if (existingLot.quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId,
          lotId,
          type: 'EXIT',
          quantity: -existingLot.quantity,
          reason: reason || 'Lote eliminado',
          reference: `ELIMINACION-${lotId.substring(0, 8)}`,
          userId: req.user!.id
        }
      });
    }

    // Desactivar lote (soft delete)
    await prisma.productLot.update({
      where: { id: lotId },
      data: { isActive: false, quantity: 0 }
    });

    // Registrar en auditoría con el motivo
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'ProductLot',
        entityId: lotId,
        oldValues: JSON.stringify(existingLot),
        newValues: JSON.stringify({ reason: reason || 'Sin motivo especificado', deletedAt: new Date() })
      }
    });

    res.json({ success: true, message: 'Lote eliminado' });
  } catch (error) {
    next(error);
  }
});

// Get audit history for product
router.get('/:id/audit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;

    // Obtener historial de auditoría del producto y sus lotes
    const productAudits = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: 'Product', entityId: id },
          { entity: 'ProductLot', entityId: { in: (await prisma.productLot.findMany({ where: { productId: id }, select: { id: true } })).map(l => l.id) } }
        ]
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ success: true, data: productAudits });
  } catch (error) {
    next(error);
  }
});

// Get audit history for a specific lot
router.get('/:id/lots/:lotId/audit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { lotId } = req.params;

    const lotAudits = await prisma.auditLog.findMany({
      where: {
        entity: 'ProductLot',
        entityId: lotId
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ success: true, data: lotAudits });
  } catch (error) {
    next(error);
  }
});

// Delete (deactivate) product
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError('Producto no encontrado', 404);
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    await auditService.log('Product', product.id, 'DELETE', req.user!.id, existing, product);

    res.json({ success: true, message: 'Producto desactivado' });
  } catch (error) {
    next(error);
  }
});

export default router;
