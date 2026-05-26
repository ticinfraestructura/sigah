const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentKits() {
  try {
    // Buscar movimientos de los últimos 15 minutos
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    console.log('=== BUSCANDO MOVIMIENTOS RECIENTES (Últimos 15 minutos) ===');
    console.log('Desde:', fifteenMinutesAgo.toLocaleString());
    console.log('Hasta:', new Date().toLocaleString());
    console.log('');
    
    // Buscar todos los movimientos ENTRY recientes
    const recentEntries = await prisma.stockMovement.findMany({
      where: {
        type: 'ENTRY',
        createdAt: {
          gte: fifteenMinutesAgo
        }
      },
      include: {
        product: true,
        lot: true,
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total de movimientos ENTRY recientes: ${recentEntries.length}`);
    console.log('');
    
    if (recentEntries.length === 0) {
      console.log('❌ No se encontraron movimientos de entrada en los últimos 15 minutos');
    } else {
      console.log('=== MOVIMIENTOS RECIENTES ENCONTRADOS ===');
      recentEntries.forEach((movement, index) => {
        console.log(`\n${index + 1}. MOVIMIENTO DE ENTRADA`);
        console.log(`   Producto: ${movement.product.name} (${movement.product.code})`);
        console.log(`   Cantidad: ${movement.quantity}`);
        console.log(`   Usuario: ${movement.user.firstName} ${movement.user.lastName}`);
        console.log(`   Fecha/Hora: ${movement.createdAt.toLocaleString()}`);
        console.log(`   Referencia: ${movement.reference || 'Sin referencia'}`);
        console.log(`   Motivo: ${movement.reason || 'Sin motivo'}`);
        console.log(`   Lote: ${movement.lot?.lotNumber || 'Sin lote'}`);
        console.log(`   ¿Es kit?: ${movement.reference?.includes('KIT_ENTRY:') || movement.reason?.includes('Entrada kit') ? 'SÍ' : 'NO'}`);
      });
    }
    
    // Buscar específicamente movimientos de kit recientes
    console.log('\n\n=== BUSCANDO ESPECÍFICAMENTE MOVIMIENTOS DE KIT RECIENTES ===');
    
    const recentKitEntries = await prisma.stockMovement.findMany({
      where: {
        type: 'ENTRY',
        createdAt: {
          gte: fifteenMinutesAgo
        },
        OR: [
          { reference: { startsWith: 'KIT_ENTRY:' } },
          { reason: { startsWith: 'Entrada kit' } }
        ]
      },
      include: {
        product: true,
        lot: true,
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total de movimientos de kit recientes: ${recentKitEntries.length}`);
    
    if (recentKitEntries.length === 0) {
      console.log('❌ No se encontraron movimientos de kit en los últimos 15 minutos');
    } else {
      console.log('✅ MOVIMIENTOS DE KIT RECIENTES:');
      recentKitEntries.forEach((movement, index) => {
        console.log(`\n${index + 1}. KIT ENTRY`);
        console.log(`   Producto: ${movement.product.name} (${movement.product.code})`);
        console.log(`   Cantidad: ${movement.quantity}`);
        console.log(`   Usuario: ${movement.user.firstName} ${movement.user.lastName}`);
        console.log(`   Fecha/Hora: ${movement.createdAt.toLocaleString()}`);
        console.log(`   Referencia: ${movement.reference}`);
        console.log(`   Motivo: ${movement.reason}`);
      });
    }
    
    // También buscar todos los movimientos de hoy para comparar
    console.log('\n\n=== TODOS LOS MOVIMIENTOS DE KIT DE HOY ===');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayKitEntries = await prisma.stockMovement.findMany({
      where: {
        type: 'ENTRY',
        createdAt: {
          gte: today
        },
        OR: [
          { reference: { startsWith: 'KIT_ENTRY:' } },
          { reason: { startsWith: 'Entrada kit' } }
        ]
      },
      include: {
        product: true,
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total de movimientos de kit hoy: ${todayKitEntries.length}`);
    
    if (todayKitEntries.length > 0) {
      console.log('\nÚltimos movimientos de hoy:');
      todayKitEntries.slice(0, 5).forEach((movement, index) => {
        console.log(`${index + 1}. ${movement.product.name} - ${movement.createdAt.toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentKits();
