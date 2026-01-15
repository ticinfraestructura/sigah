import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, isAdmin, clearPermissionsCache } from '../middleware/auth.middleware';

const router = Router();

// Módulos del sistema con sus acciones disponibles
const SYSTEM_MODULES = {
  dashboard: {
    name: 'Dashboard',
    actions: ['view']
  },
  inventory: {
    name: 'Inventario',
    actions: ['view', 'create', 'edit', 'delete', 'export', 'adjust']
  },
  kits: {
    name: 'Kits',
    actions: ['view', 'create', 'edit', 'delete']
  },
  beneficiaries: {
    name: 'Beneficiarios',
    actions: ['view', 'create', 'edit', 'delete', 'export']
  },
  requests: {
    name: 'Solicitudes',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject']
  },
  deliveries: {
    name: 'Entregas',
    actions: ['view', 'create', 'authorize', 'receive', 'prepare', 'deliver', 'cancel']
  },
  returns: {
    name: 'Devoluciones',
    actions: ['view', 'create', 'process']
  },
  reports: {
    name: 'Reportes',
    actions: ['view', 'export']
  },
  users: {
    name: 'Usuarios',
    actions: ['view', 'create', 'edit', 'delete', 'activate']
  },
  roles: {
    name: 'Roles',
    actions: ['view', 'create', 'edit', 'delete', 'assign']
  },
  settings: {
    name: 'Configuración',
    actions: ['view', 'edit']
  }
};

// Verificar estado del sistema de permisos
router.get('/system-status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const [permissionCount, roleCount, userCount] = await Promise.all([
      prisma.permission.count(),
      prisma.role.count(),
      prisma.user.count()
    ]);

    const isInitialized = permissionCount > 0 && roleCount > 0;
    const hasAdminRole = await prisma.role.findFirst({ where: { name: 'Administrador' } });

    res.json({
      success: true,
      data: {
        isInitialized,
        hasAdminRole: !!hasAdminRole,
        counts: {
          permissions: permissionCount,
          roles: roleCount,
          users: userCount
        },
        message: isInitialized 
          ? 'Sistema de permisos inicializado correctamente'
          : 'Sistema no inicializado. Ejecute el seed para crear roles y permisos.'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Obtener módulos disponibles
router.get('/modules', authenticate, isAdmin(), async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: SYSTEM_MODULES });
});

// Obtener todos los roles
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const rolesWithPermissions = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissions: role.permissions.map(rp => ({
        module: rp.permission.module,
        action: rp.permission.action
      })),
      createdAt: role.createdAt
    }));

    res.json({ success: true, data: rolesWithPermissions });
  } catch (error) {
    next(error);
  }
});

// Obtener un rol por ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ success: false, error: 'Rol no encontrado' });
    }

    res.json({
      success: true,
      data: {
        ...role,
        permissions: role.permissions.map(rp => ({
          module: rp.permission.module,
          action: rp.permission.action
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo rol
router.post('/', authenticate, isAdmin(), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }

    // Verificar que el nombre no exista
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Ya existe un rol con ese nombre' });
    }

    // Crear el rol
    const role = await prisma.role.create({
      data: {
        name,
        description,
        isSystem: false
      }
    });

    // Asignar permisos si se proporcionan
    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        // Buscar o crear el permiso
        let permission = await prisma.permission.findUnique({
          where: { module_action: { module: perm.module, action: perm.action } }
        });

        if (!permission) {
          permission = await prisma.permission.create({
            data: {
              module: perm.module,
              action: perm.action,
              description: `${perm.action} en ${perm.module}`
            }
          });
        }

        // Asignar al rol
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      }
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'Role',
        entityId: role.id,
        newValues: JSON.stringify({ name, description, permissions })
      }
    });

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
});

// Actualizar un rol
router.put('/:id', authenticate, isAdmin(), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, error: 'Rol no encontrado' });
    }

    if (role.isSystem && name !== role.name) {
      return res.status(400).json({ success: false, error: 'No se puede cambiar el nombre de un rol del sistema' });
    }

    // Actualizar datos básicos
    await prisma.role.update({
      where: { id },
      data: { name, description }
    });

    // Actualizar permisos si se proporcionan
    if (permissions && Array.isArray(permissions)) {
      // Eliminar permisos actuales
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });

      // Agregar nuevos permisos
      for (const perm of permissions) {
        let permission = await prisma.permission.findUnique({
          where: { module_action: { module: perm.module, action: perm.action } }
        });

        if (!permission) {
          permission = await prisma.permission.create({
            data: {
              module: perm.module,
              action: perm.action,
              description: `${perm.action} en ${perm.module}`
            }
          });
        }

        await prisma.rolePermission.create({
          data: {
            roleId: id,
            permissionId: permission.id
          }
        });
      }

      // Limpiar cache de permisos
      clearPermissionsCache(id);
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'Role',
        entityId: id,
        oldValues: JSON.stringify({ name: role.name }),
        newValues: JSON.stringify({ name, description })
      }
    });

    res.json({ success: true, message: 'Rol actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

// Eliminar un rol
router.delete('/:id', authenticate, isAdmin(), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } }
    });

    if (!role) {
      return res.status(404).json({ success: false, error: 'Rol no encontrado' });
    }

    if (role.isSystem) {
      return res.status(400).json({ success: false, error: 'No se puede eliminar un rol del sistema' });
    }

    if (role._count.users > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `No se puede eliminar el rol porque tiene ${role._count.users} usuario(s) asignado(s)` 
      });
    }

    // Eliminar permisos del rol
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });

    // Eliminar rol
    await prisma.role.delete({ where: { id } });

    // Limpiar cache
    clearPermissionsCache(id);

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'Role',
        entityId: id,
        oldValues: JSON.stringify({ name: role.name })
      }
    });

    res.json({ success: true, message: 'Rol eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

// Asignar rol a usuario
router.post('/assign', authenticate, isAdmin(), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({ success: false, error: 'userId y roleId son requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(404).json({ success: false, error: 'Rol no encontrado' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { roleId }
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        oldValues: JSON.stringify({ roleId: user.roleId }),
        newValues: JSON.stringify({ roleId, roleName: role.name })
      }
    });

    res.json({ success: true, message: 'Rol asignado correctamente' });
  } catch (error) {
    next(error);
  }
});

// Obtener permisos del usuario actual
router.get('/my/permissions', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      role: req.user?.roleName,
      permissions: req.user?.permissions || [],
      isAdmin: req.user?.roleName === 'Administrador'
    }
  });
});

export default router;
