import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Obtener notificaciones del usuario actual
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const userId = req.user!.id;
    const { unreadOnly, limit = 20 } = req.query;

    const where: any = { receiverId: userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        delivery: { select: { id: true, code: true, status: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    const unreadCount = await prisma.notification.count({
      where: { receiverId: userId, isRead: false }
    });

    res.json({ 
      success: true, 
      data: notifications,
      unreadCount 
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
      data: { isRead: true, readAt: new Date() }
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// Marcar todas como leídas
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    next(error);
  }
});

// Servicio de notificaciones (para uso interno)
export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  async createNotification(data: {
    type: string;
    title: string;
    message: string;
    receiverId: string;
    senderId?: string;
    deliveryId?: string;
    priority?: string;
    actionUrl?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        receiverId: data.receiverId,
        senderId: data.senderId,
        deliveryId: data.deliveryId,
        priority: data.priority || 'NORMAL',
        actionUrl: data.actionUrl,
        actionRequired: true
      }
    });
  }

  // Notificar a todos los usuarios con un rol específico
  async notifyByRole(role: string, data: {
    type: string;
    title: string;
    message: string;
    senderId?: string;
    deliveryId?: string;
    priority?: string;
    actionUrl?: string;
  }) {
    const users = await this.prisma.user.findMany({
      where: { 
        role: { name: role },
        isActive: true 
      }
    });

    const notifications = await Promise.all(
      users.map(user => this.createNotification({
        ...data,
        receiverId: user.id
      }))
    );

    return notifications;
  }

  // Obtener usuario activo para un rol (considerando delegaciones)
  async getActiveUserForRole(role: string): Promise<string | null> {
    const now = new Date();
    
    // Buscar usuario con delegación activa
    const delegatedUser = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        delegatedFrom: {
          some: {
            role: { name: role },
            isActive: true,
            delegationStartDate: { lte: now },
            delegationEndDate: { gte: now }
          }
        }
      }
    });

    if (delegatedUser) return delegatedUser.id;

    // Si no hay delegación, buscar usuario principal del rol
    const mainUser = await this.prisma.user.findFirst({
      where: { 
        role: { name: role }, 
        isActive: true 
      }
    });

    return mainUser?.id || null;
  }
}

export default router;
