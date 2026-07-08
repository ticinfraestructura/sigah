import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { InventoryService } from '../services/inventory.service';
import { dashboardZodSchemas, validateZodRequest } from '../middleware/validation.middleware';

const router = Router();

// Get dashboard summary
router.get('/summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);

    const [
      totalProducts,
      expiringProducts,
      lowStockProducts,
      stockByCategory,
      totalKits,
      totalUsers
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      inventoryService.getExpiringProducts(30),
      inventoryService.getLowStockProducts(),
      inventoryService.getStockByCategory(),
      prisma.kit.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } })
    ]);

    // Total stock
    const totalStock = stockByCategory.reduce((sum: number, cat: any) => sum + cat.totalStock, 0);

    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalStock,
          totalKits,
          totalUsers,
          expiringProducts: expiringProducts.length,
          lowStockProducts: lowStockProducts.length
        },
        stockByCategory,
        alerts: {
          expiring: expiringProducts.slice(0, 5),
          lowStock: lowStockProducts.slice(0, 5)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get chart data
router.get('/charts', authenticate, validateZodRequest({ query: dashboardZodSchemas.chartsQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const months = Number(req.query.months) || 6;

    // Get movements by month
    const movementsByMonth = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [entries, exits] = await Promise.all([
        prisma.stockMovement.aggregate({
          where: {
            type: 'ENTRY',
            createdAt: { gte: startOfMonth, lte: endOfMonth }
          },
          _sum: { quantity: true }
        }),
        prisma.stockMovement.aggregate({
          where: {
            type: 'EXIT',
            createdAt: { gte: startOfMonth, lte: endOfMonth }
          },
          _sum: { quantity: true }
        })
      ]);

      movementsByMonth.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        entries: entries._sum.quantity || 0,
        exits: Math.abs(exits._sum.quantity || 0)
      });
    }

    res.json({
      success: true,
      data: {
        movementsByMonth
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get recent activity
router.get('/activity', authenticate, validateZodRequest({ query: dashboardZodSchemas.activityQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const limit = Number(req.query.limit) || 10;

    const recentMovements = await prisma.stockMovement.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        user: { select: { firstName: true, lastName: true } }
      }
    });

    res.json({
      success: true,
      data: {
        recentMovements
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
