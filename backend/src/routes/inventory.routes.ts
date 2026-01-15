import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { InventoryService } from '../services/inventory.service';
import { logAuditAction } from '../services/audit-advanced.service';

const router = Router();

// Get current stock summary
router.get('/stock', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { categoryId, isPerishable, lowStock } = req.query;

    const where: any = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isPerishable !== undefined) {
      where.isPerishable = isPerishable === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        lots: { where: { isActive: true, quantity: { gt: 0 } } }
      },
      orderBy: { name: 'asc' }
    });

    let stockData = products.map(product => ({
      id: product.id,
      code: product.code,
      name: product.name,
      category: product.category.name,
      unit: product.unit,
      isPerishable: product.isPerishable,
      minStock: product.minStock,
      totalStock: product.lots.reduce((sum, lot) => sum + lot.quantity, 0),
      lots: product.lots.length,
      isLowStock: product.lots.reduce((sum, lot) => sum + lot.quantity, 0) < product.minStock
    }));

    // Filter low stock if requested
    if (lowStock === 'true') {
      stockData = stockData.filter(p => p.isLowStock);
    }

    res.json({ success: true, data: stockData });
  } catch (error) {
    next(error);
  }
});

// Get all movements with filters
router.get('/movements', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      productId, 
      type, 
      startDate, 
      endDate, 
      page = '1', 
      limit = '50' 
    } = req.query;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { include: { category: true } },
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

// Get expiring products
router.get('/expiring', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const daysAhead = parseInt(req.query.days as string) || 30;

    const expiringProducts = await inventoryService.getExpiringProducts(daysAhead);

    res.json({ success: true, data: expiringProducts });
  } catch (error) {
    next(error);
  }
});

// Get low stock products
router.get('/low-stock', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);

    const lowStockProducts = await inventoryService.getLowStockProducts();

    res.json({ success: true, data: lowStockProducts });
  } catch (error) {
    next(error);
  }
});

// Get stock by category
router.get('/by-category', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);

    const stockByCategory = await inventoryService.getStockByCategory();

    res.json({ success: true, data: stockByCategory });
  } catch (error) {
    next(error);
  }
});

// Manual stock adjustment
router.post('/adjustment', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const { productId, lotId, quantity, reason } = req.body;

    if (!productId || !lotId || quantity === undefined || !reason) {
      throw new AppError('Producto, lote, cantidad y motivo son requeridos', 400);
    }

    // Obtener datos antes del ajuste para auditoría
    const lotBefore = await prisma.productLot.findUnique({
      where: { id: lotId },
      include: { product: true }
    });

    const result = await inventoryService.registerAdjustment(
      productId,
      lotId,
      quantity,
      req.user!.id,
      reason
    );

    // Registrar en auditoría
    await logAuditAction(
      'INVENTORY_ADJUSTMENT',
      lotId,
      'ADJUSTMENT',
      req.user!.id,
      { 
        productId, 
        productName: lotBefore?.product?.name,
        lotNumber: lotBefore?.lotNumber,
        quantityBefore: lotBefore?.quantity 
      },
      { 
        productId, 
        productName: lotBefore?.product?.name,
        lotNumber: lotBefore?.lotNumber,
        quantityAfter: result.newQuantity,
        adjustmentAmount: quantity,
        reason,
        adjustedBy: `${req.user!.firstName} ${req.user!.lastName}`
      }
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Manual stock entry
router.post('/entry', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const { productId, quantity, lotNumber, expiryDate, reason } = req.body;

    if (!productId || !quantity) {
      throw new AppError('Producto y cantidad son requeridos', 400);
    }

    // Obtener nombre del producto para auditoría
    const product = await prisma.product.findUnique({ where: { id: productId } });

    const lot = await inventoryService.registerEntry(
      productId,
      quantity,
      req.user!.id,
      lotNumber,
      expiryDate ? new Date(expiryDate) : undefined,
      reason
    );

    // Registrar en auditoría
    await logAuditAction(
      'INVENTORY_ENTRY',
      lot.id,
      'CREATE',
      req.user!.id,
      null,
      { 
        productId, 
        productName: product?.name,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantity,
        expiryDate,
        reason: reason || 'Entrada de inventario',
        enteredBy: `${req.user!.firstName} ${req.user!.lastName}`
      }
    );

    res.json({ success: true, data: lot });
  } catch (error) {
    next(error);
  }
});

// Get stock summary stats
router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);

    const [
      totalProducts,
      totalLots,
      expiringIn30Days,
      lowStockProducts,
      stockByCategory
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.productLot.count({ where: { isActive: true, quantity: { gt: 0 } } }),
      inventoryService.getExpiringProducts(30).then(p => p.length),
      inventoryService.getLowStockProducts().then(p => p.length),
      inventoryService.getStockByCategory()
    ]);

    const totalStock = stockByCategory.reduce((sum, cat) => sum + cat.totalStock, 0);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalLots,
        totalStock,
        expiringIn30Days,
        lowStockProducts,
        stockByCategory
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
