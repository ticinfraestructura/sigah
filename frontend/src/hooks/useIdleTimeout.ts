import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface UseIdleTimeoutOptions {
  timeoutMinutes?: number;
  onTimeout?: () => void;
  warningMinutes?: number;
  onWarning?: () => void;
}

export const useIdleTimeout = ({
  timeoutMinutes = 30, // 30 minutos por defecto
  onTimeout,
  warningMinutes = 5, // Advertencia a los 5 minutos
  onWarning
}: UseIdleTimeoutOptions = {}) => {
  const { logout } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsRef = useRef<string[]>([
    'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
  ]);

  const resetTimers = () => {
    // Limpiar timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Configurar timer de advertencia
    if (onWarning && warningMinutes < timeoutMinutes) {
      const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
      warningRef.current = setTimeout(() => {
        onWarning();
      }, warningTime);
    }

    // Configurar timer de timeout
    const timeoutTime = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      } else {
        logout();
      }
    }, timeoutTime);
  };

  useEffect(() => {
    const handleActivity = () => {
      resetTimers();
    };

    // Agregar event listeners
    eventsRef.current.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Iniciar timers
    resetTimers();

    // Cleanup
    return () => {
      eventsRef.current.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [timeoutMinutes, warningMinutes, onTimeout, onWarning, logout]);

  return {
    reset: resetTimers
  };
};
