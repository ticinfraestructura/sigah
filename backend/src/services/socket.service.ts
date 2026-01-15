/**
 * Servicio de WebSockets
 * 
 * Proporciona:
 * - Notificaciones en tiempo real
 * - Actualización de dashboard
 * - Eventos de entregas y solicitudes
 * - Salas por usuario y rol
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './logger.service';

// ============ TIPOS ============

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userName?: string;
}

interface NotificationPayload {
  id?: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, any>;
  actionUrl?: string;
  createdAt?: Date;
}

// ============ CONFIGURACIÓN ============

let io: Server | null = null;

// Mapeo de usuarios conectados
const connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

// ============ INICIALIZACIÓN ============

/**
 * Inicializar servidor Socket.io
 */
export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware de autenticación
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, secret) as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.roleName;
      socket.userName = `${decoded.firstName} ${decoded.lastName}`;
      
      next();
    } catch (error) {
      logger.warn('[SOCKET] Authentication failed', { error: (error as Error).message });
      next(new Error('Invalid token'));
    }
  });

  // Manejar conexiones
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userRole = socket.userRole!;

    logger.info('[SOCKET] User connected', { userId, socketId: socket.id, role: userRole });

    // Registrar usuario conectado
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);

    // Unir a salas
    socket.join(`user:${userId}`);
    socket.join(`role:${userRole}`);
    
    // Sala especial para administradores
    if (userRole === 'Administrador') {
      socket.join('admins');
    }

    // Sala para bodegueros
    if (userRole === 'Bodeguero' || userRole === 'Administrador') {
      socket.join('warehouse');
    }

    // Emitir estado de conexión
    socket.emit('connected', {
      userId,
      role: userRole,
      connectedAt: new Date()
    });

    // ============ EVENTOS DEL CLIENTE ============

    // Suscribirse a actualizaciones de una entidad
    socket.on('subscribe', (entity: string, entityId?: string) => {
      const room = entityId ? `${entity}:${entityId}` : entity;
      socket.join(room);
      logger.debug('[SOCKET] Subscribed to room', { userId, room });
    });

    // Desuscribirse
    socket.on('unsubscribe', (entity: string, entityId?: string) => {
      const room = entityId ? `${entity}:${entityId}` : entity;
      socket.leave(room);
      logger.debug('[SOCKET] Unsubscribed from room', { userId, room });
    });

    // Marcar notificación como leída
    socket.on('notification:read', (notificationId: string) => {
      logger.debug('[SOCKET] Notification marked as read', { userId, notificationId });
      // La lógica de BD se maneja en el endpoint REST
    });

    // Ping para mantener conexión
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // ============ DESCONEXIÓN ============

    socket.on('disconnect', (reason) => {
      logger.info('[SOCKET] User disconnected', { userId, socketId: socket.id, reason });
      
      // Remover de usuarios conectados
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });

    socket.on('error', (error) => {
      logger.error('[SOCKET] Socket error', { userId, error: error.message });
    });
  });

  logger.info('[SOCKET] Server initialized');
  return io;
};

/**
 * Obtener instancia de Socket.io
 */
export const getIO = (): Server | null => io;

// ============ EMISIÓN DE EVENTOS ============

/**
 * Enviar notificación a un usuario específico
 */
export const notifyUser = (userId: string, notification: NotificationPayload): void => {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    createdAt: notification.createdAt || new Date()
  });
  
  logger.debug('[SOCKET] Notification sent to user', { userId, type: notification.type });
};

/**
 * Enviar notificación a un rol específico
 */
export const notifyRole = (role: string, notification: NotificationPayload): void => {
  if (!io) return;
  
  io.to(`role:${role}`).emit('notification', {
    ...notification,
    createdAt: notification.createdAt || new Date()
  });
  
  logger.debug('[SOCKET] Notification sent to role', { role, type: notification.type });
};

/**
 * Enviar notificación a todos los administradores
 */
export const notifyAdmins = (notification: NotificationPayload): void => {
  if (!io) return;
  
  io.to('admins').emit('notification', {
    ...notification,
    createdAt: notification.createdAt || new Date()
  });
  
  logger.debug('[SOCKET] Notification sent to admins', { type: notification.type });
};

/**
 * Enviar notificación a bodega
 */
export const notifyWarehouse = (notification: NotificationPayload): void => {
  if (!io) return;
  
  io.to('warehouse').emit('notification', {
    ...notification,
    createdAt: notification.createdAt || new Date()
  });
  
  logger.debug('[SOCKET] Notification sent to warehouse', { type: notification.type });
};

/**
 * Enviar notificación a todos los usuarios conectados
 */
export const notifyAll = (notification: NotificationPayload): void => {
  if (!io) return;
  
  io.emit('notification', {
    ...notification,
    createdAt: notification.createdAt || new Date()
  });
  
  logger.debug('[SOCKET] Notification sent to all', { type: notification.type });
};

/**
 * Emitir actualización de entidad
 */
export const emitEntityUpdate = (
  entity: string,
  action: 'created' | 'updated' | 'deleted',
  data: any,
  entityId?: string
): void => {
  if (!io) return;
  
  const room = entityId ? `${entity}:${entityId}` : entity;
  const event = `${entity}:${action}`;
  
  io.to(room).emit(event, data);
  
  // También emitir a la sala general de la entidad
  if (entityId) {
    io.to(entity).emit(event, data);
  }
  
  logger.debug('[SOCKET] Entity update emitted', { entity, action, entityId });
};

// ============ EVENTOS ESPECÍFICOS ============

/**
 * Nueva solicitud creada
 */
export const emitNewRequest = (request: any): void => {
  notifyAdmins({
    type: 'NEW_REQUEST',
    title: 'Nueva Solicitud',
    message: `Solicitud ${request.code} registrada para ${request.beneficiary?.firstName} ${request.beneficiary?.lastName}`,
    priority: request.priority > 0 ? 'high' : 'normal',
    data: { requestId: request.id, code: request.code },
    actionUrl: `/requests/${request.id}`
  });
  
  emitEntityUpdate('requests', 'created', request);
};

/**
 * Solicitud aprobada
 */
export const emitRequestApproved = (request: any, approvedBy: string): void => {
  // Notificar a bodega
  notifyWarehouse({
    type: 'REQUEST_APPROVED',
    title: 'Solicitud Aprobada',
    message: `Solicitud ${request.code} aprobada por ${approvedBy}`,
    priority: 'high',
    data: { requestId: request.id, code: request.code },
    actionUrl: `/requests/${request.id}`
  });
  
  emitEntityUpdate('requests', 'updated', request, request.id);
};

/**
 * Entrega pendiente de autorización
 */
export const emitDeliveryPendingAuth = (delivery: any): void => {
  notifyRole('Autorizador', {
    type: 'DELIVERY_PENDING_AUTH',
    title: 'Entrega Pendiente de Autorización',
    message: `Entrega ${delivery.code} requiere autorización`,
    priority: 'high',
    data: { deliveryId: delivery.id, code: delivery.code },
    actionUrl: `/deliveries`
  });
  
  notifyAdmins({
    type: 'DELIVERY_PENDING_AUTH',
    title: 'Entrega Pendiente de Autorización',
    message: `Entrega ${delivery.code} requiere autorización`,
    priority: 'normal',
    data: { deliveryId: delivery.id, code: delivery.code },
    actionUrl: `/deliveries`
  });
};

/**
 * Entrega autorizada
 */
export const emitDeliveryAuthorized = (delivery: any): void => {
  notifyWarehouse({
    type: 'DELIVERY_AUTHORIZED',
    title: 'Entrega Autorizada',
    message: `Entrega ${delivery.code} autorizada, lista para preparar`,
    priority: 'high',
    data: { deliveryId: delivery.id, code: delivery.code },
    actionUrl: `/deliveries`
  });
  
  emitEntityUpdate('deliveries', 'updated', delivery, delivery.id);
};

/**
 * Entrega lista
 */
export const emitDeliveryReady = (delivery: any): void => {
  notifyRole('Despachador', {
    type: 'DELIVERY_READY',
    title: 'Entrega Lista',
    message: `Entrega ${delivery.code} lista para entregar`,
    priority: 'high',
    data: { deliveryId: delivery.id, code: delivery.code },
    actionUrl: `/deliveries`
  });
  
  emitEntityUpdate('deliveries', 'updated', delivery, delivery.id);
};

/**
 * Entrega completada
 */
export const emitDeliveryCompleted = (delivery: any): void => {
  notifyAdmins({
    type: 'DELIVERY_COMPLETED',
    title: 'Entrega Completada',
    message: `Entrega ${delivery.code} completada exitosamente`,
    priority: 'normal',
    data: { deliveryId: delivery.id, code: delivery.code },
    actionUrl: `/deliveries`
  });
  
  emitEntityUpdate('deliveries', 'updated', delivery, delivery.id);
};

/**
 * Alerta de stock bajo
 */
export const emitLowStockAlert = (products: any[]): void => {
  notifyWarehouse({
    type: 'LOW_STOCK',
    title: 'Alerta de Stock Bajo',
    message: `${products.length} producto(s) con stock bajo`,
    priority: 'urgent',
    data: { products: products.map(p => ({ id: p.id, name: p.name, stock: p.currentStock })) },
    actionUrl: '/inventory'
  });
  
  notifyAdmins({
    type: 'LOW_STOCK',
    title: 'Alerta de Stock Bajo',
    message: `${products.length} producto(s) con stock bajo`,
    priority: 'high',
    data: { products: products.map(p => ({ id: p.id, name: p.name, stock: p.currentStock })) },
    actionUrl: '/inventory'
  });
};

/**
 * Actualización de dashboard
 */
export const emitDashboardUpdate = (stats: any): void => {
  if (!io) return;
  io.emit('dashboard:update', stats);
};

// ============ UTILIDADES ============

/**
 * Verificar si un usuario está conectado
 */
export const isUserConnected = (userId: string): boolean => {
  return connectedUsers.has(userId) && connectedUsers.get(userId)!.size > 0;
};

/**
 * Obtener número de usuarios conectados
 */
export const getConnectedUsersCount = (): number => {
  return connectedUsers.size;
};

/**
 * Obtener lista de usuarios conectados
 */
export const getConnectedUsers = (): string[] => {
  return Array.from(connectedUsers.keys());
};

/**
 * Obtener estadísticas de conexiones
 */
export const getConnectionStats = () => {
  return {
    totalUsers: connectedUsers.size,
    totalSockets: Array.from(connectedUsers.values()).reduce((sum, set) => sum + set.size, 0),
    users: Array.from(connectedUsers.entries()).map(([userId, sockets]) => ({
      userId,
      connections: sockets.size
    }))
  };
};

export default {
  initSocketServer,
  getIO,
  notifyUser,
  notifyRole,
  notifyAdmins,
  notifyWarehouse,
  notifyAll,
  emitEntityUpdate,
  emitNewRequest,
  emitRequestApproved,
  emitDeliveryPendingAuth,
  emitDeliveryAuthorized,
  emitDeliveryReady,
  emitDeliveryCompleted,
  emitLowStockAlert,
  emitDashboardUpdate,
  isUserConnected,
  getConnectedUsersCount,
  getConnectedUsers,
  getConnectionStats
};
