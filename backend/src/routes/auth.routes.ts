// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware';
import { authenticate, AuthRequest, SECRET } from '../middleware/auth.middleware';
import { logLoginAttempt } from '../middleware/security.middleware';
import { 
  blacklistToken, 
  recordFailedLogin, 
  isLoginLocked, 
  clearFailedLogins,
  registerSession,
  terminateSession,
  getUserSessions
} from '../services/session.service';
import { authZodSchemas, validateZodRequest } from '../middleware/validation.middleware';

const router = Router();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutos

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { email, password } = req.body;

    if (!email || !password) {
      logLoginAttempt(false, email || 'unknown', req, 'Campos requeridos faltantes');
      return res.status(400).json({ success: false, error: 'Email y contraseña son requeridos' });
    }

    const identifier = email.toLowerCase().trim();

    // Verificar bloqueo por intentos fallidos
    const lockStatus = isLoginLocked(identifier);
    if (lockStatus.locked) {
      const minutesLeft = lockStatus.unlockTime
        ? Math.ceil((lockStatus.unlockTime.getTime() - Date.now()) / 60000)
        : 30;
      logLoginAttempt(false, identifier, req, 'Cuenta bloqueada por exceso de intentos');
      return res.status(429).json({
        success: false,
        error: `Cuenta bloqueada por múltiples intentos fallidos. Intente nuevamente en ${minutesLeft} minuto(s).`
      });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: identifier },
      include: { role: true }
    });

    // Verificar existencia y contraseña (mismo mensaje para no enumerar usuarios)
    const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isValidPassword) {
      const result = recordFailedLogin(identifier);

      // Registrar en auditoría si el usuario existe (intento fallido real)
      if (user) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN_FAILED',
            entity: 'User',
            entityId: user.id,
            newValues: JSON.stringify({
              ip: req.ip || req.socket?.remoteAddress || 'unknown',
              userAgent: req.get('User-Agent') || 'unknown',
              reason: 'Contraseña incorrecta'
            })
          }
        });
      }

      logLoginAttempt(false, identifier, req, `Intento ${MAX_FAILED_ATTEMPTS - result.remainingAttempts}/${MAX_FAILED_ATTEMPTS}`);

      if (result.remainingAttempts <= 2 && result.remainingAttempts > 0) {
        return res.status(401).json({
          success: false,
          error: `Credenciales incorrectas. Le quedan ${result.remainingAttempts} intento(s) antes del bloqueo.`
        });
      }

      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    if (!user.isActive) {
      logLoginAttempt(false, identifier, req, 'Usuario inactivo');
      return res.status(401).json({ success: false, error: 'Usuario inactivo. Contacte al administrador.' });
    }

    // Login exitoso: limpiar intentos fallidos
    clearFailedLogins(identifier);

    // Obtener permisos del rol
    let permissions: { module: string; action: string }[] = [];
    if (user.roleId) {
      permissions = await (prisma as any).$queryRaw`
        SELECT p.module, p.action
        FROM role_permissions rp
        INNER JOIN permissions p ON p.id = rp."permissionId"
        WHERE rp."roleId" = ${user.roleId}::uuid
      `;
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId || null,
      roleName: user.role?.name || 'Sin Rol'
    };

    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
    const token = jwt.sign(tokenPayload, SECRET, signOptions);

    // Registrar sesión
    const sessionId = require('crypto').randomUUID();
    registerSession(sessionId, user.id, req.get('User-Agent') || 'unknown', req.ip || 'unknown');

    // Registrar login exitoso en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        newValues: JSON.stringify({
          ip: req.ip || req.socket?.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        })
      }
    });

    logLoginAttempt(true, identifier, req, 'Login exitoso');

    // Detectar si la contraseña es débil (seed por defecto)
    const isDefaultPassword = await bcrypt.compare('admin123', user.password);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId || null,
          roleName: user.role?.name || 'Sin Rol',
          permissions
        },
        passwordExpired: isDefaultPassword
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user
  });
});

// Change password
router.post('/change-password', authenticate, validateZodRequest({ body: authZodSchemas.changePassword }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Contraseña actual incorrecta', 400);
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError('La nueva contraseña debe ser diferente a la actual', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12); // Aumentar rounds a 12
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordChangedAt: new Date() }
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        newValues: JSON.stringify({ action: 'password_changed' })
      }
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// Logout - Invalidar token actual
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token && req.user) {
    // Agregar token a la blacklist
    blacklistToken(token, req.user.id, 'logout');
    
    // Registrar logout en logs de seguridad
    logLoginAttempt(true, req.user.email, req as Request, 'Logout exitoso');
  }
  
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

// Obtener sesiones activas del usuario
router.get('/sessions', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'No autenticado' });
  }
  
  const sessions = getUserSessions(req.user.id);
  
  res.json({
    success: true,
    data: sessions.map(s => ({
      id: s.sessionId,
      userAgent: s.userAgent,
      ip: s.ip,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity
    }))
  });
});

// Cerrar una sesión específica
router.delete('/sessions/:sessionId', authenticate, validateZodRequest({ params: authZodSchemas.sessionParam }), async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  
  const terminated = terminateSession(sessionId);
  
  res.json({
    success: terminated,
    message: terminated ? 'Sesión terminada' : 'Sesión no encontrada'
  });
});

export default router;
