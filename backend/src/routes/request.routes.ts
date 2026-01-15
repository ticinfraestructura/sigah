import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

// Request status values (SQLite doesn't support enums)
type RequestStatus = 'REGISTERED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'CANCELLED';
const RequestStatusValues: RequestStatus[] = ['REGISTERED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED'];
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

const router = Router();

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  REGISTERED: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['APPROVED', 'REJECTED', 'REGISTERED'],
  APPROVED: ['DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED'],
  REJECTED: ['REGISTERED'],
  DELIVERED: [],
  PARTIALLY_DELIVERED: ['DELIVERED'],
  CANCELLED: ['REGISTERED']
};

// Generate request code
function generateRequestCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SOL-${year}-${random}`;
}

// Get all requests with filters
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      status, 
      beneficiaryId, 
      startDate, 
      endDate, 
      search,
      page = '1', 
      limit = '50' 
    } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (beneficiaryId) {
      where.beneficiaryId = beneficiaryId;
    }

    if (startDate && endDate) {
      where.requestDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { beneficiary: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { beneficiary: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { beneficiary: { documentNumber: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          beneficiary: true,
          requestProducts: { include: { product: true } },
          requestKits: { include: { kit: true } },
          createdBy: { select: { firstName: true, lastName: true } }
        },
        orderBy: { requestDate: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.request.count({ where })
    ]);

    res.json({
      success: true,
      data: requests,
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

// Get request by ID with full details
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const request = await prisma.request.findUnique({
      where: { id: req.params.id },
      include: {
        beneficiary: true,
        requestProducts: { include: { product: { include: { category: true } } } },
        requestKits: { include: { kit: { include: { kitProducts: { include: { product: true } } } } } },
        deliveries: {
          include: {
            deliveryDetails: { include: { product: true, kit: true, lot: true } },
            deliveredBy: { select: { firstName: true, lastName: true } }
          }
        },
        histories: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        },
        createdBy: { select: { firstName: true, lastName: true } }
      }
    });

    if (!request) {
      throw new AppError('Solicitud no encontrada', 404);
    }

    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

// Create request
router.post('/', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { beneficiaryId, products, kits, priority, notes } = req.body;

    if (!beneficiaryId) {
      throw new AppError('Beneficiario es requerido', 400);
    }

    if ((!products || products.length === 0) && (!kits || kits.length === 0)) {
      throw new AppError('Debe solicitar al menos un producto o kit', 400);
    }

    const beneficiary = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId } });
    if (!beneficiary || !beneficiary.isActive) {
      throw new AppError('Beneficiario no encontrado o inactivo', 404);
    }

    const request = await prisma.request.create({
      data: {
        code: generateRequestCode(),
        beneficiaryId,
        priority: priority || 0,
        notes,
        createdById: req.user!.id,
        requestProducts: products ? {
          create: products.map((p: { productId: string; quantity: number }) => ({
            productId: p.productId,
            quantityRequested: p.quantity
          }))
        } : undefined,
        requestKits: kits ? {
          create: kits.map((k: { kitId: string; quantity: number }) => ({
            kitId: k.kitId,
            quantityRequested: k.quantity
          }))
        } : undefined,
        histories: {
          create: {
            toStatus: 'REGISTERED',
            userId: req.user!.id,
            notes: 'Solicitud creada'
          }
        }
      },
      include: {
        beneficiary: true,
        requestProducts: { include: { product: true } },
        requestKits: { include: { kit: true } }
      }
    });

    await auditService.log('Request', request.id, 'CREATE', req.user!.id, null, request);

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

// Update request status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { status, notes } = req.body;

    if (!status) {
      throw new AppError('Estado es requerido', 400);
    }

    const request = await prisma.request.findUnique({ where: { id: req.params.id } });
    if (!request) {
      throw new AppError('Solicitud no encontrada', 404);
    }

    // Validate transition
    const validTransitions = VALID_TRANSITIONS[request.status];
    if (!validTransitions.includes(status)) {
      throw new AppError(`Transición de estado inválida: ${request.status} -> ${status}`, 400);
    }

    // Determine operation type for audit
    type AuditOp = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'REACTIVATE' | 'APPROVE' | 'REJECT' | 'DELIVER' | 'STATUS_CHANGE';
    let operation: AuditOp = 'STATUS_CHANGE';
    let operationLabel = `Cambio de estado: ${request.status} → ${status}`;
    
    if (status === 'CANCELLED') {
      operation = 'CANCEL';
      operationLabel = 'Solicitud cancelada';
    } else if (request.status === 'CANCELLED' && status === 'REGISTERED') {
      operation = 'REACTIVATE';
      operationLabel = 'Solicitud reactivada';
    } else if (status === 'APPROVED') {
      operation = 'APPROVE';
      operationLabel = 'Solicitud aprobada';
    } else if (status === 'REJECTED') {
      operation = 'REJECT';
      operationLabel = 'Solicitud rechazada';
    } else if (status === 'DELIVERED') {
      operation = 'DELIVER';
      operationLabel = 'Solicitud entregada';
    }

    const updatedRequest = await prisma.request.update({
      where: { id: req.params.id },
      data: {
        status,
        histories: {
          create: {
            fromStatus: request.status,
            toStatus: status,
            userId: req.user!.id,
            notes: notes || operationLabel
          }
        }
      },
      include: {
        beneficiary: true,
        histories: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    await auditService.log(
      'Request', 
      request.id, 
      operation, 
      req.user!.id, 
      { status: request.status, code: request.code }, 
      { status, operation: operationLabel }
    );

    res.json({ success: true, data: updatedRequest });
  } catch (error) {
    next(error);
  }
});

// Update request items
router.put('/:id', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { products, kits, priority, notes } = req.body;

    const existing = await prisma.request.findUnique({ 
      where: { id: req.params.id },
      include: { requestProducts: true, requestKits: true }
    });

    if (!existing) {
      throw new AppError('Solicitud no encontrada', 404);
    }

    if (!['REGISTERED', 'IN_REVIEW'].includes(existing.status)) {
      throw new AppError('Solo se pueden editar solicitudes en estado Registrada o En Revisión', 400);
    }

    const request = await prisma.$transaction(async (tx) => {
      // Update basic info
      await tx.request.update({
        where: { id: req.params.id },
        data: { priority, notes }
      });

      // Replace products if provided
      if (products) {
        await tx.requestProduct.deleteMany({ where: { requestId: req.params.id } });
        for (const p of products) {
          await tx.requestProduct.create({
            data: {
              requestId: req.params.id,
              productId: p.productId,
              quantityRequested: p.quantity
            }
          });
        }
      }

      // Replace kits if provided
      if (kits) {
        await tx.requestKit.deleteMany({ where: { requestId: req.params.id } });
        for (const k of kits) {
          await tx.requestKit.create({
            data: {
              requestId: req.params.id,
              kitId: k.kitId,
              quantityRequested: k.quantity
            }
          });
        }
      }

      return tx.request.findUnique({
        where: { id: req.params.id },
        include: {
          beneficiary: true,
          requestProducts: { include: { product: true } },
          requestKits: { include: { kit: true } }
        }
      });
    });

    await auditService.log('Request', existing.id, 'UPDATE', req.user!.id, existing, request);

    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

// Get requests history
router.get('/:id/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const histories = await prisma.requestHistory.findMany({
      where: { requestId: req.params.id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: histories });
  } catch (error) {
    next(error);
  }
});

// Get requests by status counts
router.get('/stats/by-status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const counts = await prisma.request.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const stats = RequestStatusValues.reduce((acc, status) => {
      const found = counts.find(c => c.status === status);
      acc[status] = found ? found._count.id : 0;
      return acc;
    }, {} as Record<string, number>);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;
