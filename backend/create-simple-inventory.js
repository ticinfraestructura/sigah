const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function createSimpleInventory() {
  try {
    console.log('🔧 Creando datos de prueba simples para inventario...');
    
    // Desactivar claves foráneas temporalmente
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    
    // 1. Crear movimientos de stock
    console.log('📋 Creando movimientos de stock...');
    const allLots = await prisma.productLot.findMany({ where: { isActive: true } });
    
    if (allLots.length === 0) {
      console.log('⚠️ No se encontraron lotes de productos');
      return;
    }
    
    for (let i = 0; i < 30; i++) {
      const lot = allLots[Math.floor(Math.random() * allLots.length)];
      const movementTypes = ['ENTRY', 'EXIT', 'ADJUSTMENT'];
      const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      const quantity = Math.floor(Math.random() * 30) + 1;
      
      const reasons = {
        'ENTRY': ['Compra', 'Donación', 'Devolución', 'Transferencia'],
        'EXIT': ['Venta', 'Donación', 'Despacho', 'Pérdida'],
        'ADJUSTMENT': ['Ajuste de inventario', 'Corrección', 'Reconteo']
      };
      
      const reason = reasons[movementType][Math.floor(Math.random() * reasons[movementType].length)];
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      await prisma.stockMovement.create({
        data: {
          productId: lot.productId,
          lotId: lot.id,
          type: movementType,
          quantity: movementType === 'EXIT' ? -quantity : quantity,
          reason: reason,
          userId: 'test-admin-id',
          createdAt: createdAt
        }
      });
    }
    
    // 2. Crear solicitudes de ejemplo
    console.log('📋 Creando solicitudes de ejemplo...');
    const beneficiaries = await prisma.beneficiary.findMany({ take: 3 });
    
    if (beneficiaries.length > 0) {
      const kits = await prisma.kit.findMany({ take: 2 });
      
      for (let i = 0; i < beneficiaries.length; i++) {
        const beneficiary = beneficiaries[i];
        
        try {
          const request = await prisma.request.create({
            data: {
              code: `REQ-${String(i + 1).padStart(4, '0')}`,
              beneficiaryId: beneficiary.id,
              status: i === 0 ? 'APPROVED' : 'REGISTERED',
              priority: i + 1,
              createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            }
          });
          
          // Agregar productos a la solicitud
          const products = await prisma.product.findMany({ take: 3 });
          for (const product of products) {
            await prisma.requestProduct.create({
              data: {
                requestId: request.id,
                productId: product.id,
                quantityRequested: Math.floor(Math.random() * 10) + 1,
                quantityDelivered: 0
              }
            });
          }
          
          // Agregar kits a la solicitud
          for (const kit of kits) {
            await prisma.requestKit.create({
              data: {
                requestId: request.id,
                kitId: kit.id,
                quantityRequested: Math.floor(Math.random() * 5) + 1,
                quantityDelivered: 0
              }
            });
          }
          
        } catch (error) {
          console.log(`⚠️ Error creando solicitud para beneficiario ${beneficiary.id}: ${error.message}`);
        }
      }
    }
    
    // 3. Crear entregas de ejemplo
    console.log('🚚 Creando entregas de ejemplo...');
    const approvedRequests = await prisma.request.findMany({ 
      where: { status: 'APPROVED' },
      take: 2
    });
    
    for (const request of approvedRequests) {
      try {
        const delivery = await prisma.delivery.create({
          data: {
            code: `DEL-${request.code}`,
            requestId: request.id,
            status: 'PREPARING',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        });
        
        // Agregar detalles de entrega
        const requestProducts = await prisma.requestProduct.findMany({
          where: { requestId: request.id }
        });
        
        for (const rp of requestProducts) {
          await prisma.deliveryDetail.create({
            data: {
              deliveryId: delivery.id,
              productId: rp.productId,
              quantity: Math.floor(rp.quantityRequested * 0.8) // Entregar 80% de lo solicitado
            }
          });
        }
        
        const requestKits = await prisma.requestKit.findMany({
          where: { requestId: request.id }
        });
        
        for (const rk of requestKits) {
          await prisma.deliveryDetail.create({
            data: {
              deliveryId: delivery.id,
              kitId: rk.kitId,
              quantity: Math.floor(rk.quantityRequested * 0.8) // Entregar 80% de lo solicitado
            }
          });
        }
        
      } catch (error) {
        console.log(`⚠️ Error creando entrega para solicitud ${request.id}: ${error.message}`);
      }
    }
    
    // Reactivar claves foráneas
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    
    // Verificar datos creados
    const counts = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.productLot.count(),
      prisma.kit.count(),
      prisma.kitProduct.count(),
      prisma.stockMovement.count(),
      prisma.request.count(),
      prisma.delivery.count()
    ]);
    
    console.log('✅ Datos de prueba creados exitosamente:');
    console.log(`   Categorías: ${counts[0]}`);
    console.log(`   Productos: ${counts[1]}`);
    console.log(`   Lotes de productos: ${counts[2]}`);
    console.log(`   Kits: ${counts[3]}`);
    console.log(`   Productos por kit: ${counts[4]}`);
    console.log(`   Movimientos de stock: ${counts[5]}`);
    console.log(`   Solicitudes: ${counts[6]}`);
    console.log(`   Entregas: ${counts[7]}`);
    
    // Mostrar resumen de stock
    const totalProductStock = await prisma.productLot.aggregate({
      where: { isActive: true },
      _sum: { quantity: true }
    });
    
    console.log('\n📊 Resumen de inventario:');
    console.log(`   Stock total de productos: ${totalProductStock._sum.quantity || 0} unidades`);
    
    // Mostrar detalles de kits
    const allKits = await prisma.kit.findMany({ include: { kitProducts: { include: { product: true } } } });
    console.log('\n📦 Detalles de kits:');
    allKits.forEach(kit => {
      console.log(`   - ${kit.code}: ${kit.name}`);
      kit.kitProducts.forEach(kp => {
        console.log(`     * ${kp.product.name} (${kp.quantity} unidades)`);
      });
    });
    
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Email: admin@sigah.com');
    console.log('   Password: admin123');
    console.log('   URL: http://localhost:3000/sigah/');
    
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleInventory();
