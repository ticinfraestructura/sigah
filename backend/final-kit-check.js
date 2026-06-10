const { PrismaClient } = require('@prisma/client');

async function finalKitCheck() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      }
    });

    console.log('🔍 VERIFICACIÓN FINAL DE KITS Y DISPONIBILIDAD');
    console.log('===========================================');

    // Obtener todos los kits activos
    const kits = await prisma.kit.findMany({
      where: { isActive: true },
      include: {
        kitProducts: {
          include: { 
            product: {
              include: {
                lots: {
                  where: { quantity: { gt: 0 } },
                  select: { quantity: true }
                }
              }
            }
          }
        }
      },
      orderBy: { code: 'asc' }
    });

    console.log(`\n📦 TOTAL DE KITS ACTIVOS: ${kits.length}`);
    console.log('===========================================');

    for (const kit of kits) {
      console.log(`\n📋 ${kit.code} - ${kit.name}`);
      console.log('-------------------------------------------');
      
      let maxKitsPossible = Infinity;
      let limitingProduct = null;
      
      console.log('  📦 Componentes y stock:');
      
      for (const kp of kit.kitProducts) {
        // Calcular stock total del producto
        const totalStock = kp.product.lots.reduce((sum, lot) => sum + lot.quantity, 0);
        const kitsPossible = Math.floor(totalStock / kp.quantity);
        
        if (kitsPossible < maxKitsPossible) {
          maxKitsPossible = kitsPossible;
          limitingProduct = kp.product.name;
        }
        
        const status = kitsPossible > 0 ? '✅' : '❌';
        console.log(`    ${status} ${kp.product.name}: ${kp.quantity} requeridos, ${totalStock} disponibles → ${kitsPossible} kits`);
      }
      
      if (maxKitsPossible === Infinity) maxKitsPossible = 0;
      
      console.log(`  🎯 KITS COMPLETOS POSIBLES: ${maxKitsPossible}`);
      if (maxKitsPossible === 0 && limitingProduct) {
        console.log(`  ⚠️ Producto limitante: ${limitingProduct}`);
      }
    }

    // Resumen final
    console.log('\n📊 RESUMEN FINAL');
    console.log('===========================================');
    
    const summary = [];
    for (const kit of kits) {
      let maxKitsPossible = Infinity;
      for (const kp of kit.kitProducts) {
        const totalStock = kp.product.lots.reduce((sum, lot) => sum + lot.quantity, 0);
        const kitsPossible = Math.floor(totalStock / kp.quantity);
        maxKitsPossible = Math.min(maxKitsPossible, kitsPossible);
      }
      if (maxKitsPossible === Infinity) maxKitsPossible = 0;
      
      summary.push({
        code: kit.code,
        name: kit.name,
        available: maxKitsPossible
      });
    }
    
    summary.forEach((item, index) => {
      const status = item.available > 0 ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${item.code} - ${item.name} (${item.available})`);
    });

    const availableKits = summary.filter(k => k.available > 0);
    console.log(`\n🎯 KITS CON STOCK DISPONIBLE: ${availableKits.length}/${summary.length}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

finalKitCheck();
