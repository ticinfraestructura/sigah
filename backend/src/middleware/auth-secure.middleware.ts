import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
    permissions: Array<{ module: string; action: string }>;
  };
}

interface JWTPayload {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: Array<{ module: string; action: string }>;
  type: 'access' | 'refresh';
}

const prisma = new PrismaClient();

export class AuthSecureMiddleware {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
  private static readonly JWT_EXPIRES_IN = '15m';
  private static readonly JWT_REFRESH_EXPIRES_IN = '7d';

  // Generar tokens
  static generateTokens(user: any) {
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
      permissions: user.permissions || [],
      type: 'access'
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'sigah-backend',
      audience: 'sigah-frontend'
    });

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      {
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        issuer: 'sigah-backend',
        audience: 'sigah-frontend'
      }
    );

    return { accessToken, refreshToken };
  }

  // Verificar token de acceso
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'sigah-backend',
        audience: 'sigah-frontend'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Token de acceso inválido o expirado');
    }
  }

  // Verificar token de refresh
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET, {
        issuer: 'sigah-backend',
        audience: 'sigah-frontend'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Token de refresh inválido o expirado');
    }
  }

  // Middleware de autenticación
  static authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token de acceso requerido'
        });
      }

      const token = authHeader.substring(7);
      const decoded = this.verifyAccessToken(token);

      // Verificar que el usuario aún exista y esté activo
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no encontrado o inactivo'
        });
      }

      // Construir permisos
      const permissions = user.role?.permissions.map(rp => ({
        module: rp.permission.module,
        action: rp.permission.action
      })) || [];

      req.user = {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role?.name || '',
        permissions
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: error.message || 'Error de autenticación'
      });
    }
  };

  // Middleware de autorización
  static authorize = (module: string, action: string = 'view') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Administradores tienen acceso a todo
      if (req.user.roleName === 'Administrador') {
        return next();
      }

      // Verificar permiso específico
      const hasPermission = req.user.permissions.some(
        p => p.module === module && p.action === action
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Permiso requerido: ${module}:${action}`
        });
      }

      next();
    };
  };

  // Refresh token endpoint
  static refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Token de refresh requerido'
        });
      }

      const decoded = this.verifyRefreshToken(refreshToken);

      // Verificar que el usuario aún exista
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no encontrado o inactivo'
        });
      }

      // Generar nuevos tokens
      const permissions = user.role?.permissions.map(rp => ({
        module: rp.permission.module,
        action: rp.permission.action
      })) || [];

      const tokens = this.generateTokens({
        ...user,
        permissions
      });

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: user.roleId,
            roleName: user.role?.name || '',
            permissions
          }
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message || 'Error al refrescar token'
      });
    }
  };

  // Logout endpoint
  static logout = async (req: Request, res: Response) => {
    // En una implementación real, aquí podrías invalidar el token
    // en una base de datos de tokens blacklist
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  };
}
