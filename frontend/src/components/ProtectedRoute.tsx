import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module: string;
  action?: string;
  fallback?: 'redirect' | 'message';
}

/**
 * Componente para proteger rutas basado en permisos
 * 
 * Uso:
 * <ProtectedRoute module="inventory" action="view">
 *   <Inventory />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ 
  children, 
  module, 
  action = 'view',
  fallback = 'message'
}: ProtectedRouteProps) {
  const { hasPermission, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(module, action)) {
    if (fallback === 'redirect') {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500 mb-4">
          No tienes permisos para acceder a esta sección.
        </p>
        <p className="text-sm text-gray-400">
          Permiso requerido: <code className="bg-gray-100 px-2 py-1 rounded">{module}:{action}</code>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook para verificar permisos en componentes
 */
export function usePermission(module: string, action: string = 'view'): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(module, action);
}

/**
 * Componente para mostrar/ocultar elementos basado en permisos
 */
export function PermissionGate({ 
  children, 
  module, 
  action = 'view',
  fallback = null
}: { 
  children: React.ReactNode; 
  module: string; 
  action?: string;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = useAuth();
  
  if (hasPermission(module, action)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
