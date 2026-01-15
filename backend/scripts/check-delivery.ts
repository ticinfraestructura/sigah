import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDelivery() {
  const delivery = await prisma.delivery.findFirst({
    where: { status: 'PENDING_AUTHORIZATION' },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }
    }
  });

  if (delivery) {
    console.log('\n📦 Entrega pendiente de autorización:');
    console.log('   Código:', delivery.code);
    console.log('   Creada por:', delivery.createdBy?.firstName, delivery.createdBy?.lastName);
    console.log('   Email:', delivery.createdBy?.email);
    console.log('   ID usuario:', delivery.createdBy?.id);
    console.log('\n⚠️  NOTA: Este usuario NO puede autorizar esta entrega (segregación de funciones)');
  } else {
    console.log('No hay entregas pendientes de autorización');
  }

  // Listar usuarios que pueden autorizar
  console.log('\n👥 Usuarios que pueden autorizar (ADMIN o AUTHORIZER):');
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        name: { in: ['ADMIN', 'AUTHORIZER'] }
      }
    },
    include: { role: true }
  });

  for (const user of users) {
    const canAuthorize = user.id !== delivery?.createdById;
    console.log(`   - ${user.firstName} ${user.lastName} (${user.role?.name}) ${canAuthorize ? '✅ Puede autorizar' : '❌ No puede (creó la entrega)'}`);
  }

  await prisma.$disconnect();
}

checkDelivery().catch(console.error);
