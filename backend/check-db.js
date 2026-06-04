const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function checkDatabase() {
  try {
    console.log('🔍 Verificando base de datos...');
    
    // Contar usuarios
    const userCount = await prisma.user.count();
    console.log(`👥 Usuarios: ${userCount}`);
    
    // Mostrar usuarios existentes
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true
        },
        take: 5
      });
      
      console.log('📋 Usuarios encontrados:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.firstName} ${user.lastName}) - Activo: ${user.isActive}`);
      });
    }
    
    // Verificar tablas disponibles
    try {
      const roleCount = await prisma.role.count();
      console.log(`🔐 Roles: ${roleCount}`);
    } catch (e) {
      console.log(`🔐 Roles: Tabla no existe`);
    }
    
    try {
      const productCount = await prisma.product.count();
      console.log(`📦 Productos: ${productCount}`);
    } catch (e) {
      console.log(`📦 Productos: Tabla no existe`);
    }
    
    try {
      const kitCount = await prisma.kit.count();
      console.log(`📦 Kits: ${kitCount}`);
    } catch (e) {
      console.log(`📦 Kits: Tabla no existe`);
    }
    
    try {
      const beneficiaryCount = await prisma.beneficiary.count();
      console.log(`👨‍👩‍👧‍👦 Beneficiarios: ${beneficiaryCount}`);
    } catch (e) {
      console.log(`👨‍👩‍👧‍👦 Beneficiarios: Tabla no existe`);
    }
    
    console.log('✅ Base de datos verificada exitosamente');
    
  } catch (error) {
    console.error('❌ Error al verificar base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
