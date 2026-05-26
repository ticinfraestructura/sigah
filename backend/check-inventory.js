const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInventory() {
  try {
    console.log('📊 Estado del inventario de kits...\n');

    const inventory = await prisma.kitInventory.findMany({
      include: { kit: true }
    });

    console.log('📦 Inventario de kits:');
    inventory.forEach(inv => {
      console.log(`   - ${inv.kit.code} (${inv.kit.name}): ${inv.quantity} unidades`);
    });

    console.log('\n📋 Movimientos de entrada:');
    const movements = await prisma.kitInventoryMovement.findMany({
      where: { type: 'ENTRY' },
      include: {
        kitInventory: { include: { kit: true } },
        user: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    movements.forEach(m => {
      console.log(`   - ${m.kitInventory.kit.code}: ${m.quantity} unidades - ${m.user.firstName} ${m.user.lastName}`);
    });

    console.log(`\n✅ Total movimientos: ${movements.length}`);
    console.log(`✅ Total inventario: ${inventory.reduce((sum, inv) => sum + inv.quantity, 0)} unidades`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInventory();
