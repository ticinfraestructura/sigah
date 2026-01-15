import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { InventoryService } from '../services/inventory.service';
import { NotificationService } from './notification.routes';

const router = Router();

// Delivery status constants - NUEVO FLUJO
// Flujo: Solicitud Aprobada -> PENDING_AUTHORIZATION -> AUTHORIZED -> RECEIVED_WAREHOUSE -> IN_PREPARATION -> READY -> DELIVERED
const DeliveryStatus = {
  PENDING_AUTHORIZATION: 'PENDING_AUTHORIZATION',  // Esperando autorización
  AUTHORIZED: 'AUTHORIZED',                        // Autorizada, notificar a bodega
  RECEIVED_WAREHOUSE: 'RECEIVED_WAREHOUSE',        // Recibida en bodega
  IN_PREPARATION: 'IN_PREPARATION',                // En preparación
  READY: 'READY',                                  // Lista, notificar a despachador
  DELIVERED: 'DELIVERED',                          // Entregada al beneficiario
  CANCELLED: 'CANCELLED'                           // Cancelada
} as const;

// Roles permitidos por paso
const ROLE_PERMISSIONS = {
  CREATE: ['ADMIN', 'WAREHOUSE', 'AUTHORIZER'],           // Crear solicitud de entrega
  AUTHORIZE: ['ADMIN', 'AUTHORIZER'],                     // Autorizar
  RECEIVE_WAREHOUSE: ['ADMIN', 'WAREHOUSE'],              // Recibir en bodega
  PREPARE: ['ADMIN', 'WAREHOUSE'],                        // Preparar
  MARK_READY: ['ADMIN', 'WAREHOUSE'],                     // Marcar lista
  DELIVER: ['ADMIN', 'DISPATCHER'],                       // Entregar al beneficiario
  CANCEL: ['ADMIN']                                       // Cancelar
};

// Generate delivery code
function generateDeliveryCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ENT-${year}-${random}`;
}

// Validar segregación de funciones
function validateSegregation(delivery: any, userId: string, action: string): void {
  const errors: string[] = [];
  
  switch (action) {
    case 'AUTHORIZE':
      // El autorizador no puede ser quien creó la entrega
      if (delivery.createdById === userId) {
        errors.push('El autorizador no puede ser la misma persona que creó la solicitud de entrega');
      }
      break;
    case 'RECEIVE_WAREHOUSE':
      // El que recibe en bodega no puede ser el autorizador
      if (delivery.authorizedById === userId) {
        errors.push('Quien recibe en bodega no puede ser la misma persona que autorizó');
      }
      break;
    case 'PREPARE':
      // El que prepara puede ser diferente al que recibe, pero no el autorizador
      if (delivery.authorizedById === userId) {
        errors.push('Quien prepara no puede ser la misma persona que autorizó');
      }
      break;
    case 'DELIVER':
      // El que entrega no puede ser quien autorizó ni quien preparó
      if (delivery.authorizedById === userId) {
        errors.push('Quien entrega no puede ser la misma persona que autorizó');
      }
      if (delivery.preparedById === userId) {
        errors.push('Quien entrega no puede ser la misma persona que preparó');
      }
      break;
  }
  
  if (errors.length > 0) {
    throw new AppError(`Segregación de funciones: ${errors.join('. ')}`, 403);
  }
}

// Get all deliveries with filters
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      requestId, 
      status,
      startDate, 
      endDate, 
      warehouseUserId,
      page = '1', 
      limit = '50' 
    } = req.query;

    const where: any = {};

    if (requestId) where.requestId = requestId;
    if (status) where.status = status;
    if (warehouseUserId) where.warehouseUserId = warehouseUserId;

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          request: {
            include: { beneficiary: true }
          },
          createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
          authorizedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
          warehouseUser: { select: { id: true, firstName: true, lastName: true, role: true } },
          preparedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
          deliveredBy: { select: { id: true, firstName: true, lastName: true, role: true } },
          deliveryDetails: {
            include: { product: true, kit: true, lot: true }
          },
          history: {
            include: { user: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.delivery.count({ where })
    ]);

    res.json({
      success: true,
      data: deliveries,
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

// Get delivery by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        request: {
          include: {
            beneficiary: true,
            requestProducts: { include: { product: true } },
            requestKits: { include: { kit: { include: { kitProducts: { include: { product: true } } } } } }
          }
        },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        authorizedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        warehouseUser: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        preparedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        deliveredBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        deliveryDetails: {
          include: { product: true, kit: true, lot: true }
        },
        history: {
          include: { user: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        },
        returns: {
          include: { returnDetails: true }
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
});

// ============ PASO 1: Crear solicitud de entrega (pendiente de autorización) ============
router.post('/', authenticate, authorize('ADMIN', 'WAREHOUSE', 'AUTHORIZER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const notificationService = new NotificationService(prisma);
    const { requestId, products, kits, notes, isPartial } = req.body;

    if (!requestId) {
      throw new AppError('Solicitud es requerida', 400);
    }

    if ((!products || products.length === 0) && (!kits || kits.length === 0)) {
      throw new AppError('Debe incluir al menos un producto o kit', 400);
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        beneficiary: true,
        requestProducts: true,
        requestKits: { include: { kit: { include: { kitProducts: true } } } }
      }
    });

    if (!request) {
      throw new AppError('Solicitud no encontrada', 404);
    }

    if (!['APPROVED', 'PARTIALLY_DELIVERED'].includes(request.status)) {
      throw new AppError('La solicitud debe estar Aprobada para crear entregas', 400);
    }

    // Verificar si ya existe una entrega pendiente de autorización para esta solicitud
    const existingPendingDelivery = await prisma.delivery.findFirst({
      where: {
        requestId,
        status: DeliveryStatus.PENDING_AUTHORIZATION
      }
    });

    if (existingPendingDelivery) {
      throw new AppError('Ya existe una entrega pendiente de autorización para esta solicitud. Espere a que sea procesada.', 400);
    }

    // Validar cantidades
    const deliveryDetails: any[] = [];
    
    if (products && products.length > 0) {
      for (const item of products) {
        const requestProduct = request.requestProducts.find(rp => rp.productId === item.productId);
        if (requestProduct) {
          const remaining = requestProduct.quantityRequested - requestProduct.quantityDelivered;
          if (item.quantity > remaining) {
            throw new AppError(`Cantidad excede lo pendiente para el producto`, 400);
          }
        }
        deliveryDetails.push({ productId: item.productId, quantity: item.quantity });
      }
    }

    if (kits && kits.length > 0) {
      for (const item of kits) {
        const requestKit = request.requestKits.find(rk => rk.kitId === item.kitId);
        if (requestKit) {
          const remaining = requestKit.quantityRequested - requestKit.quantityDelivered;
          if (item.quantity > remaining) {
            throw new AppError(`Cantidad excede lo pendiente para el kit`, 400);
          }
        }
        deliveryDetails.push({ kitId: item.kitId, quantity: item.quantity });
      }
    }

    // Crear entrega en estado pendiente de autorización
    const delivery = await prisma.delivery.create({
      data: {
        code: generateDeliveryCode(),
        requestId,
        status: DeliveryStatus.PENDING_AUTHORIZATION,
        createdById: req.user!.id,
        notes,
        isPartial: isPartial || false,
        deliveryDetails: {
          create: deliveryDetails
        },
        history: {
          create: {
            toStatus: DeliveryStatus.PENDING_AUTHORIZATION,
            userId: req.user!.id,
            notes: 'Solicitud de entrega creada - Pendiente de autorización'
          }
        }
      },
      include: {
        request: { include: { beneficiary: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        deliveryDetails: { include: { product: true, kit: true } },
        history: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    // Notificar a los autorizadores
    await notificationService.notifyByRole('AUTHORIZER', {
      type: 'DELIVERY_PENDING_AUTH',
      title: 'Nueva entrega pendiente de autorización',
      message: `La entrega ${delivery.code} para ${request.beneficiary.firstName} ${request.beneficiary.lastName} requiere su autorización.`,
      senderId: req.user!.id,
      deliveryId: delivery.id,
      priority: 'HIGH',
      actionUrl: `/deliveries?id=${delivery.id}`
    });

    // También notificar a admins
    await notificationService.notifyByRole('ADMIN', {
      type: 'DELIVERY_PENDING_AUTH',
      title: 'Nueva entrega pendiente de autorización',
      message: `La entrega ${delivery.code} para ${request.beneficiary.firstName} ${request.beneficiary.lastName} requiere autorización.`,
      senderId: req.user!.id,
      deliveryId: delivery.id,
      priority: 'NORMAL',
      actionUrl: `/deliveries?id=${delivery.id}`
    });

    await auditService.log('Delivery', delivery.id, 'CREATE', req.user!.id, null, delivery);

    res.status(201).json({ success: true, data: delivery, message: 'Solicitud de entrega creada. Notificación enviada a autorizadores.' });
  } catch (error) {
    next(error);
  }
});

// ============ PASO 2: Autorizar entrega (AUTHORIZER o ADMIN) ============
router.post('/:id/authorize', authenticate, authorize('ADMIN', 'AUTHORIZER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const notificationService = new NotificationService(prisma);
    const { notes, isPartialAuth, authorizedQuantities } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { request: { include: { beneficiary: true } } }
    });

    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }

    if (delivery.status !== DeliveryStatus.PENDING_AUTHORIZATION) {
      throw new AppError('La entrega no está pendiente de autorización', 400);
    }

    // Validar segregación de funciones
    validateSegregation(delivery, req.user!.id, 'AUTHORIZE');

    const updated = await prisma.delivery.update({
      where: { id: req.params.id },
      data: {
        status: DeliveryStatus.AUTHORIZED,
        authorizedById: req.user!.id,
        authorizationDate: new Date(),
        authorizationNotes: notes,
        isPartialAuth: isPartialAuth || false,
        authorizedQuantity: authorizedQuantities ? JSON.stringify(authorizedQuantities) : null,
        history: {
          create: {
            fromStatus: delivery.status,
            toStatus: DeliveryStatus.AUTHORIZED,
            userId: req.user!.id,
            notes: notes || `Entrega ${isPartialAuth ? 'parcialmente ' : ''}autorizada`
          }
        }
      },
      include: {
        request: { include: { beneficiary: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        authorizedBy: { select: { firstName: true, lastName: true } },
        deliveryDetails: { include: { product: true, kit: true } },
        history: { include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }
      }
    });

    // Notificar a bodega que hay una entrega autorizada para recibir
    await notificationService.notifyByRole('WAREHOUSE', {
      type: 'DELIVERY_AUTHORIZED',
      title: 'Entrega autorizada - Pendiente recepción en bodega',
      message: `La entrega ${delivery.code} ha sido autorizada y está lista para ser recibida en bodega.`,
      senderId: req.user!.id,
      deliveryId: delivery.id,
      priority: 'HIGH',
      actionUrl: `/deliveries?id=${delivery.id}`
    });

    await auditService.log('Delivery', delivery.id, 'UPDATE', req.user!.id, { status: delivery.status }, { status: updated.status });

    res.json({ success: true, data: updated, message: 'Entrega autorizada. Notificación enviada a bodega.' });
  } catch (error) {
    next(error);
  }
});

// ============ PASO 3: Recibir en bodega (WAREHOUSE) ============
router.post('/:id/receive-warehouse', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const notificationService = new NotificationService(prisma);
    const { notes } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { request: { include: { beneficiary: true } } }
    });

    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }

    if (delivery.status !== DeliveryStatus.AUTHORIZED) {
      throw new AppError('La entrega debe estar autorizada para ser recibida en bodega', 400);
    }

    // Validar segregación de funciones
    validateSegregation(delivery, req.user!.id, 'RECEIVE_WAREHOUSE');

    const updated = await prisma.delivery.update({
      where: { id: req.params.id },
      data: {
        status: DeliveryStatus.RECEIVED_WAREHOUSE,
        warehouseUserId: req.user!.id,
        warehouseReceivedDate: new Date(),
        warehouseNotes: notes,
        history: {
          create: {
            fromStatus: delivery.status,
            toStatus: DeliveryStatus.RECEIVED_WAREHOUSE,
            userId: req.user!.id,
            notes: notes || 'Orden recibida en bodega'
          }
        }
      },
      include: {
        request: { include: { beneficiary: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        authorizedBy: { select: { firstName: true, lastName: true } },
        warehouseUser: { select: { firstName: true, lastName: true } },
        deliveryDetails: { include: { product: true, kit: true } },
        history: { include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }
      }
    });

    await auditService.log('Delivery', delivery.id, 'UPDATE', req.user!.id, { status: delivery.status }, { status: updated.status });

    res.json({ success: true, data: updated, message: 'Orden recibida en bodega. Puede iniciar la preparación.' });
  } catch (error) {
    next(error);
  }
});

// ============ PASO 4: Iniciar preparación en bodega ============
router.post('/:id/prepare', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { notes } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { request: { include: { beneficiary: true } } }
    });

    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }

    if (delivery.status !== DeliveryStatus.RECEIVED_WAREHOUSE) {
      throw new AppError('La entrega debe estar recibida en bodega para iniciar preparación', 400);
    }

    // Validar segregación de funciones
    validateSegregation(delivery, req.user!.id, 'PREPARE');

    const updated = await prisma.delivery.update({
      where: { id: req.params.id },
      data: {
        status: DeliveryStatus.IN_PREPARATION,
        preparedById: req.user!.id,
        preparationDate: new Date(),
        preparationNotes: notes,
        history: {
          create: {
            fromStatus: delivery.status,
            toStatus: DeliveryStatus.IN_PREPARATION,
            userId: req.user!.id,
            notes: notes || 'Preparación iniciada en bodega'
          }
        }
      },
      include: {
        request: { include: { beneficiary: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        authorizedBy: { select: { firstName: true, lastName: true } },
        warehouseUser: { select: { firstName: true, lastName: true } },
        preparedBy: { select: { firstName: true, lastName: true } },
        deliveryDetails: { include: { product: true, kit: true, lot: true } },
        history: { include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }
      }
    });

    await auditService.log('Delivery', delivery.id, 'UPDATE', req.user!.id, { status: delivery.status }, { status: updated.status });

    res.json({ success: true, data: updated, message: 'Preparación iniciada' });
  } catch (error) {
    next(error);
  }
});

// ============ PASO 5: Marcar como lista para entrega (descuenta inventario) ============
router.post('/:id/ready', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const auditService = new AuditService(prisma);
    const notificationService = new NotificationService(prisma);
    const { notes } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        request: {
          include: {
            requestProducts: true,
            requestKits: { include: { kit: { include: { kitProducts: true } } } }
          }
        },
        deliveryDetails: true
      }
    });

    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }

    if (delivery.status !== DeliveryStatus.IN_PREPARATION) {
      throw new AppError('La entrega debe estar en preparación', 400);
    }

    // Procesar descuento de inventario en transacción
    const updated = await prisma.$transaction(async (tx) => {
      const updatedDetails: any[] = [];

      for (const detail of delivery.deliveryDetails) {
        if (detail.productId) {
          // Asignar lotes usando FEFO
          const allocations = await inventoryService.allocateStockFEFO(detail.productId, detail.quantity);
          
          for (const allocation of allocations) {
            // Descontar del lote
            await tx.productLot.update({
              where: { id: allocation.lotId },
              data: { quantity: { decrement: allocation.quantity } }
            });

            // Registrar movimiento
            await tx.stockMovement.create({
              data: {
                productId: detail.productId,
                lotId: allocation.lotId,
                type: 'EXIT',
                quantity: -allocation.quantity,
                reason: `Entrega ${delivery.code}`,
                reference: delivery.id,
                userId: req.user!.id
              }
            });

            // Actualizar detalle con el lote asignado
            await tx.deliveryDetail.update({
              where: { id: detail.id },
              data: { lotId: allocation.lotId }
            });
          }
        }

        if (detail.kitId) {
          // Procesar productos del kit
          const requestKit = delivery.request.requestKits.find(rk => rk.kitId === detail.kitId);
          if (requestKit?.kit) {
            for (const kp of requestKit.kit.kitProducts) {
              const totalQty = kp.quantity * detail.quantity;
              const allocations = await inventoryService.allocateStockFEFO(kp.productId, totalQty);

              for (const allocation of allocations) {
                await tx.productLot.update({
                  where: { id: allocation.lotId },
                  data: { quantity: { decrement: allocation.quantity } }
                });

                await tx.stockMovement.create({
                  data: {
                    productId: kp.productId,
                    lotId: allocation.lotId,
                    type: 'EXIT',
                    quantity: -allocation.quantity,
                    reason: `Entrega ${delivery.code} - Kit ${requestKit.kit.code}`,
                    reference: delivery.id,
                    userId: req.user!.id
                  }
                });
              }
            }
          }
        }
      }

      // Actualizar estado de la entrega
      return tx.delivery.update({
        where: { id: req.params.id },
        data: {
          status: DeliveryStatus.READY,
          history: {
            create: {
              fromStatus: delivery.status,
              toStatus: DeliveryStatus.READY,
              userId: req.user!.id,
              notes: notes || 'Entrega lista - Inventario descontado'
            }
          }
        },
        include: {
          request: { include: { beneficiary: true } },
          warehouseUser: { select: { firstName: true, lastName: true } },
          authorizedBy: { select: { firstName: true, lastName: true } },
          deliveryDetails: { include: { product: true, kit: true, lot: true } },
          history: { include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }
        }
      });
    });

    // Notificar a despachadores que hay una entrega lista
    await notificationService.notifyByRole('DISPATCHER', {
      type: 'DELIVERY_READY',
      title: 'Entrega lista para despacho',
      message: `La entrega ${delivery.code} está lista para ser entregada al beneficiario.`,
      senderId: req.user!.id,
      deliveryId: delivery.id,
      priority: 'HIGH',
      actionUrl: `/deliveries?id=${delivery.id}`
    });

    await auditService.log('Delivery', delivery.id, 'UPDATE', req.user!.id, { status: delivery.status }, { status: updated.status });

    res.json({ success: true, data: updated, message: 'Entrega lista. Notificación enviada a despachadores.' });
  } catch (error) {
    next(error);
  }
});

// ============ PASO 6: Confirmar entrega al beneficiario (DISPATCHER) ============
router.post('/:id/deliver', authenticate, authorize('ADMIN', 'DISPATCHER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { receivedBy, receiverDocument, receiverSignature, notes } = req.body;

    if (!receivedBy || !receiverDocument) {
      throw new AppError('Nombre y documento del receptor son requeridos', 400);
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        request: {
          include: {
            beneficiary: true,
            requestProducts: true,
            requestKits: true
          }
        },
        deliveryDetails: true
      }
    });

    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }

    if (delivery.status !== DeliveryStatus.READY) {
      throw new AppError('La entrega debe estar lista para ser entregada', 400);
    }

    // Validar segregación de funciones
    validateSegregation(delivery, req.user!.id, 'DELIVER');

    // Actualizar cantidades entregadas en la solicitud y finalizar entrega
    const updated = await prisma.$transaction(async (tx) => {
      // Actualizar cantidades entregadas en productos
      for (const detail of delivery.deliveryDetails) {
        if (detail.productId) {
          const requestProduct = delivery.request.requestProducts.find(rp => rp.productId === detail.productId);
          if (requestProduct) {
            await tx.requestProduct.update({
              where: { id: requestProduct.id },
              data: { quantityDelivered: { increment: detail.quantity } }
            });
          }
        }
        if (detail.kitId) {
          const requestKit = delivery.request.requestKits.find(rk => rk.kitId === detail.kitId);
          if (requestKit) {
            await tx.requestKit.update({
              where: { id: requestKit.id },
              data: { quantityDelivered: { increment: detail.quantity } }
            });
          }
        }
      }

      // Verificar si la solicitud está completamente entregada
      const updatedRequest = await tx.request.findUnique({
        where: { id: delivery.requestId },
        include: { requestProducts: true, requestKits: true }
      });

      const allProductsDelivered = updatedRequest!.requestProducts.every(
        rp => rp.quantityDelivered >= rp.quantityRequested
      );
      const allKitsDelivered = updatedRequest!.requestKits.every(
        rk => rk.quantityDelivered >= rk.quantityRequested
      );

      const newRequestStatus = (allProductsDelivered && allKitsDelivered) ? 'DELIVERED' : 'PARTIALLY_DELIVERED';

      await tx.request.update({
        where: { id: delivery.requestId },
        data: { status: newRequestStatus }
      });

      await tx.requestHistory.create({
        data: {
          requestId: delivery.requestId,
          fromStatus: delivery.request.status,
          toStatus: newRequestStatus,
          userId: req.user!.id,
          notes: `Entrega ${delivery.code} completada`
        }
      });

      // Finalizar la entrega
      return tx.delivery.update({
        where: { id: req.params.id },
        data: {
          status: DeliveryStatus.DELIVERED,
          deliveredById: req.user!.id,
          deliveryDate: new Date(),
          receivedBy,
          receiverDocument,
          receiverSignature,
          receptionDate: new Date(),
          receptionNotes: notes,
          history: {
            create: {
              fromStatus: delivery.status,
              toStatus: DeliveryStatus.DELIVERED,
              userId: req.user!.id,
              notes: `Entregado a ${receivedBy} (${receiverDocument})`
            }
          }
        },
        include: {
          request: { include: { beneficiary: true } },
          warehouseUser: { select: { firstName: true, lastName: true } },
          authorizedBy: { select: { firstName: true, lastName: true } },
          deliveredBy: { select: { firstName: true, lastName: true } },
          deliveryDetails: { include: { product: true, kit: true, lot: true } },
          history: { include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }
        }
      });
    });

    await auditService.log('Delivery', delivery.id, 'UPDATE', req.user!.id, { status: delivery.status }, { status: updated.status });

    res.json({ success: true, data: updated, message: 'Entrega completada exitosamente' });
  } catch (error) {
    next(error);
  }
});

// ============ Cancelar entrega ============
router.post('/:id/cancel', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const inventoryService = new InventoryService(prisma);
    const auditService = new AuditService(prisma);
    const { reason } = req.body;

    if (!reason) {
      throw new AppError('Motivo de cancelación es requerido', 400);
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: { deliveryDetails: true }
    });

    if (!delivery) {
      throw new AppError('Entrega no encontrada', 404);
    }

    if (delivery.status === DeliveryStatus.DELIVERED) {
      throw new AppError('No se puede cancelar una entrega ya completada', 400);
    }

    // Si ya se descontó inventario (estado READY), hay que devolverlo
    const updated = await prisma.$transaction(async (tx) => {
      if (delivery.status === DeliveryStatus.READY) {
        for (const detail of delivery.deliveryDetails) {
          if (detail.productId && detail.lotId) {
            await tx.productLot.update({
              where: { id: detail.lotId },
              data: { quantity: { increment: detail.quantity } }
            });

            await tx.stockMovement.create({
              data: {
                productId: detail.productId,
                lotId: detail.lotId,
                type: 'RETURN',
                quantity: detail.quantity,
                reason: `Cancelación de entrega ${delivery.code}: ${reason}`,
                reference: delivery.id,
                userId: req.user!.id
              }
            });
          }
        }
      }

      return tx.delivery.update({
        where: { id: req.params.id },
        data: {
          status: DeliveryStatus.CANCELLED,
          history: {
            create: {
              fromStatus: delivery.status,
              toStatus: DeliveryStatus.CANCELLED,
              userId: req.user!.id,
              notes: `Cancelada: ${reason}`
            }
          }
        },
        include: {
          request: { include: { beneficiary: true } },
          history: { include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }
        }
      });
    });

    await auditService.log('Delivery', delivery.id, 'UPDATE', req.user!.id, { status: delivery.status }, { status: updated.status });

    res.json({ success: true, data: updated, message: 'Entrega cancelada' });
  } catch (error) {
    next(error);
  }
});

// Get delivery stats by status
router.get('/stats/summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const counts = await prisma.delivery.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const stats = {
      pendingAuthorization: counts.find(c => c.status === 'PENDING_AUTHORIZATION')?._count.id || 0,
      authorized: counts.find(c => c.status === 'AUTHORIZED')?._count.id || 0,
      receivedWarehouse: counts.find(c => c.status === 'RECEIVED_WAREHOUSE')?._count.id || 0,
      inPreparation: counts.find(c => c.status === 'IN_PREPARATION')?._count.id || 0,
      ready: counts.find(c => c.status === 'READY')?._count.id || 0,
      delivered: counts.find(c => c.status === 'DELIVERED')?._count.id || 0,
      cancelled: counts.find(c => c.status === 'CANCELLED')?._count.id || 0,
      total: counts.reduce((sum, c) => sum + c._count.id, 0)
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// Get warehouse users for assignment
router.get('/users/warehouse', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const users = await prisma.user.findMany({
      where: { 
        role: { name: { in: ['ADMIN', 'WAREHOUSE'] } },
        isActive: true 
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

export default router;
