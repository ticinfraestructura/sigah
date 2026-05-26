const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testKitEntry() {
  try {
    console.log('🧪 Probando sistema de integridad de kits...');

    // Obtener un kit
    const kit = await prisma.kit.findFirst({
      where: { code: 'KIT-ALI-001' },
      include: { inventory: true }
    });

    if (!kit) {
      console.log('❌ No se encontró el kit KIT-ALI-001');
      return;
    }

    console.log(`✅ Kit encontrado: ${kit.code} - ${kit.name}`);

    // Obtener un usuario
    const user = await prisma.user.findFirst({
      where: { email: 'admin@sigah.com' }
    });

    if (!user) {
      console.log('❌ No se encontró usuario admin');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.email}`);

    // Registrar movimiento de prueba
    await prisma.$transaction(async (tx) => {
      const kitInventory = await tx.kitInventory.upsert({
        where: { kitId: kit.id },
        update: { quantity: { increment: 5 } },
        create: { kitId: kit.id, quantity: 5 }
      });

      await tx.kitInventoryMovement.create({
        data: {
          kitInventoryId: kitInventory.id,
          type: 'ENTRY',
          quantity: 5,
          lotNumber: 'TEST-001',
          expiryDate: new Date('2025-12-31'),
          reason: 'Prueba de sistema de integridad',
          reference: `KIT_ENTRY:${kit.code}:${Date.now()}`,
          userId: user.id
        }
      });
    });

    console.log('✅ Movimiento de prueba registrado exitosamente');

    // Verificar el movimiento
    const movements = await prisma.kitInventoryMovement.findMany({
      where: { type: 'ENTRY' },
      include: {
        kitInventory: { include: { kit: true } },
        user: { select: { firstName: true, lastName: true } }
      }
    });

    console.log(`📊 Total de movimientos de entrada: ${movements.length}`);
    if (movements.length > 0) {
      console.log('📋 Último movimiento:');
      const last = movements[0];
      console.log(`   - Kit: ${last.kitInventory.kit.code}`);
      console.log(`   - Cantidad: ${last.quantity}`);
      console.log(`   - Usuario: ${last.user.firstName} ${last.user.lastName}`);
      console.log(`   - Fecha: ${last.createdAt}`);
    }

    // Verificar inventario
    const inventory = await prisma.kitInventory.findMany({
      include: { kit: true }
    });

    console.log(`📦 Inventario de kits: ${inventory.length} registros`);
    inventory.forEach(inv => {
      console.log(`   - ${inv.kit.code}: ${inv.quantity} unidades`);
    });

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testKitEntry();
