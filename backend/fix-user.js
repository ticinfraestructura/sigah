const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function fixUser() {
  try {
    console.log('🔧 Fixing admin user role...');
    
    // Crear rol Administrador si no existe
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrador' },
      update: {},
      create: {
        name: 'Administrador',
        description: 'Acceso total al sistema',
        isSystem: true,
        isActive: true
      }
    });

    console.log('✅ Admin role created/found:', adminRole.name);

    // Asignar rol al usuario admin
    const admin = await prisma.user.update({
      where: { email: 'admin@sigah.com' },
      data: {
        roleId: adminRole.id
      }
    });

    console.log('✅ User role assigned:');
    console.log('   Email:', admin.email);
    console.log('   Role:', adminRole.name);
    
  } catch (error) {
    console.error('❌ Error fixing user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
