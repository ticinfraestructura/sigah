const { PrismaClient } = require('@prisma/client');

async function checkRealStock() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      }
    });

    console.log('🔍 Verificando stock REAL del sistema...');

    // 1. Verificar stock en kit_inventory (lo que creé)
    const kitInventory = await prisma.$queryRaw`
      SELECT 
        k.code,
        k.name,
        ki.quantity as kit_inventory_quantity
      FROM kits k
      LEFT JOIN kit_inventory ki ON k.id = ki.kit_id
      WHERE k.isActive = true
      ORDER BY k.code
    `;

    console.log('\n📦 Stock en kit_inventory (tabla que creé):');
    console.log('===============================================');
    kitInventory.forEach(kit => {
      console.log(`${kit.code} - ${kit.name}: ${kit.kit_inventory_quantity || 0}`);
    });

    // 2. Verificar disponibilidad real calculada por productos
    console.log('\n🔬 Verificando disponibilidad REAL por productos...');
    
    const kits = await prisma.kit.findMany({
      where: { isActive: true },
      include: {
        kitProducts: {
          include: { product: true }
        }
      }
    });

    for (const kit of kits) {
      console.log(`\n📋 ${kit.code} - ${kit.name}:`);
      console.log('  Productos requeridos:');
      
      let maxKitsPossible = Infinity;
      let limitingProduct = null;
      
      for (const kp of kit.kitProducts) {
        // Verificar stock real de cada producto
        const productStock = await prisma.$queryRaw`
          SELECT COALESCE(SUM(pl.quantity), 0) as total_stock
          FROM product_lots pl
          WHERE pl.productId = ${kp.product.id}
          AND pl.quantity > 0
        `;
        
        const totalStock = Number(productStock[0]?.total_stock || 0);
        const kitsPossible = Math.floor(totalStock / kp.quantity);
        
        if (kitsPossible < maxKitsPossible) {
          maxKitsPossible = kitsPossible;
          limitingProduct = kp.product.name;
        }
        
        const status = kitsPossible > 0 ? '✅' : '❌';
        console.log(`    ${status} ${kp.product.name}: ${kp.quantity} requeridos, ${totalStock} disponibles → ${kitsPossible} kits posibles`);
      }
      
      if (maxKitsPossible === Infinity) maxKitsPossible = 0;
      
      console.log(`  🎯 Máximo de kits completos posibles: ${maxKitsPossible}`);
      if (maxKitsPossible === 0 && limitingProduct) {
        console.log(`  ⚠️ Producto limitante: ${limitingProduct}`);
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRealStock();
