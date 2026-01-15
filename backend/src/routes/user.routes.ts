import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest, hasPermission } from '../middleware/auth.middleware';

const router = Router();

// Obtener todos los usuarios
router.get('/', authenticate, hasPermission('users', 'view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsappApiKey: true,
        telegramChatId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      whatsappApiKey: user.whatsappApiKey,
      telegramChatId: user.telegramChatId,
      isActive: user.isActive,
      roleId: user.role?.id,
      roleName: user.role?.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    next(error);
  }
});

// Obtener un usuario por ID
router.get('/:id', authenticate, hasPermission('users', 'view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roleId: user.role?.id,
        roleName: user.role?.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo usuario
router.post('/', authenticate, hasPermission('users', 'create'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { email, password, firstName, lastName, phone, whatsappApiKey, telegramChatId, roleId } = req.body;

    // Validaciones
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, contraseña, nombre y apellido son requeridos' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar email único
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Ya existe un usuario con ese email' });
    }

    // Verificar rol si se proporciona
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return res.status(400).json({ success: false, error: 'Rol no encontrado' });
      }
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        whatsappApiKey: whatsappApiKey || null,
        telegramChatId: telegramChatId || null,
        roleId: roleId || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        newValues: JSON.stringify({ email, firstName, lastName, roleId })
      }
    });

    res.status(201).json({ 
      success: true, 
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roleId: user.role?.id,
        roleName: user.role?.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar un usuario
router.put('/:id', authenticate, hasPermission('users', 'edit'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;
    const { email, firstName, lastName, phone, whatsappApiKey, telegramChatId, roleId, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Verificar email único si se cambia
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Ya existe un usuario con ese email' });
      }
    }

    // Verificar rol si se proporciona
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return res.status(400).json({ success: false, error: 'Rol no encontrado' });
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (whatsappApiKey !== undefined) updateData.whatsappApiKey = whatsappApiKey || null;
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId || null;
    if (roleId !== undefined) updateData.roleId = roleId || null;
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        oldValues: JSON.stringify({ email: user.email, firstName: user.firstName, lastName: user.lastName }),
        newValues: JSON.stringify(updateData)
      }
    });

    res.json({ 
      success: true, 
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isActive: updatedUser.isActive,
        roleId: updatedUser.role?.id,
        roleName: updatedUser.role?.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Activar/Desactivar usuario
router.patch('/:id/toggle-active', authenticate, hasPermission('users', 'activate'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // No permitir desactivar al propio usuario
    if (user.id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'No puedes desactivar tu propia cuenta' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        oldValues: JSON.stringify({ isActive: user.isActive }),
        newValues: JSON.stringify({ isActive: updatedUser.isActive })
      }
    });

    res.json({ 
      success: true, 
      message: updatedUser.isActive ? 'Usuario activado' : 'Usuario desactivado',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Eliminar un usuario
router.delete('/:id', authenticate, hasPermission('users', 'delete'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // No permitir eliminar al propio usuario
    if (user.id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'No puedes eliminar tu propia cuenta' });
    }

    // Verificar si el usuario es el único administrador
    if (user.roleId) {
      const role = await prisma.role.findUnique({ where: { id: user.roleId } });
      if (role?.name === 'Administrador') {
        const adminCount = await prisma.user.count({
          where: { role: { name: 'Administrador' }, isActive: true }
        });
        if (adminCount <= 1) {
          return res.status(400).json({ 
            success: false, 
            error: 'No se puede eliminar al único administrador activo del sistema' 
          });
        }
      }
    }

    await prisma.user.delete({ where: { id } });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        oldValues: JSON.stringify({ email: user.email, firstName: user.firstName, lastName: user.lastName })
      }
    });

    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

// Resetear contraseña de usuario
router.post('/:id/reset-password', authenticate, hasPermission('users', 'edit'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        newValues: JSON.stringify({ action: 'password_reset' })
      }
    });

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
