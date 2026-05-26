const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickSeed() {
  try {
    console.log('🌱 Seed rápido de kits...');

    // Crear productos necesarios
    const products = await prisma.product.findMany();
    if (products.length === 0) {
      console.log('❌ No hay productos en la base de datos');
      return;
    }

    console.log(`✅ ${products.length} productos encontrados`);

    // Crear kit de prueba
    const kit = await prisma.kit.create({
      data: {
        code: 'KIT-ALI-001',
        name: 'Kit de Alimentos Básico',
        type: 'ALIMENTOS',
        description: 'Kit de prueba',
        kitProducts: {
          create: [
            { productId: products[0].id, quantity: 2 },
            { productId: products[1].id, quantity: 1 }
          ]
        }
      }
    });

    console.log(`✅ Kit creado: ${kit.code}`);

    // Crear inventario del kit
    await prisma.kitInventory.create({
      data: {
        kitId: kit.id,
        quantity: 0
      }
    });

    console.log('✅ Inventario de kit creado');
    console.log('🎉 Seed completado');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickSeed();
