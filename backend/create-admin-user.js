const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creando usuario administrador...');

    // Verificar si ya existe un usuario admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@sigah.com' }
    });

    if (existingAdmin) {
      console.log('✅ Usuario admin ya existe');
      return;
    }

    // Crear rol de administrador si no existe
    let adminRole = await prisma.role.findFirst({
      where: { name: 'ADMIN' }
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'ADMIN',
          description: 'Administrador del sistema con acceso completo'
        }
      });
      console.log('✅ Rol ADMIN creado');
    }

    // Crear permisos si no existen
    const permissions = [
      { module: 'dashboard', action: 'view' },
      { module: 'inventory', action: 'view' },
      { module: 'inventory', action: 'create' },
      { module: 'inventory', action: 'edit' },
      { module: 'inventory', action: 'delete' },
      { module: 'inventory', action: 'export' },
      { module: 'inventory', action: 'adjust' },
      { module: 'kits', action: 'view' },
      { module: 'kits', action: 'create' },
      { module: 'kits', action: 'edit' },
      { module: 'kits', action: 'delete' },
      { module: 'beneficiaries', action: 'view' },
      { module: 'beneficiaries', action: 'create' },
      { module: 'beneficiaries', action: 'edit' },
      { module: 'beneficiaries', action: 'delete' },
      { module: 'beneficiaries', action: 'export' },
      { module: 'requests', action: 'view' },
      { module: 'requests', action: 'create' },
      { module: 'requests', action: 'edit' },
      { module: 'requests', action: 'delete' },
      { module: 'requests', action: 'approve' },
      { module: 'requests', action: 'reject' },
      { module: 'deliveries', action: 'view' },
      { module: 'deliveries', action: 'create' },
      { module: 'deliveries', action: 'authorize' },
      { module: 'deliveries', action: 'prepare' },
      { module: 'deliveries', action: 'dispatch' },
      { module: 'reports', action: 'view' },
      { module: 'reports', action: 'export' },
      { module: 'users', action: 'view' },
      { module: 'users', action: 'create' },
      { module: 'users', action: 'edit' },
      { module: 'users', action: 'delete' },
      { module: 'roles', action: 'view' },
      { module: 'roles', action: 'create' },
      { module: 'roles', action: 'edit' },
      { module: 'roles', action: 'delete' }
    ];

    for (const perm of permissions) {
      const existingPerm = await prisma.permission.findFirst({
        where: { module: perm.module, action: perm.action }
      });

      if (!existingPerm) {
        await prisma.permission.create({
          data: perm
        });
      }
    }

    // Asignar todos los permisos al rol ADMIN
    const allPermissions = await prisma.permission.findMany();
    for (const perm of allPermissions) {
      const existingRolePerm = await prisma.rolePermission.findFirst({
        where: { roleId: adminRole.id, permissionId: perm.id }
      });

      if (!existingRolePerm) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: perm.id
          }
        });
      }
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear usuario administrador
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@sigah.com',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        roleId: adminRole.id,
        isActive: true
      }
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email: admin@sigah.com');
    console.log('🔑 Contraseña: admin123');

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
