/**
 * Centro de Notificaciones
 * 
 * Muestra notificaciones en tiempo real con dropdown
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

// Colores por prioridad
const priorityColors = {
  low: 'bg-gray-100 dark:bg-gray-700',
  normal: 'bg-blue-50 dark:bg-blue-900/30',
  high: 'bg-yellow-50 dark:bg-yellow-900/30',
  urgent: 'bg-red-50 dark:bg-red-900/30'
};

const priorityBorders = {
  low: 'border-l-gray-400',
  normal: 'border-l-blue-500',
  high: 'border-l-yellow-500',
  urgent: 'border-l-red-500'
};

// Iconos por tipo
const typeIcons: Record<string, string> = {
  NEW_REQUEST: '📋',
  REQUEST_APPROVED: '✅',
  DELIVERY_PENDING_AUTH: '⏳',
  DELIVERY_AUTHORIZED: '✓',
  DELIVERY_READY: '📦',
  DELIVERY_COMPLETED: '🎉',
  LOW_STOCK: '⚠️',
  EXPIRING_PRODUCTS: '⏰'
};

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, clearNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatear tiempo relativo
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  // Manejar clic en notificación
  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        
        {/* Badge de no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Indicador de conexión */}
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
              {isConnected ? (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Wifi className="w-3 h-3" /> En línea
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <WifiOff className="w-3 h-3" /> Desconectado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Limpiar todas"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-l-4 ${
                    priorityBorders[notification.priority || 'normal']
                  } ${priorityColors[notification.priority || 'normal']} ${
                    !notification.read ? 'font-medium' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    <span className="text-xl flex-shrink-0">
                      {typeIcons[notification.type] || '📌'}
                    </span>
                    
                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {/* Acción */}
                      {notification.actionUrl && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver detalles</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicador de no leída */}
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
