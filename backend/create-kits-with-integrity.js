const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createKitsWithIntegrity() {
  try {
    console.log('🎯 Creando kits con sistema de integridad...');

    // Obtener IDs de productos
    const products = await prisma.product.findMany();
    const productMap = {};
    products.forEach(p => productMap[p.code] = p.id);

    // Kit de Alimentos
    console.log('📦 Creando Kit de Alimentos...');
    const kitAlimentos = await prisma.kit.create({
      data: {
        code: 'KIT-ALI-001',
        name: 'Kit de Alimentos Básico',
        type: 'ALIMENTOS',
        description: 'Kit con alimentos básicos para emergencias',
        kitProducts: {
          create: [
            { productId: productMap['ALI-001'], quantity: 2 },
            { productId: productMap['ALI-002'], quantity: 2 },
            { productId: productMap['ALI-003'], quantity: 1 },
            { productId: productMap['ALI-004'], quantity: 2 },
            { productId: productMap['ALI-005'], quantity: 3 }
          ]
        }
      }
    });

    await prisma.kitInventory.create({
      data: { kitId: kitAlimentos.id, quantity: 0 }
    });
    console.log('✅ Kit de Alimentos creado con inventario:', kitAlimentos.code);

    // Kit de Emergencia
    console.log('📦 Creando Kit de Emergencia...');
    const kitEmergencia = await prisma.kit.create({
      data: {
        code: 'KIT-EME-001',
        name: 'Kit de Emergencia',
        type: 'EMERGENCIA',
        description: 'Kit de emergencia con artículos esenciales',
        kitProducts: {
          create: [
            { productId: productMap['EME-001'], quantity: 1 },
            { productId: productMap['EME-002'], quantity: 1 },
            { productId: productMap['EME-003'], quantity: 1 },
            { productId: productMap['ALI-001'], quantity: 1 },
            { productId: productMap['ALI-003'], quantity: 1 }
          ]
        }
      }
    });

    await prisma.kitInventory.create({
      data: { kitId: kitEmergencia.id, quantity: 0 }
    });
    console.log('✅ Kit de Emergencia creado con inventario:', kitEmergencia.code);

    // Kit de Aseo
    console.log('📦 Creando Kit de Aseo...');
    const kitAseo = await prisma.kit.create({
      data: {
        code: 'KIT-HIG-001',
        name: 'Kit de Aseo Personal',
        type: 'HIGIENE',
        description: 'Kit de aseo personal básico',
        kitProducts: {
          create: [
            { productId: productMap['ASE-001'], quantity: 2 },
            { productId: productMap['ASE-002'], quantity: 1 },
            { productId: productMap['ASE-003'], quantity: 1 },
            { productId: productMap['ASE-004'], quantity: 2 },
            { productId: productMap['HOG-002'], quantity: 1 }
          ]
        }
      }
    });

    await prisma.kitInventory.create({
      data: { kitId: kitAseo.id, quantity: 0 }
    });
    console.log('✅ Kit de Aseo creado con inventario:', kitAseo.code);

    console.log('🎉 Todos los kits creados con sistema de integridad');
  } catch (error) {
    console.error('❌ Error creando kits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createKitsWithIntegrity();
