import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAuthorizer() {
  // Buscar o crear el rol AUTHORIZER
  let authorizerRole = await prisma.role.findFirst({
    where: { name: 'AUTHORIZER' }
  });

  if (!authorizerRole) {
    authorizerRole = await prisma.role.create({
      data: {
        name: 'AUTHORIZER',
        description: 'Autorizador de entregas',
        isSystem: true
      }
    });
    console.log('✅ Rol AUTHORIZER creado');
  }

  // Verificar si ya existe el usuario
  const existing = await prisma.user.findFirst({
    where: { email: 'autorizador@sigah.com' }
  });

  if (existing) {
    console.log('⚠️ El usuario autorizador ya existe');
    console.log('   Email: autorizador@sigah.com');
    console.log('   Password: Autor123!');
    await prisma.$disconnect();
    return;
  }

  // Crear usuario autorizador
  const hashedPassword = await bcrypt.hash('Autor123!', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'autorizador@sigah.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Autorizador',
      phone: '3001234567',
      roleId: authorizerRole.id,
      isActive: true
    }
  });

  console.log('\n✅ Usuario Autorizador creado:');
  console.log('   Nombre: Carlos Autorizador');
  console.log('   Email: autorizador@sigah.com');
  console.log('   Password: Autor123!');
  console.log('   Rol: AUTHORIZER');
  console.log('\n👉 Usa estas credenciales para iniciar sesión y autorizar entregas');

  await prisma.$disconnect();
}

createAuthorizer().catch(console.error);
