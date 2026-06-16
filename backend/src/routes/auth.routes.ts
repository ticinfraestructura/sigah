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

// Login DESHABILITADO para pruebas - Acceso sin autenticación
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔓 MODO PRUEBAS: Acceso sin autenticación habilitado');
    
    // Usuario de pruebas con permisos completos
    const mockUser = {
      id: 'test-admin-id',
      email: 'test@sigah.com',
      firstName: 'Usuario',
      lastName: 'Pruebas',
      roleId: 'admin-role-id',
      roleName: 'Administrador',
      permissions: [
        // Dashboard
        { module: 'dashboard', action: 'view' },
        // Inventario
        { module: 'inventory', action: 'view' },
        { module: 'inventory', action: 'create' },
        { module: 'inventory', action: 'edit' },
        { module: 'inventory', action: 'delete' },
        { module: 'inventory', action: 'export' },
        { module: 'inventory', action: 'adjust' },
        // Kits
        { module: 'kits', action: 'view' },
        { module: 'kits', action: 'create' },
        { module: 'kits', action: 'edit' },
        { module: 'kits', action: 'delete' },
        // Beneficiarios
        { module: 'beneficiaries', action: 'view' },
        { module: 'beneficiaries', action: 'create' },
        { module: 'beneficiaries', action: 'edit' },
        { module: 'beneficiaries', action: 'delete' },
        { module: 'beneficiaries', action: 'export' },
        // Solicitudes
        { module: 'requests', action: 'view' },
        { module: 'requests', action: 'create' },
        { module: 'requests', action: 'edit' },
        { module: 'requests', action: 'delete' },
        { module: 'requests', action: 'approve' },
        { module: 'requests', action: 'reject' },
        // Entregas
        { module: 'deliveries', action: 'view' },
        { module: 'deliveries', action: 'create' },
        { module: 'deliveries', action: 'authorize' },
        { module: 'deliveries', action: 'prepare' },
        { module: 'deliveries', action: 'dispatch' },
        // Reportes
        { module: 'reports', action: 'view' },
        { module: 'reports', action: 'export' },
        // Usuarios
        { module: 'users', action: 'view' },
        { module: 'users', action: 'create' },
        { module: 'users', action: 'edit' },
        { module: 'users', action: 'delete' },
        // Roles
        { module: 'roles', action: 'view' },
        { module: 'roles', action: 'create' },
        { module: 'roles', action: 'edit' },
        { module: 'roles', action: 'delete' }
      ]
    };

    const signOptions: SignOptions = { expiresIn: '24h' };
    const token = jwt.sign(
      mockUser,
      SECRET,
      signOptions
    );

    res.json({
      success: true,
      data: {
        token,
        user: mockUser,
        passwordExpired: false
      }
    });

  } catch (error) {
    console.error('Error en login de pruebas:', error);
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
