import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { InventoryService } from '../services/inventory.service';

const router = Router();

// Get dashboard summary
router.get('/summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalProducts,
      totalBeneficiaries,
      requestsByStatus,
      deliveriesThisMonth,
      expiringProducts,
      lowStockProducts,
      stockByCategory,
      deliveriesByStatus,
      pendingDeliveryTasks
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.beneficiary.count({ where: { isActive: true } }),
      prisma.request.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.delivery.count({
        where: {
          deliveryDate: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      inventoryService.getExpiringProducts(30),
      inventoryService.getLowStockProducts(),
      inventoryService.getStockByCategory(),
      // Entregas agrupadas por estado
      prisma.delivery.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      // Entregas pendientes con detalles para tareas
      prisma.delivery.findMany({
        where: {
          status: {
            in: ['PENDING_AUTHORIZATION', 'AUTHORIZED', 'RECEIVED_WAREHOUSE', 'IN_PREPARATION', 'READY']
          }
        },
        include: {
          request: {
            include: {
              beneficiary: {
                select: { firstName: true, lastName: true, documentNumber: true }
              }
            }
          },
          createdBy: { select: { firstName: true, lastName: true } },
          authorizedBy: { select: { firstName: true, lastName: true } },
          preparedBy: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'asc' },
        take: 20
      })
    ]);

    // Calculate total requests
    const totalRequests = requestsByStatus.reduce((sum, s) => sum + s._count.id, 0);
    const pendingRequests = requestsByStatus
      .filter(s => ['REGISTERED', 'IN_REVIEW', 'APPROVED'].includes(s.status))
      .reduce((sum, s) => sum + s._count.id, 0);

    // Total stock
    const totalStock = stockByCategory.reduce((sum, cat) => sum + cat.totalStock, 0);

    // Conteo de entregas por estado
    const deliveryStats = deliveriesByStatus.reduce((acc: any, s: any) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar tareas por rol responsable
    const tasksByRole = {
      AUTHORIZER: pendingDeliveryTasks.filter((d: any) => d.status === 'PENDING_AUTHORIZATION'),
      WAREHOUSE: pendingDeliveryTasks.filter((d: any) => 
        ['AUTHORIZED', 'RECEIVED_WAREHOUSE', 'IN_PREPARATION'].includes(d.status)
      ),
      DISPATCHER: pendingDeliveryTasks.filter((d: any) => d.status === 'READY')
    };

    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalStock,
          totalBeneficiaries,
          totalRequests,
          pendingRequests,
          deliveriesThisMonth,
          expiringProducts: expiringProducts.length,
          lowStockProducts: lowStockProducts.length,
          // Nuevos KPIs de entregas
          deliveriesReady: deliveryStats['READY'] || 0,
          deliveriesPendingAuth: deliveryStats['PENDING_AUTHORIZATION'] || 0,
          deliveriesInProgress: (deliveryStats['AUTHORIZED'] || 0) + 
            (deliveryStats['RECEIVED_WAREHOUSE'] || 0) + 
            (deliveryStats['IN_PREPARATION'] || 0)
        },
        requestsByStatus: requestsByStatus.reduce((acc, s) => {
          acc[s.status] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        deliveriesByStatus: deliveryStats,
        stockByCategory,
        alerts: {
          expiring: expiringProducts.slice(0, 5),
          lowStock: lowStockProducts.slice(0, 5)
        },
        // Tareas pendientes por rol
        pendingTasks: {
          forAuthorizer: tasksByRole.AUTHORIZER.length,
          forWarehouse: tasksByRole.WAREHOUSE.length,
          forDispatcher: tasksByRole.DISPATCHER.length,
          details: {
            authorizer: tasksByRole.AUTHORIZER.slice(0, 5),
            warehouse: tasksByRole.WAREHOUSE.slice(0, 5),
            dispatcher: tasksByRole.DISPATCHER.slice(0, 5)
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get chart data
router.get('/charts', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const months = parseInt(req.query.months as string) || 6;

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

    // Get most delivered kits
    const kitDeliveries = await prisma.deliveryDetail.groupBy({
      by: ['kitId'],
      where: { kitId: { not: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const kitsWithNames = await Promise.all(
      kitDeliveries.map(async (kd) => {
        const kit = await prisma.kit.findUnique({ where: { id: kd.kitId! } });
        return {
          name: kit?.name || 'Desconocido',
          quantity: kd._sum.quantity || 0
        };
      })
    );

    // Get deliveries by month
    const deliveriesByMonth = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await prisma.delivery.count({
        where: { deliveryDate: { gte: startOfMonth, lte: endOfMonth } }
      });

      deliveriesByMonth.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        deliveries: count
      });
    }

    // Requests by type of aid
    const requestsByType = await prisma.requestKit.groupBy({
      by: ['kitId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const typesWithNames = await Promise.all(
      requestsByType.map(async (rt) => {
        const kit = await prisma.kit.findUnique({ where: { id: rt.kitId } });
        return {
          name: kit?.name || 'Productos individuales',
          count: rt._count.id
        };
      })
    );

    res.json({
      success: true,
      data: {
        movementsByMonth,
        deliveriesByMonth,
        mostDeliveredKits: kitsWithNames,
        requestsByAidType: typesWithNames
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get recent activity
router.get('/activity', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const limit = parseInt(req.query.limit as string) || 10;

    const [recentRequests, recentDeliveries, recentMovements] = await Promise.all([
      prisma.request.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          beneficiary: true,
          createdBy: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.delivery.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          request: { include: { beneficiary: true } },
          deliveredBy: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.stockMovement.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          user: { select: { firstName: true, lastName: true } }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        recentRequests,
        recentDeliveries,
        recentMovements
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
