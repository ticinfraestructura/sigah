const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEndpoint() {
  try {
    console.log('🧪 Probando lógica del endpoint /kit-entry...');

    // Obtener un kit
    const kit = await prisma.kit.findFirst({
      where: { code: 'KIT-HIG-001' },
      include: { kitProducts: true, inventory: true }
    });

    if (!kit) {
      console.log('❌ No se encontró el kit KIT-HIG-001');
      return;
    }

    console.log(`✅ Kit encontrado: ${kit.code} - ${kit.name}`);
    console.log(`   - Productos: ${kit.kitProducts.length}`);
    console.log(`   - Inventario: ${kit.inventory?.quantity || 0}`);

    // Obtener un usuario
    const user = await prisma.user.findFirst({
      where: { email: 'admin@sigah.com' }
    });

    if (!user) {
      console.log('❌ No se encontró usuario admin');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.email}`);

    // Simular la lógica del endpoint
    const quantity = 10;
    const lotNumber = 'TEST-002';
    const expiryDate = new Date('2025-12-31');
    const reason = 'Prueba manual';
    const reference = `KIT_ENTRY:${kit.code}:${Date.now()}`;

    console.log('🔄 Ejecutando transacción...');

    await prisma.$transaction(async (tx) => {
      const kitInventory = await tx.kitInventory.upsert({
        where: { kitId: kit.id },
        update: { quantity: { increment: quantity } },
        create: { kitId: kit.id, quantity: quantity }
      });

      await tx.kitInventoryMovement.create({
        data: {
          kitInventoryId: kitInventory.id,
          type: 'ENTRY',
          quantity: quantity,
          lotNumber: lotNumber,
          expiryDate: expiryDate,
          reason: reason,
          reference: reference,
          userId: user.id
        }
      });
    });

    console.log('✅ Transacción completada exitosamente');

    // Verificar resultado
    const movements = await prisma.kitInventoryMovement.findMany({
      where: { type: 'ENTRY' },
      include: { kitInventory: { include: { kit: true } } }
    });

    console.log(`📊 Total movimientos: ${movements.length}`);
    const last = movements[0];
    console.log(`📋 Último movimiento:`);
    console.log(`   - Kit: ${last.kitInventory.kit.code}`);
    console.log(`   - Cantidad: ${last.quantity}`);
    console.log(`   - Referencia: ${last.reference}`);

    const inventory = await prisma.kitInventory.findFirst({
      where: { kitId: kit.id }
    });

    console.log(`📦 Inventario del kit: ${inventory?.quantity || 0} unidades`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpoint();
