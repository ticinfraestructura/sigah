import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, hasPermission } from '../middleware/auth.middleware';
import whatsappService, { WhatsAppMessage, WhatsAppResponse } from '../services/whatsapp.service';
import telegramService, { TelegramMessage, TelegramResponse } from '../services/telegram.service';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { notificationZodSchemas, validateZodRequest } from '../middleware/validation.middleware';

const router = Router();

// Tipos y criticidad disponibles
const NOTIFICATION_TYPES = ['INFO', 'ALERT', 'DELIVERY', 'REQUEST', 'SYSTEM', 'REMINDER'];
const CRITICALITY_LEVELS = ['INFORMATIVE', 'LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL'];

const notificationSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiadas solicitudes de notificación. Espere un momento.'
  }
});

const notificationBulkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiadas solicitudes masivas. Espere un momento.'
  }
});

// Obtener todas las notificaciones enviadas
router.get('/', authenticate, validateZodRequest({ query: notificationZodSchemas.listQuery }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { channel, type, criticality, limit = 50, offset = 0 } = req.query as {
      channel?: 'INTERNAL' | 'WHATSAPP' | 'TELEGRAM';
      type?: 'INFO' | 'ALERT' | 'DELIVERY' | 'REQUEST' | 'SYSTEM' | 'REMINDER';
      criticality?: 'INFORMATIVE' | 'LOW' | 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      limit?: number;
      offset?: number;
    };

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
      take: limit,
      skip: offset
    });

    const total = await prisma.notification.count({ where });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    next(error);
  }
});

// Obtener usuarios disponibles para enviar notificación
router.get('/users', authenticate, validateZodRequest({ query: notificationZodSchemas.emptyQuery }), async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.get('/config', authenticate, validateZodRequest({ query: notificationZodSchemas.emptyQuery }), (req: AuthRequest, res: Response) => {
  const whatsappStatus = whatsappService.getWhatsAppConfigStatus();
  const telegramStatus = telegramService.getTelegramConfigStatus();
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
      })),
      whatsappStatus,
      telegramStatus
    }
  });
});

// Checklist productivo de WhatsApp
router.get('/checklist', authenticate, validateZodRequest({ query: notificationZodSchemas.emptyQuery }), (req: AuthRequest, res: Response) => {
  const whatsappStatus = whatsappService.getWhatsAppConfigStatus();
  const telegramStatus = telegramService.getTelegramConfigStatus();
  const hasPhoneId = !!process.env.WHATSAPP_PHONE_ID;
  const hasAccessToken = !!process.env.WHATSAPP_ACCESS_TOKEN;
  const hasApiUrl = !!process.env.WHATSAPP_API_URL;
  const hasTelegramBotToken = !!process.env.TELEGRAM_BOT_TOKEN;

  const checklist = [
    {
      id: 'env_phone_id',
      title: 'WHATSAPP_PHONE_ID configurado',
      ok: hasPhoneId,
      severity: 'required',
      detail: hasPhoneId ? 'Configurado' : 'Falta variable de entorno'
    },
    {
      id: 'env_access_token',
      title: 'WHATSAPP_ACCESS_TOKEN configurado',
      ok: hasAccessToken,
      severity: 'required',
      detail: hasAccessToken ? 'Configurado' : 'Falta variable de entorno'
    },
    {
      id: 'env_api_url',
      title: 'WHATSAPP_API_URL configurado',
      ok: hasApiUrl,
      severity: 'recommended',
      detail: hasApiUrl ? 'Configurado' : 'Se usará valor por defecto del servicio'
    },
    {
      id: 'official_api_ready',
      title: 'API oficial lista para envío real',
      ok: whatsappStatus.officialApiReady,
      severity: 'required',
      detail: whatsappStatus.officialApiReady
        ? 'El sistema puede enviar mensajes reales por API oficial'
        : whatsappStatus.officialApiReason || 'No lista'
    },
    {
      id: 'telegram_bot_token',
      title: 'TELEGRAM_BOT_TOKEN configurado (fallback sin costo)',
      ok: hasTelegramBotToken,
      severity: 'recommended',
      detail: telegramStatus.botConfigured ? 'Configurado' : (telegramStatus.reason || 'No configurado')
    }
  ];

  const blockingItems = checklist.filter(item => item.severity === 'required' && !item.ok);

  res.json({
    success: true,
    data: {
      mode: whatsappStatus.effectiveMode,
      runtimeMode: whatsappStatus.runtimeMode,
      operational: whatsappStatus.effectiveMode === 'real',
      telegram: telegramStatus,
      checklist,
      blockingItems,
      nextStep: whatsappStatus.effectiveMode === 'real'
        ? 'Ejecute POST /api/whatsapp-notifications/test con un número real para verificación final.'
        : 'Complete los ítems requeridos y repita la prueba en /api/whatsapp-notifications/test.'
    }
  });
});

// Estado operativo de proveedores de notificación
router.get('/status', authenticate, validateZodRequest({ query: notificationZodSchemas.emptyQuery }), (req: AuthRequest, res: Response) => {
  const whatsappStatus = whatsappService.getWhatsAppConfigStatus();
  const telegramStatus = telegramService.getTelegramConfigStatus();

  res.json({
    success: true,
    data: {
      whatsapp: {
        ...whatsappStatus,
        mode: whatsappStatus.effectiveMode
      },
      telegram: telegramStatus
    }
  });
});

// Cambiar modo runtime de WhatsApp (auto/simulated/real)
router.post('/mode', authenticate, hasPermission('settings', 'edit'), validateZodRequest({ body: notificationZodSchemas.setMode }), (req: AuthRequest, res: Response) => {
  const { mode } = req.body as { mode: 'auto' | 'simulated' | 'real' };

  whatsappService.setWhatsAppRuntimeMode(mode);
  const whatsappStatus = whatsappService.getWhatsAppConfigStatus();

  res.json({
    success: true,
    data: {
      mode: whatsappStatus.effectiveMode,
      runtimeMode: whatsappStatus.runtimeMode,
      officialApiReady: whatsappStatus.officialApiReady,
      officialApiReason: whatsappStatus.officialApiReason
    },
    message: mode === 'real' && !whatsappStatus.officialApiReady
      ? 'Modo real solicitado, pero no hay credenciales oficiales válidas. El sistema operará en modo simulado cuando no exista proveedor alterno.'
      : `Modo de WhatsApp actualizado a ${mode}`
  });
});

// Enviar notificación
router.post('/send', authenticate, hasPermission('users', 'view'), notificationSendLimiter, validateZodRequest({ body: notificationZodSchemas.send }), async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    const critLevel = criticality || 'NORMAL';

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
    let whatsappResult: WhatsAppResponse = {
      success: false,
      deliveryMode: 'simulated',
      provider: 'SIMULATED',
      simulated: true,
      error: 'No intentado'
    };
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

    const whatsappRealSent = whatsappResult.success && !whatsappResult.simulated;
    const shouldUseTelegramFallback =
      sendWhatsApp &&
      !!(receiver as any).telegramChatId &&
      !whatsappRealSent;

    // Enviar por Telegram solo como fallback cuando WhatsApp no fue real
    if (shouldUseTelegramFallback) {
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
    const combinedDeliveryError = [whatsappResult.error, telegramResult.error]
      .filter((value): value is string => !!value)
      .join(' | ');

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        channel: telegramResult.success ? 'TELEGRAM' : (whatsappRealSent ? 'WHATSAPP' : 'INTERNAL'),
        whatsappSent: whatsappRealSent,
        whatsappSentAt: whatsappRealSent ? new Date() : null,
        whatsappMessageId: whatsappRealSent ? whatsappResult.messageId : undefined,
        whatsappError: combinedDeliveryError || null
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
          whatsappSent: whatsappRealSent,
          telegramSent: telegramResult.success
        })
      }
    });

    res.status(201).json({
      success: true,
      data: {
        notification,
        whatsapp: {
          sent: whatsappRealSent,
          messageId: whatsappResult.messageId,
          error: whatsappResult.error,
          deliveryMode: whatsappResult.deliveryMode,
          provider: whatsappResult.provider,
          simulated: whatsappResult.simulated
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
router.post('/send-bulk', authenticate, hasPermission('users', 'edit'), notificationBulkLimiter, validateZodRequest({ body: notificationZodSchemas.sendBulk }), async (req: AuthRequest, res: Response, next: NextFunction) => {
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

        let whatsappResult: WhatsAppResponse = {
          success: false,
          deliveryMode: 'simulated',
          provider: 'SIMULATED',
          simulated: true,
          error: 'No intentado'
        };
        let telegramResult: { success: boolean; messageId?: number; error?: string } = { success: false };

        if (sendWhatsApp && receiver.phone) {
          whatsappResult = await whatsappService.sendWhatsAppMessage({
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
        } else {
          whatsappResult = {
            success: !sendWhatsApp,
            deliveryMode: 'simulated',
            provider: 'SIMULATED',
            simulated: true,
            error: sendWhatsApp
              ? 'Usuario sin teléfono registrado'
              : 'Envío por WhatsApp deshabilitado'
          };
        }

        const whatsappRealSent = whatsappResult.success && !whatsappResult.simulated;
        const shouldUseTelegramFallback =
          sendWhatsApp &&
          !!(receiver as any).telegramChatId &&
          !whatsappRealSent;

        if (shouldUseTelegramFallback) {
          telegramResult = await telegramService.sendTelegramMessage({
            chatId: (receiver as any).telegramChatId,
            type,
            criticality: critLevel,
            title,
            message,
            senderName: `${req.user!.firstName} ${req.user!.lastName}`,
            receiverName: `${receiver.firstName} ${receiver.lastName}`,
            traceCode,
            timestamp: new Date()
          });
        }

        const combinedDeliveryError = [whatsappResult.error, telegramResult.error]
          .filter((value): value is string => !!value)
          .join(' | ');

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            channel: telegramResult.success ? 'TELEGRAM' : (whatsappRealSent ? 'WHATSAPP' : 'INTERNAL'),
            whatsappSent: whatsappRealSent,
            whatsappSentAt: whatsappRealSent ? new Date() : null,
            whatsappMessageId: whatsappRealSent ? whatsappResult.messageId : null,
            whatsappError: combinedDeliveryError || null
          }
        });

        results.push({
          receiverId,
          receiverName: `${receiver.firstName} ${receiver.lastName}`,
          success: whatsappResult.success || telegramResult.success,
          whatsappSent: whatsappRealSent,
          telegramSent: telegramResult.success,
          fallbackUsed: shouldUseTelegramFallback,
          error: combinedDeliveryError || undefined,
          deliveryMode: whatsappResult.deliveryMode,
          provider: whatsappResult.provider,
          simulated: whatsappResult.simulated
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
router.post('/test', authenticate, hasPermission('users', 'edit'), notificationSendLimiter, validateZodRequest({ body: notificationZodSchemas.test }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;

    const result = await whatsappService.sendTestMessage(phone);
    const operational = result.success && !result.simulated;

    res.json({
      success: result.success,
      data: {
        ...result,
        operational,
        note: operational
          ? 'Mensaje enviado en modo real'
          : 'Mensaje en modo simulado o sin proveedor real configurado'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Enviar mensaje de prueba por Telegram
router.post('/telegram/test', authenticate, hasPermission('users', 'edit'), notificationSendLimiter, validateZodRequest({ body: notificationZodSchemas.telegramTest }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.body as { chatId: string };

    const result: TelegramResponse = await telegramService.sendTestMessage(chatId);
    const operational = result.success && !result.simulated;

    res.json({
      success: result.success,
      data: {
        ...result,
        operational,
        note: operational
          ? 'Mensaje de Telegram enviado en modo real'
          : 'Mensaje de Telegram en modo simulado o sin bot configurado'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Marcar notificación como leída
router.patch('/:id/read', authenticate, validateZodRequest({ params: notificationZodSchemas.idParam }), async (req: AuthRequest, res: Response, next: NextFunction) => {
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
