const { PrismaClient } = require('@prisma/client');

async function checkKitStock() {
  try {
    // Conectar usando la base de datos SQLite directa
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      }
    });

    console.log('🔍 Verificando kits con stock disponible...');

    // Primero verificar qué tablas existen
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('📋 Tablas en la base de datos:');
    tables.forEach(table => console.log(`  - ${table.name}`));

    // Buscar tablas relacionadas con kits
    const kitTables = tables.filter(table => table.name.includes('kit'));
    console.log('\n📦 Tablas relacionadas con kits:');
    kitTables.forEach(table => console.log(`  - ${table.name}`));

    // Intentar diferentes formas de obtener el inventario de kits
    let kitsWithInventory = [];
    
    try {
      // Intento 1: Usar KitInventory (si existe)
      kitsWithInventory = await prisma.kitInventory.findMany({
        where: { quantity: { gt: 0 } },
        include: { kit: true },
        orderBy: { quantity: 'desc' }
      });
    } catch (error) {
      console.log('❌ KitInventory no existe, probando otras opciones...');
      
      try {
        // Intento 2: Usar query raw con snake_case
        kitsWithInventory = await prisma.$queryRaw`
          SELECT 
            k.id,
            k.code,
            k.name,
            ki.quantity as available_quantity
          FROM kits k
          LEFT JOIN kit_inventories ki ON k.id = ki.kit_id
          WHERE ki.quantity > 0
          ORDER BY ki.quantity DESC
        `;
      } catch (error2) {
        console.log('❌ kit_inventories no existe, probando otra opción...');
        
        try {
          // Intento 3: Usar KitInventoryMovement
          const movements = await prisma.kitInventoryMovement.findMany({
            where: { type: 'ENTRY' },
            include: { kitInventory: { include: { kit: true } } }
          });
          
          // Agrupar por kit para calcular stock actual
          const stockByKit = {};
          movements.forEach(movement => {
            const kitId = movement.kitInventory?.kit?.id;
            if (kitId) {
              stockByKit[kitId] = (stockByKit[kitId] || 0) + movement.quantity;
            }
          });
          
          kitsWithInventory = await prisma.kit.findMany({
            where: { 
              id: { in: Object.keys(stockByKit) },
              isActive: true
            },
            select: {
              id: true,
              code: true,
              name: true
            }
          }).map(kit => ({
            ...kit,
            available_quantity: stockByKit[kit.id] || 0
          }));
          
        } catch (error3) {
          console.log('❌ Ninguna tabla de inventario de kits encontrada');
        }
      }
    }

    console.log('\n📦 KITS CON STOCK DISPONIBLE:');
    console.log('================================');
    
    if (kitsWithInventory.length === 0) {
      console.log('❌ No se encontraron kits con stock disponible');
    } else {
      kitsWithInventory.forEach((kit, index) => {
        console.log(`${index + 1}. ${kit.code} - ${kit.name} (${kit.available_quantity} disponibles)`);
      });
    }

    console.log(`\n📊 Total de kits con stock: ${kitsWithInventory.length}`);

    // También verificar todos los kits
    const allKits = await prisma.kit.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n📋 TODOS LOS KITS EN EL SISTEMA:');
    console.log('================================');
    allKits.forEach((kit, index) => {
      const hasStock = kitsWithInventory.find(k => k.id === kit.id);
      console.log(`${index + 1}. ${kit.code} - ${kit.name} - ${kit.isActive ? 'Activo' : 'Inactivo'} - Stock: ${hasStock ? hasStock.available_quantity : 0}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkKitStock();
