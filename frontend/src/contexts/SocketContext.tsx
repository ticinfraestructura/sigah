/**
 * Contexto de WebSocket
 * 
 * Proporciona conexión Socket.io para notificaciones en tiempo real
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// ============ TIPOS ============

interface Notification {
  id?: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, any>;
  actionUrl?: string;
  createdAt: Date;
  read?: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  subscribe: (entity: string, entityId?: string) => void;
  unsubscribe: (entity: string, entityId?: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// ============ PROVIDER ============

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Conectar al servidor WebSocket
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // En producción usa la misma URL del navegador, en desarrollo usa localhost:3001
    const socketUrl = import.meta.env.PROD 
      ? window.location.origin 
      : 'http://localhost:3001';
    
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    // Recibir notificaciones
    newSocket.on('notification', (notification: Notification) => {
      console.log('[Socket] Notification received:', notification);
      setNotifications(prev => [
        { ...notification, read: false, createdAt: new Date(notification.createdAt) },
        ...prev
      ].slice(0, 50)); // Mantener máximo 50 notificaciones

      // Mostrar notificación del navegador si está permitido
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/icon-192x192.png',
          tag: notification.id || notification.type
        });
      }
    });

    // Actualización de dashboard
    newSocket.on('dashboard:update', (stats) => {
      console.log('[Socket] Dashboard update:', stats);
      // Emitir evento personalizado para que el dashboard lo capture
      window.dispatchEvent(new CustomEvent('dashboard:update', { detail: stats }));
    });

    setSocket(newSocket);

    // Solicitar permiso de notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  // Agregar notificación manualmente
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [
      { ...notification, read: false },
      ...prev
    ].slice(0, 50));
  }, []);

  // Marcar como leída
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    socket?.emit('notification:read', id);
  }, [socket]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Limpiar notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Suscribirse a actualizaciones de entidad
  const subscribe = useCallback((entity: string, entityId?: string) => {
    socket?.emit('subscribe', entity, entityId);
  }, [socket]);

  // Desuscribirse
  const unsubscribe = useCallback((entity: string, entityId?: string) => {
    socket?.emit('unsubscribe', entity, entityId);
  }, [socket]);

  // Contar no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        subscribe,
        unsubscribe
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// ============ HOOK ============

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// ============ HOOKS ESPECÍFICOS ============

/**
 * Hook para escuchar eventos de entidad
 */
export const useEntityUpdates = (
  entity: string,
  entityId?: string,
  onCreated?: (data: any) => void,
  onUpdated?: (data: any) => void,
  onDeleted?: (data: any) => void
) => {
  const { socket, subscribe, unsubscribe } = useSocket();

  useEffect(() => {
    if (!socket) return;

    subscribe(entity, entityId);

    if (onCreated) {
      socket.on(`${entity}:created`, onCreated);
    }
    if (onUpdated) {
      socket.on(`${entity}:updated`, onUpdated);
    }
    if (onDeleted) {
      socket.on(`${entity}:deleted`, onDeleted);
    }

    return () => {
      unsubscribe(entity, entityId);
      if (onCreated) socket.off(`${entity}:created`, onCreated);
      if (onUpdated) socket.off(`${entity}:updated`, onUpdated);
      if (onDeleted) socket.off(`${entity}:deleted`, onDeleted);
    };
  }, [socket, entity, entityId, onCreated, onUpdated, onDeleted, subscribe, unsubscribe]);
};

/**
 * Hook para actualizaciones de dashboard
 */
export const useDashboardUpdates = (onUpdate: (stats: any) => void) => {
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      onUpdate(event.detail);
    };

    window.addEventListener('dashboard:update', handler as EventListener);
    return () => {
      window.removeEventListener('dashboard:update', handler as EventListener);
    };
  }, [onUpdate]);
};

export default SocketContext;
