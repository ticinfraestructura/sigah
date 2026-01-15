import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
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
import { validate, authValidations } from '../middleware/validation.middleware';

const router = Router();

// Validación del JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'sigah-dev-secret-key-min-32-chars!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Validación de complejidad de contraseña
const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una minúscula' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un número' };
  }
  return { valid: true, message: '' };
};

// Login con validación y protección contra fuerza bruta
router.post('/login', validate(authValidations.login), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { email, password } = req.body;
    const loginIdentifier = `${req.ip}-${email}`;

    // Verificar si la cuenta está bloqueada
    const lockStatus = isLoginLocked(loginIdentifier);
    if (lockStatus.locked) {
      logLoginAttempt(false, email, req, 'Cuenta bloqueada temporalmente');
      const unlockTime = lockStatus.unlockTime ? 
        Math.ceil((lockStatus.unlockTime.getTime() - Date.now()) / 60000) : 15;
      throw new AppError(
        `Cuenta bloqueada temporalmente. Intente nuevamente en ${unlockTime} minutos.`, 
        429
      );
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
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
      const failResult = recordFailedLogin(loginIdentifier);
      logLoginAttempt(false, email, req, 'Usuario no encontrado o inactivo');
      
      if (failResult.locked) {
        throw new AppError('Cuenta bloqueada temporalmente por múltiples intentos fallidos.', 429);
      }
      throw new AppError(`Credenciales inválidas. Intentos restantes: ${failResult.remainingAttempts}`, 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const failResult = recordFailedLogin(loginIdentifier);
      logLoginAttempt(false, email, req, 'Contraseña incorrecta');
      
      if (failResult.locked) {
        throw new AppError('Cuenta bloqueada temporalmente por múltiples intentos fallidos.', 429);
      }
      throw new AppError(`Credenciales inválidas. Intentos restantes: ${failResult.remainingAttempts}`, 401);
    }

    // Login exitoso - limpiar intentos fallidos
    clearFailedLogins(loginIdentifier);
    logLoginAttempt(true, email, req, `Rol: ${user.role?.name || 'Sin rol'}`);

    // Obtener permisos del rol
    const permissions = user.role?.permissions.map(rp => ({
      module: rp.permission.module,
      action: rp.permission.action
    })) || [];

    const signOptions: SignOptions = { expiresIn: '24h' };
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        roleId: user.roleId,
        roleName: user.role?.name || 'Sin Rol',
        firstName: user.firstName,
        lastName: user.lastName
      },
      JWT_SECRET,
      signOptions
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId,
          roleName: user.role?.name || 'Sin Rol',
          permissions
        }
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
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Contraseña actual y nueva son requeridas', 400);
    }

    // Validar complejidad de la nueva contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message, 400);
    }

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
      data: { password: hashedPassword }
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
router.delete('/sessions/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  
  const terminated = terminateSession(sessionId);
  
  res.json({
    success: terminated,
    message: terminated ? 'Sesión terminada' : 'Sesión no encontrada'
  });
});

export default router;
