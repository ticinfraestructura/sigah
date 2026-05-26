const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixKitInventory() {
  try {
    console.log('🔧 Verificando kits sin inventario...');

    // Obtener todos los kits
    const kits = await prisma.kit.findMany();
    console.log(`📦 Total de kits: ${kits.length}`);

    let fixedCount = 0;

    for (const kit of kits) {
      // Verificar si tiene kitInventory
      const kitInventory = await prisma.kitInventory.findUnique({
        where: { kitId: kit.id }
      });

      if (!kitInventory) {
        console.log(`⚠️  Kit sin inventario: ${kit.code} - ${kit.name}`);
        
        // Crear kitInventory con stock 0
        await prisma.kitInventory.create({
          data: {
            kitId: kit.id,
            quantity: 0
          }
        });
        
        console.log(`✅ Creado inventario para: ${kit.code}`);
        fixedCount++;
      } else {
        console.log(`✓ Kit con inventario: ${kit.code} (stock: ${kitInventory.quantity})`);
      }
    }

    console.log(`\n🎉 Total de kits arreglados: ${fixedCount}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixKitInventory();
