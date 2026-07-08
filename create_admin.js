const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sigah.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234!';

const ADMIN_ROLE_ID = '550e8400-e29b-41d4-a716-446655440000';
const ADMIN_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

async function createAdmin() {
  try {
    // Crear rol ADMIN
    await prisma.role.upsert({
      where: { id: ADMIN_ROLE_ID },
      update: {},
      create: {
        id: ADMIN_ROLE_ID,
        name: 'ADMIN',
        description: 'Administrador del sistema',
        isSystem: true,
        isActive: true
      }
    });

    // Crear usuario admin
    const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);

    await prisma.user.upsert({
      where: { id: ADMIN_USER_ID },
      update: {
        password: hashedPassword,
        roleId: ADMIN_ROLE_ID,
        isActive: true
      },
      create: {
        id: ADMIN_USER_ID,
        email: ADMIN_EMAIL,
        firstName: 'Admin',
        lastName: 'Sistema',
        password: hashedPassword,
        roleId: ADMIN_ROLE_ID,
        isActive: true
      }
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email: ' + ADMIN_EMAIL);
    console.log('🔑 Password: ' + ADMIN_PASSWORD);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
