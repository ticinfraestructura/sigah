const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function createInventoryTestData() {
  try {
    console.log('🔧 Creando datos de prueba completos para inventario...');
    
    // Desactivar claves foráneas temporalmente
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    
    // 1. Crear más categorías
    console.log('📂 Creando categorías adicionales...');
    const additionalCategories = [
      { id: 'cat-bebidas', name: 'Bebidas', description: 'Bebidas y líquidos', isActive: true },
      { id: 'cat-limpieza', name: 'Limpieza', description: 'Productos de limpieza del hogar', isActive: true },
      { id: 'cat-ropa', name: 'Ropa', description: 'Prendas de vestir y textiles', isActive: true },
      { id: 'cat-utensilios', name: 'Utensilios', description: 'Utensilios de cocina y hogar', isActive: true }
    ];
    
    for (const cat of additionalCategories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: cat,
        create: cat
      });
    }
    
    // 2. Crear más productos
    console.log('📦 Creando productos adicionales...');
    const additionalProducts = [
      // Bebidas
      { code: 'BEB-001', name: 'Agua purificada', description: 'Agua embotellada 1L', categoryId: 'cat-bebidas', unit: 'UNIDAD', isPerishable: true, minStock: 200 },
      { code: 'BEB-002', name: 'Jugo de naranja', description: 'Jugo en polvo', categoryId: 'cat-bebidas', unit: 'PACK', isPerishable: true, minStock: 100 },
      { code: 'BEB-003', name: 'Leche líquida', description: 'Leche UHT 1L', categoryId: 'cat-bebidas', unit: 'UNIDAD', isPerishable: true, minStock: 150 },
      
      // Limpieza
      { code: 'LIM-001', name: 'Cloro', description: 'Cloro líquido 1L', categoryId: 'cat-limpieza', unit: 'UNIDAD', isPerishable: false, minStock: 80 },
      { code: 'LIM-002', name: 'Detergente', description: 'Detergente en polvo 500g', categoryId: 'cat-limpieza', unit: 'PACK', isPerishable: false, minStock: 120 },
      { code: 'LIM-003', name: 'Escoba', description: 'Escoba de cerda', categoryId: 'cat-limpieza', unit: 'UNIDAD', isPerishable: false, minStock: 50 },
      { code: 'LIM-004', name: 'Trapeador', description: 'Trapeador con mango', categoryId: 'cat-limpieza', unit: 'UNIDAD', isPerishable: false, minStock: 40 },
      
      // Ropa
      { code: 'ROP-001', name: 'Camisetas', description: 'Camisetas algodón talla M', categoryId: 'cat-ropa', unit: 'UNIDAD', isPerishable: false, minStock: 100 },
      { code: 'ROP-002', name: 'Pantalones', description: 'Pantalones mezclilla talla 32', categoryId: 'cat-ropa', unit: 'UNIDAD', isPerishable: false, minStock: 80 },
      { code: 'ROP-003', name: 'Sudaderas', description: 'Sudaderas unisex talla L', categoryId: 'cat-ropa', unit: 'UNIDAD', isPerishable: false, minStock: 60 },
      
      // Utensilios
      { code: 'UTI-001', name: 'Platos', description: 'Juego de platos 6 pzs', categoryId: 'cat-utensilios', unit: 'SET', isPerishable: false, minStock: 40 },
      { code: 'UTI-002', name: 'Cucharas', description: 'Juego de cucharas 6 pzs', categoryId: 'cat-utensilios', unit: 'SET', isPerishable: false, minStock: 40 },
      { code: 'UTI-003', name: 'Ollas', description: 'Olla de aluminio 3L', categoryId: 'cat-utensilios', unit: 'UNIDAD', isPerishable: false, minStock: 30 },
      { code: 'UTI-004', name: 'Cuchillos', description: 'Juego de cuchillos 3 pzs', categoryId: 'cat-utensilios', unit: 'SET', isPerishable: false, minStock: 35 }
    ];
    
    for (const prod of additionalProducts) {
      await prisma.product.upsert({
        where: { code: prod.code },
        update: prod,
        create: prod
      });
    }
    
    // 3. Crear lotes de productos con stock
    console.log('📦 Creando lotes de productos con stock...');
    const products = await prisma.product.findMany();
    
    for (const product of products) {
      // Crear 1-3 lotes por producto
      const numLots = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numLots; i++) {
        const lotNumber = `LOT-${product.code}-${String(i + 1).padStart(3, '0')}`;
        const quantity = Math.floor(Math.random() * 200) + 50; // 50-250 unidades
        const daysToAdd = Math.floor(Math.random() * 180) + 30; // 30-210 días para vencimiento
        const expiryDate = product.isPerishable ? new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000) : null;
        
        // Verificar si el lote ya existe
        const existingLot = await prisma.productLot.findFirst({
          where: {
            productId: product.id,
            lotNumber: lotNumber
          }
        });
        
        if (!existingLot) {
          await prisma.productLot.create({
            data: {
              productId: product.id,
              lotNumber: lotNumber,
              quantity: quantity,
              expiryDate: expiryDate,
              isActive: true
            }
          });
        } else {
          await prisma.productLot.update({
            where: { id: existingLot.id },
            data: { quantity, expiryDate, isActive: true }
          });
        }
      }
    }
    
    // 4. Crear kits más completos
    console.log('📦 Creando kits completos...');
    const allProducts = await prisma.product.findMany();
    
    const completeKits = [
      {
        code: 'KIT-FAMILIA-001',
        name: 'Kit Familiar Completo',
        description: 'Kit completo para familia de 4-5 personas',
        products: [
          { code: 'ALI-001', quantity: 5 }, // Arroz 5kg
          { code: 'ALI-002', quantity: 3 }, // Frijoles 3kg
          { code: 'ALI-003', quantity: 2 }, // Aceite 2L
          { code: 'BEB-001', quantity: 10 }, // Agua 10L
          { code: 'HIG-001', quantity: 5 }, // Jabón 5 unidades
          { code: 'HIG-002', quantity: 3 }, // Pasta dental 3 unidades
          { code: 'LIM-001', quantity: 2 }, // Cloro 2L
          { code: 'UTI-001', quantity: 1 }  // Platos 1 juego
        ]
      },
      {
        code: 'KIT-BEBE-001',
        name: 'Kit de Bebé',
        description: 'Kit especial para bebés',
        products: [
          { code: 'HIG-003', quantity: 20 }, // Pañales 20 unidades
          { code: 'ALI-004', quantity: 2 }, // Leche en polvo 2 packs
          { code: 'BEB-003', quantity: 5 }, // Leche líquida 5L
          { code: 'ROP-001', quantity: 3 }, // Camisetas 3 unidades
          { code: 'UTI-002', quantity: 1 }  // Cucharas 1 juego
        ]
      },
      {
        code: 'KIT-EMERGENCIA-001',
        name: 'Kit de Emergencia Avanzado',
        description: 'Kit completo para situaciones de emergencia',
        products: [
          { code: 'ALI-001', quantity: 10 }, // Arroz 10kg
          { code: 'ALI-002', quantity: 5 }, // Frijoles 5kg
          { code: 'BEB-001', quantity: 20 }, // Agua 20L
          { code: 'EME-001', quantity: 2 }, // Linterna 2 unidades
          { code: 'LIM-001', quantity: 3 }, // Cloro 3L
          { code: 'HIG-001', quantity: 10 }, // Jabón 10 unidades
          { code: 'UTI-001', quantity: 2 }, // Platos 2 juegos
          { code: 'UTI-002', quantity: 2 }  // Cucharas 2 juegos
        ]
      },
      {
        code: 'KIT-LIMPIEZA-001',
        name: 'Kit de Limpieza del Hogar',
        description: 'Kit completo para limpieza',
        products: [
          { code: 'LIM-001', quantity: 3 }, // Cloro 3L
          { code: 'LIM-002', quantity: 2 }, // Detergente 2 packs
          { code: 'LIM-003', quantity: 1 }, // Escoba 1 unidad
          { code: 'LIM-004', quantity: 1 }, // Trapeador 1 unidad
          { code: 'HIG-001', quantity: 5 }  // Jabón 5 unidades
        ]
      },
      {
        code: 'KIT-COCINA-001',
        name: 'Kit de Cocina Básico',
        description: 'Utensilios básicos para cocinar',
        products: [
          { code: 'UTI-001', quantity: 2 }, // Platos 2 juegos
          { code: 'UTI-002', quantity: 2 }, // Cucharas 2 juegos
          { code: 'UTI-003', quantity: 1 }, // Olla 1 unidad
          { code: 'UTI-004', quantity: 1 }, // Cuchillos 1 juego
          { code: 'ALI-001', quantity: 2 }  // Arroz 2kg
        ]
      }
    ];
    
    for (const kitData of completeKits) {
      // Crear el kit
      const kit = await prisma.kit.upsert({
        where: { code: kitData.code },
        update: { name: kitData.name, description: kitData.description },
        create: {
          code: kitData.code,
          name: kitData.name,
          description: kitData.description
        }
      });
      
      // Agregar productos al kit
      for (const productData of kitData.products) {
        const product = allProducts.find(p => p.code === productData.code);
        if (product) {
          // Crear directamente sin upsert para evitar problemas
        const existingKitProduct = await prisma.kitProduct.findFirst({
          where: {
            kitId: kit.id,
            productId: product.id
          }
        });
        
        if (!existingKitProduct) {
          await prisma.kitProduct.create({
            data: {
              kitId: kit.id,
              productId: product.id,
              quantity: productData.quantity
            }
          });
        } else {
          await prisma.kitProduct.update({
            where: { id: existingKitProduct.id },
            data: { quantity: productData.quantity }
          });
        }
        }
      }
      
      // Crear inventario del kit con stock
      const kitStock = Math.floor(Math.random() * 20) + 5; // 5-25 kits
      const existingKitInventory = await prisma.kitInventory.findFirst({
        where: { kitId: kit.id }
      });
      
      if (!existingKitInventory) {
        await prisma.kitInventory.create({
          data: {
            kitId: kit.id,
            quantity: kitStock
          }
        });
      } else {
        await prisma.kitInventory.update({
          where: { id: existingKitInventory.id },
          data: { quantity: kitStock }
        });
      }
    }
    
    // 5. Crear movimientos de stock
    console.log('📋 Creando movimientos de stock...');
    const allLots = await prisma.productLot.findMany({ where: { isActive: true } });
    
    for (let i = 0; i < 50; i++) {
      const lot = allLots[Math.floor(Math.random() * allLots.length)];
      const movementTypes = ['ENTRY', 'EXIT', 'ADJUSTMENT'];
      const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      const quantity = Math.floor(Math.random() * 50) + 1;
      
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
    
    // 6. Crear movimientos de kits
    console.log('📦 Creando movimientos de kits...');
    const kitInventories = await prisma.kitInventory.findMany();
    
    for (let i = 0; i < 20; i++) {
      const kitInv = kitInventories[Math.floor(Math.random() * kitInventories.length)];
      const movementTypes = ['ENTRY', 'EXIT'];
      const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;
      
      const reasons = {
        'ENTRY': ['Armado de kit', 'Donación recibida', 'Reabastecimiento'],
        'EXIT': ['Despacho', 'Donación entregada', 'Entrega a beneficiario']
      };
      
      const reason = reasons[movementType][Math.floor(Math.random() * reasons[movementType].length)];
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      await prisma.kitInventoryMovement.create({
        data: {
          kitInventoryId: kitInv.id,
          type: movementType,
          quantity: movementType === 'EXIT' ? -quantity : quantity,
          reason: reason,
          userId: 'test-admin-id',
          createdAt: createdAt
        }
      });
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
      prisma.kitInventory.count(),
      prisma.stockMovement.count(),
      prisma.kitInventoryMovement.count()
    ]);
    
    console.log('✅ Datos de prueba de inventario creados exitosamente:');
    console.log(`   Categorías: ${counts[0]}`);
    console.log(`   Productos: ${counts[1]}`);
    console.log(`   Lotes de productos: ${counts[2]}`);
    console.log(`   Kits: ${counts[3]}`);
    console.log(`   Productos por kit: ${counts[4]}`);
    console.log(`   Inventario de kits: ${counts[5]}`);
    console.log(`   Movimientos de stock: ${counts[6]}`);
    console.log(`   Movimientos de kits: ${counts[7]}`);
    
    // Mostrar resumen de stock
    const totalProductStock = await prisma.productLot.aggregate({
      where: { isActive: true },
      _sum: { quantity: true }
    });
    
    const totalKitStock = await prisma.kitInventory.aggregate({
      _sum: { quantity: true }
    });
    
    console.log('\n📊 Resumen de inventario:');
    console.log(`   Stock total de productos: ${totalProductStock._sum.quantity || 0} unidades`);
    console.log(`   Stock total de kits: ${totalKitStock._sum.quantity || 0} kits`);
    
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

createInventoryTestData();
