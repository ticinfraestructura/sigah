const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Iniciando seed manual...');

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.upsert({
      where: { email: 'admin@sigah.com' },
      update: {},
      create: {
        email: 'admin@sigah.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'SIGAH',
        isActive: true,
        roleId: 'admin-role-id' // Este ID debe existir
      }
    });

    console.log('✅ Seed completado');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
