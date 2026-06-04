const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function createUser() {
  try {
    console.log('🔐 Creating admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@sigah.com' },
      update: { password: hashedPassword },
      create: {
        email: 'admin@sigah.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Sistema',
        isActive: true
      }
    });

    console.log('✅ Admin user created/updated:');
    console.log('   Email: admin@sigah.com');
    console.log('   Password: admin123');
    console.log('   Name: Admin Sistema');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
