import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, hasPermission } from '../middleware/auth.middleware';
import whatsappService, { WhatsAppMessage } from '../services/whatsapp.service';
import telegramService, { TelegramMessage } from '../services/telegram.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Tipos y criticidad disponibles
const NOTIFICATION_TYPES = ['INFO', 'ALERT', 'DELIVERY', 'REQUEST', 'SYSTEM', 'REMINDER'];
const CRITICALITY_LEVELS = ['INFORMATIVE', 'LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Obtener todas las notificaciones enviadas
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { channel, type, criticality, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (channel) where.channel = channel;
    if (type) where.type = type;
    if (criticality) where.criticality = criticality;

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.notification.count({ where });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Obtener usuarios disponibles para enviar notificación
router.get('/users', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: {
          select: { name: true }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    res.json({
      success: true,
      data: users.map(u => ({
        ...u,
        roleName: u.role?.name,
        hasPhone: !!u.phone
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Obtener tipos y criticidades disponibles
router.get('/config', authenticate, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      types: NOTIFICATION_TYPES.map(t => ({
        value: t,
        label: getTypeLabel(t),
        icon: whatsappService.ICONS[t]
      })),
      criticalities: CRITICALITY_LEVELS.map(c => ({
        value: c,
        label: whatsappService.CRITICALITY_LABELS[c],
        icon: whatsappService.CRITICALITY_ICONS[c]
      }))
    }
  });
});

// Enviar notificación
router.post('/send', authenticate, hasPermission('users', 'view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      receiverId, 
      type, 
      criticality, 
      title, 
      message, 
      sendWhatsApp = true,
      referenceType,
      referenceId,
      actionUrl
    } = req.body;

    // Validaciones
    if (!receiverId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'receiverId, type, title y message son requeridos'
      });
    }

    if (!NOTIFICATION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Tipo inválido. Valores permitidos: ${NOTIFICATION_TYPES.join(', ')}`
      });
    }

    const critLevel = criticality || 'NORMAL';
    if (!CRITICALITY_LEVELS.includes(critLevel)) {
      return res.status(400).json({
        success: false,
        error: `Criticidad inválida. Valores permitidos: ${CRITICALITY_LEVELS.join(', ')}`
      });
    }

    // Obtener usuario destino
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Usuario destinatario no encontrado'
      });
    }

    // Generar código de trazabilidad
    const traceCode = `SIGAH-${Date.now().toString(36).toUpperCase()}-${uuidv4().substr(0, 4).toUpperCase()}`;

    // Crear notificación en base de datos
    const notification = await prisma.notification.create({
      data: {
        code: traceCode,
        type,
        criticality: critLevel,
        title,
        message,
        receiverId,
        senderId: req.user!.id,
        channel: sendWhatsApp && receiver.phone ? 'WHATSAPP' : 'INTERNAL',
        referenceType,
        referenceId,
        actionUrl,
        metadata: JSON.stringify({
          senderEmail: req.user!.email,
          receiverEmail: receiver.email,
          sentAt: new Date().toISOString()
        })
      },
      include: {
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Resultados de envío
    let whatsappResult: { success: boolean; messageId?: string; error?: string } = { success: false };
    let telegramResult: { success: boolean; messageId?: number; error?: string } = { success: false };
    
    const senderName = `${req.user!.firstName} ${req.user!.lastName}`;
    const receiverName = `${receiver.firstName} ${receiver.lastName}`;

    // Enviar por WhatsApp si está habilitado y el usuario tiene teléfono
    if (sendWhatsApp && receiver.phone) {
      const whatsappData: WhatsAppMessage = {
        to: receiver.phone,
        type,
        criticality: critLevel,
        title,
        message,
        senderName,
        receiverName,
        traceCode,
        referenceType,
        referenceId,
        actionUrl,
        timestamp: new Date(),
        callmebotApiKey: (receiver as any).whatsappApiKey || undefined
      };

      whatsappResult = await whatsappService.sendWhatsAppMessage(whatsappData);
    }

    // Enviar por Telegram si el usuario tiene telegramChatId
    if ((receiver as any).telegramChatId) {
      const telegramData: TelegramMessage = {
        chatId: (receiver as any).telegramChatId,
        type,
        criticality: critLevel,
        title,
        message,
        senderName,
        receiverName,
        traceCode,
        referenceType,
        referenceId,
        actionUrl,
        timestamp: new Date()
      };

      telegramResult = await telegramService.sendTelegramMessage(telegramData);
    }

    // Actualizar notificación con resultados
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        channel: telegramResult.success ? 'TELEGRAM' : (whatsappResult.success ? 'WHATSAPP' : 'INTERNAL'),
        whatsappSent: whatsappResult.success,
        whatsappSentAt: whatsappResult.success ? new Date() : null,
        whatsappMessageId: whatsappResult.messageId || (telegramResult.messageId?.toString()),
        whatsappError: whatsappResult.error || telegramResult.error
      }
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'Notification',
        entityId: notification.id,
        newValues: JSON.stringify({
          code: traceCode,
          type,
          criticality: critLevel,
          receiverId,
          whatsappSent: whatsappResult.success,
          telegramSent: telegramResult.success
        })
      }
    });

    res.status(201).json({
      success: true,
      data: {
        notification,
        whatsapp: {
          sent: whatsappResult.success,
          messageId: whatsappResult.messageId,
          error: whatsappResult.error
        },
        telegram: {
          sent: telegramResult.success,
          messageId: telegramResult.messageId,
          error: telegramResult.error
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Enviar notificación masiva a múltiples usuarios
router.post('/send-bulk', authenticate, hasPermission('users', 'edit'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      receiverIds, 
      type, 
      criticality, 
      title, 
      message, 
      sendWhatsApp = true 
    } = req.body;

    if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'receiverIds debe ser un array con al menos un ID'
      });
    }

    const results = [];
    
    for (const receiverId of receiverIds) {
      try {
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (!receiver) continue;

        const traceCode = `SIGAH-${Date.now().toString(36).toUpperCase()}-${uuidv4().substr(0, 4).toUpperCase()}`;
        const critLevel = criticality || 'NORMAL';

        const notification = await prisma.notification.create({
          data: {
            code: traceCode,
            type,
            criticality: critLevel,
            title,
            message,
            receiverId,
            senderId: req.user!.id,
            channel: sendWhatsApp && receiver.phone ? 'WHATSAPP' : 'INTERNAL'
          }
        });

        let whatsappSent = false;
        if (sendWhatsApp && receiver.phone) {
          const result = await whatsappService.sendWhatsAppMessage({
            to: receiver.phone,
            type,
            criticality: critLevel,
            title,
            message,
            senderName: `${req.user!.firstName} ${req.user!.lastName}`,
            receiverName: `${receiver.firstName} ${receiver.lastName}`,
            traceCode,
            timestamp: new Date(),
            callmebotApiKey: (receiver as any).whatsappApiKey || undefined
          });

          whatsappSent = result.success;
          
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              whatsappSent: result.success,
              whatsappSentAt: result.success ? new Date() : null,
              whatsappMessageId: result.messageId,
              whatsappError: result.error
            }
          });
        }

        results.push({
          receiverId,
          receiverName: `${receiver.firstName} ${receiver.lastName}`,
          success: true,
          whatsappSent
        });
      } catch (err) {
        results.push({
          receiverId,
          success: false,
          error: 'Error al enviar'
        });
      }
    }

    res.json({
      success: true,
      data: {
        total: receiverIds.length,
        sent: results.filter(r => r.success).length,
        whatsappSent: results.filter(r => r.whatsappSent).length,
        results
      }
    });
  } catch (error) {
    next(error);
  }
});

// Enviar mensaje de prueba
router.post('/test', authenticate, hasPermission('users', 'edit'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un número de teléfono'
      });
    }

    const result = await whatsappService.sendTestMessage(phone);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Marcar notificación como leída
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// Obtener estadísticas de notificaciones
router.get('/stats', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const [total, byType, byCriticality, whatsappStats] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.groupBy({
        by: ['type'],
        _count: true
      }),
      prisma.notification.groupBy({
        by: ['criticality'],
        _count: true
      }),
      prisma.notification.aggregate({
        _count: { whatsappSent: true },
        where: { whatsappSent: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byCriticality: byCriticality.reduce((acc, item) => {
          acc[item.criticality] = item._count;
          return acc;
        }, {} as Record<string, number>),
        whatsappSent: whatsappStats._count.whatsappSent
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper para etiquetas de tipo
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INFO: 'Información',
    ALERT: 'Alerta',
    DELIVERY: 'Entrega',
    REQUEST: 'Solicitud',
    SYSTEM: 'Sistema',
    REMINDER: 'Recordatorio'
  };
  return labels[type] || type;
}

export default router;
