import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Login con autenticación real
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email con relación de rol
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role?.name || 'Usuario'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Construir respuesta de usuario con permisos completos para admin
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      roleName: user.role?.name || 'Usuario',
      permissions: user.role?.name === 'Administrador' ? [
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
      ] : [
        // Permisos básicos para usuarios normales
        { module: 'dashboard', action: 'view' },
        { module: 'inventory', action: 'view' },
        { module: 'beneficiaries', action: 'view' },
        { module: 'requests', action: 'view' },
        { module: 'requests', action: 'create' },
        { module: 'deliveries', action: 'view' },
        { module: 'reports', action: 'view' }
      ]
    };

    res.json({
      success: true,
      data: {
        token,
        user: userResponse,
        passwordExpired: false
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

export default router;
