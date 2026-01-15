import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from './error.middleware';
import { isTokenBlacklisted } from '../services/session.service';

// Validación crítica del JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET no está configurado en las variables de entorno');
  console.error('   Configure JWT_SECRET en el archivo .env con al menos 32 caracteres');
  // En desarrollo, usar un secret por defecto (solo para desarrollo)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET es requerido en producción');
  }
}
const SECRET = JWT_SECRET || 'sigah-dev-secret-key-min-32-chars!';

// Interfaz para permisos del usuario
interface UserPermission {
  module: string;
  action: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string | null;
    roleName: string;
    firstName: string;
    lastName: string;
    permissions: UserPermission[];
  };
}

// Cache de permisos por rol (para evitar consultas repetidas)
const permissionsCache: Map<string, { permissions: UserPermission[]; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticación requerido', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar si el token está en la blacklist
    if (isTokenBlacklisted(token)) {
      throw new AppError('Sesión expirada. Por favor, inicie sesión nuevamente.', 401);
    }
    
    const decoded = jwt.verify(token, SECRET) as {
      id: string;
      email: string;
      roleId: string;
      roleName: string;
      firstName: string;
      lastName: string;
    };

    const prisma: PrismaClient = req.app.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('Usuario no encontrado o inactivo', 401);
    }

    // Obtener permisos del rol
    let permissions: UserPermission[] = [];
    
    if (user.role) {
      // Verificar cache
      const cached = permissionsCache.get(user.role.id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        permissions = cached.permissions;
      } else {
        permissions = user.role.permissions.map(rp => ({
          module: rp.permission.module,
          action: rp.permission.action
        }));
        permissionsCache.set(user.role.id, { permissions, timestamp: Date.now() });
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name || 'Sin Rol',
      firstName: user.firstName,
      lastName: user.lastName,
      permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else {
      next(error);
    }
  }
};

// Verificar si el usuario tiene un permiso específico
export const hasPermission = (module: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    // Admin tiene acceso total
    if (req.user.roleName === 'Administrador') {
      return next();
    }

    const hasAccess = req.user.permissions.some(
      p => p.module === module && p.action === action
    );

    if (!hasAccess) {
      return next(new AppError(`No tienes permiso para ${action} en ${module}`, 403));
    }

    next();
  };
};

// Verificar múltiples permisos (OR - cualquiera de ellos)
export const hasAnyPermission = (permissions: { module: string; action: string }[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    // Admin tiene acceso total
    if (req.user.roleName === 'Administrador') {
      return next();
    }

    const hasAccess = permissions.some(required =>
      req.user!.permissions.some(
        p => p.module === required.module && p.action === required.action
      )
    );

    if (!hasAccess) {
      return next(new AppError('No tienes permisos para esta acción', 403));
    }

    next();
  };
};

// Verificar si es administrador
export const isAdmin = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    if (req.user.roleName !== 'Administrador') {
      return next(new AppError('Se requieren permisos de administrador', 403));
    }

    next();
  };
};

// Limpiar cache de permisos (llamar cuando se modifiquen roles)
export const clearPermissionsCache = (roleId?: string) => {
  if (roleId) {
    permissionsCache.delete(roleId);
  } else {
    permissionsCache.clear();
  }
};

// Mapeo de nombres de roles (inglés -> español)
const ROLE_NAME_MAP: Record<string, string> = {
  'ADMIN': 'Administrador',
  'WAREHOUSE': 'Bodega',
  'AUTHORIZER': 'Autorizador',
  'DISPATCHER': 'Despachador',
  'OPERATOR': 'Operador',
  'READONLY': 'Consulta',
  // También soportar nombres en español directamente
  'Administrador': 'Administrador',
  'Bodega': 'Bodega',
  'Autorizador': 'Autorizador',
  'Despachador': 'Despachador',
  'Operador': 'Operador',
  'Consulta': 'Consulta'
};

// Legacy: mantener compatibilidad con authorize existente
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401));
    }

    // Mapear nombres de roles a español
    const mappedRoles = roles.map(role => ROLE_NAME_MAP[role] || role);

    if (!mappedRoles.includes(req.user.roleName)) {
      return next(new AppError('No tienes permisos para esta acción', 403));
    }

    next();
  };
};
