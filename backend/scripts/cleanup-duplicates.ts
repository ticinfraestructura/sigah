import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateDeliveries() {
  console.log('🧹 Limpiando entregas duplicadas...\n');

  // Obtener todas las entregas pendientes de autorización agrupadas por requestId
  const pendingDeliveries = await prisma.delivery.findMany({
    where: { status: 'PENDING_AUTHORIZATION' },
    orderBy: { createdAt: 'asc' },
    include: {
      request: {
        include: { beneficiary: true }
      }
    }
  });

  // Agrupar por requestId
  const grouped: Record<string, typeof pendingDeliveries> = {};
  for (const delivery of pendingDeliveries) {
    const key = delivery.requestId;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(delivery);
  }

  let deletedCount = 0;

  for (const [requestId, deliveries] of Object.entries(grouped)) {
    if (deliveries.length > 1) {
      console.log(`📋 Solicitud ${requestId} (${deliveries[0].request.beneficiary.firstName} ${deliveries[0].request.beneficiary.lastName}):`);
      console.log(`   - ${deliveries.length} entregas pendientes encontradas`);
      
      // Mantener la primera (más antigua), eliminar las demás
      const [keep, ...toDelete] = deliveries;
      console.log(`   - Manteniendo: ${keep.code} (creada ${keep.createdAt.toISOString()})`);
      
      for (const del of toDelete) {
        console.log(`   - Eliminando: ${del.code} (duplicada)`);
        
        // Eliminar historial, detalles y notificaciones asociadas
        await prisma.deliveryHistory.deleteMany({ where: { deliveryId: del.id } });
        await prisma.deliveryDetail.deleteMany({ where: { deliveryId: del.id } });
        await prisma.notification.deleteMany({ where: { deliveryId: del.id } });
        await prisma.delivery.delete({ where: { id: del.id } });
        
        deletedCount++;
      }
    }
  }

  console.log(`\n✅ Proceso completado. ${deletedCount} entregas duplicadas eliminadas.`);
}

cleanupDuplicateDeliveries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
