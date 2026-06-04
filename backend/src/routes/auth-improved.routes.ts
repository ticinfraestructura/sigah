import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const router = Router();
const prisma = new PrismaClient();

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Generar token JWT
const generateToken = (user: any) => {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'sigah-backend',
    audience: 'sigah-frontend'
  });
};

// Verificar token JWT
const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'sigah-backend',
      audience: 'sigah-frontend'
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

// Middleware de autenticación mejorado
export const authenticateImproved = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Verificar que el usuario aún exista y esté activo
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

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado o inactivo'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: (error instanceof Error ? error.message : 'Error de autenticación')
    });
  }
};

// Middleware de autorización mejorado
export const authorizeImproved = (role: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    // Administradores tienen acceso a todo
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Verificar rol específico
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: `Rol requerido: ${role}`
      });
    }

    next();
  };
};

// Login mejorado
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email y contraseña son requeridos', 400);
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
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

    // Generar token
    const token = generateToken(user);

    // Actualizar último login (si el campo existe)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() }
      });
    } catch (error) {
      // Ignorar error si el campo no existe
    }

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error instanceof Error ? error : new AppError('Error desconocido', 500));
  }
});

// Verificar token actual
router.get('/verify', authenticateImproved, async (req: any, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      valid: true
    }
  });
});

// Obtener perfil del usuario actual
router.get('/profile', authenticateImproved, async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error instanceof Error ? error : new AppError('Error desconocido', 500));
  }
});

// Cambiar contraseña
router.post('/change-password', authenticateImproved, async (req: any, res: Response, next: NextFunction) => {
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
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    next(error instanceof Error ? error : new AppError('Error desconocido', 500));
  }
});

// Logout
router.post('/logout', authenticateImproved, async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

export default router;
