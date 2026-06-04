const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function checkStock() {
  try {
    console.log('🔍 Verificando stock en el sistema...');
    
    // Verificar stock de productos
    const productLots = await prisma.productLot.findMany({
      where: { isActive: true },
      include: { product: true },
      take: 10
    });
    
    console.log('\n📦 Stock de productos (primeros 10):');
    let totalProductStock = 0;
    productLots.forEach(lot => {
      console.log(`   - ${lot.product.name} (${lot.lotNumber}): ${lot.quantity} unidades`);
      totalProductStock += lot.quantity;
    });
    
    // Total de productos
    const totalProducts = await prisma.productLot.aggregate({
      where: { isActive: true },
      _sum: { quantity: true },
      _count: { id: true }
    });
    
    console.log(`\n📊 Total productos: ${totalProducts._count.id} lotes con ${totalProducts._sum.quantity || 0} unidades`);
    
    // Verificar kits (si hay tabla kit_inventory)
    try {
      const kits = await prisma.kit.findMany({
        include: { kitProducts: { include: { product: true } } },
        take: 5
      });
      
      console.log('\n📦 Kits disponibles:');
      kits.forEach(kit => {
        console.log(`   - ${kit.code}: ${kit.name}`);
        kit.kitProducts.forEach(kp => {
          console.log(`     * ${kp.product.name} (${kp.quantity} unidades)`);
        });
      });
      
      console.log(`\n📊 Total kits: ${kits.length} tipos`);
      
    } catch (error) {
      console.log('\n⚠️ No se encontraron kits o tabla kit_inventory no existe');
    }
    
    // Verificar movimientos recientes
    const recentMovements = await prisma.stockMovement.findMany({
      include: { product: true, lot: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('\n📋 Movimientos recientes:');
    recentMovements.forEach(movement => {
      const action = movement.type === 'ENTRY' ? 'Entrada' : movement.type === 'EXIT' ? 'Salida' : 'Ajuste';
      console.log(`   - ${action}: ${movement.product.name} (${Math.abs(movement.quantity)} unidades) - ${movement.reason}`);
    });
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error verificando stock:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStock();
