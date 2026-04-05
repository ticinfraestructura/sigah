import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { InventoryService } from '../services/inventory.service';
import { returnZodSchemas, validateZodRequest } from '../middleware/validation.middleware';

const router = Router();

// Get all returns
router.get('/', authenticate, validateZodRequest({ query: returnZodSchemas.listQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { deliveryId, reason, startDate, endDate, page = 1, limit = 50 } = req.query as {
      deliveryId?: string;
      reason?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    };

    const where: any = {};

    if (deliveryId) {
      where.deliveryId = deliveryId;
    }

    if (reason) {
      where.reason = reason;
    }

    if (startDate && endDate) {
      where.returnDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          delivery: {
            include: {
              request: { include: { beneficiary: true } }
            }
          },
          processedBy: { select: { firstName: true, lastName: true } },
          returnDetails: { include: { product: true, lot: true } }
        },
        orderBy: { returnDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.return.count({ where })
    ]);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get return by ID
router.get('/:id', authenticate, validateZodRequest({ params: returnZodSchemas.idParam }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const returnRecord = await prisma.return.findUnique({
      where: { id: req.params.id },
      include: {
        delivery: {
          include: {
            request: { include: { beneficiary: true } },
            deliveryDetails: { include: { product: true, kit: true } }
          }
        },
        processedBy: { select: { firstName: true, lastName: true } },
        returnDetails: { include: { product: true, lot: true } }
      }
    });

    if (!returnRecord) {
      throw new AppError('Devolución no encontrada', 404);
    }

    res.json({ success: true, data: returnRecord });
  } catch (error) {
    next(error);
  }
});

// Create return (adds back to inventory if in good condition)
router.post('/', authenticate, authorize('ADMIN', 'WAREHOUSE'), validateZodRequest({ body: returnZodSchemas.create }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const auditService = new AuditService(prisma);
    const { deliveryId, reason, items, notes } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        request: true,
        deliveryDetails: { include: { product: true, lot: true } }
      }
    });

    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }

    // Process return in transaction
    const returnRecord = await prisma.$transaction(async (tx) => {
      const returnDetails: any[] = [];

      for (const item of items) {
        const { productId, quantity, condition, lotId } = item;

        // Validate quantity doesn't exceed delivered
        const deliveredItem = delivery.deliveryDetails.find(
          d => d.productId === productId && (!lotId || d.lotId === lotId)
        );
        
        if (!deliveredItem) {
          throw new AppError('Producto no encontrado en la entrega', 400);
        }

        // Only add to inventory if condition is GOOD
        if (condition === 'GOOD') {
          if (lotId) {
            // Return to original lot
            await tx.productLot.update({
              where: { id: lotId },
              data: { quantity: { increment: quantity } }
            });
          } else {
            // Create return lot
            await tx.productLot.create({
              data: {
                productId,
                lotNumber: `RET-${Date.now()}`,
                quantity
              }
            });
          }

          // Record movement
          await tx.stockMovement.create({
            data: {
              productId,
              lotId,
              type: 'RETURN',
              quantity,
              reason: `Devolución: ${reason}`,
              reference: deliveryId,
              userId: req.user!.id
            }
          });
        }

        returnDetails.push({
          productId,
          lotId,
          quantity,
          condition
        });
      }

      // Create return record
      const newReturn = await tx.return.create({
        data: {
          deliveryId,
          reason,
          processedById: req.user!.id,
          notes,
          returnDetails: {
            create: returnDetails
          }
        },
        include: {
          returnDetails: { include: { product: true, lot: true } }
        }
      });

      return newReturn;
    });

    await auditService.log('Return', returnRecord.id, 'CREATE', req.user!.id, null, returnRecord);

    res.status(201).json({ success: true, data: returnRecord });
  } catch (error) {
    next(error);
  }
});

// Get return reasons stats
router.get('/stats/by-reason', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const stats = await prisma.return.groupBy({
      by: ['reason'],
      _count: { id: true }
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;
