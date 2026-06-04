import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthSecureMiddleware } from '../middleware/auth-secure.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();
const prisma = new PrismaClient();

// Login seguro
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email y contraseña son requeridos', 400);
    }

    // Buscar usuario con rol y permisos
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    if (!user.isActive) {
      throw new AppError('Usuario inactivo', 401);
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Construir permisos
    const permissions = user.role?.permissions.map(rp => ({
      module: rp.permission.module,
      action: rp.permission.action
    })) || [];

    // Generar tokens
    const tokens = AuthSecureMiddleware.generateTokens({
      ...user,
      permissions
    });

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        details: { email, timestamp: new Date() },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || ''
      }
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
          permissions,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', AuthSecureMiddleware.refreshToken);

// Logout
router.post('/logout', AuthSecureMiddleware.logout);

// Verificar token actual
router.get('/verify', AuthSecureMiddleware.authenticate, async (req: any, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      valid: true
    }
  });
});

// Cambiar contraseña
router.post('/change-password', AuthSecureMiddleware.authenticate, async (req: any, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      throw new AppError('Contraseña actual y nueva son requeridas', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('La nueva contraseña debe tener al menos 6 caracteres', 400);
    }

    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Contraseña actual incorrecta', 400);
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        passwordChangedAt: new Date()
      }
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'PASSWORD_CHANGE',
        entity: 'User',
        entityId: userId,
        details: { timestamp: new Date() },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || ''
      }
    });

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// Obtener perfil del usuario actual
router.get('/profile', AuthSecureMiddleware.authenticate, async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    module: true,
                    action: true,
                    description: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const permissions = user.role?.permissions.map(rp => rp.permission) || [];

    res.json({
      success: true,
      data: {
        ...user,
        role: user.role ? {
          ...user.role,
          permissions
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
