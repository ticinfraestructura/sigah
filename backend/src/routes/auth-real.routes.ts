// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Login con autenticación real
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email y contraseña son requeridos', 400);
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true
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

    // Generar token JWT
    const tokenPayload = {
      id: user.id,
      email: user.email,
      roleId: user.roleId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Construir respuesta de usuario
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleName: user.role?.name || 'Sin rol',
      permissions: user.role?.name === 'ADMIN' ? [
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
      ] : []
    };

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    res.json({
      success: true,
      data: {
        token,
        user: userResponse,
        passwordExpired: false
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true
      }
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleName: user.role?.name || 'Sin rol'
    };

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

export default router;
