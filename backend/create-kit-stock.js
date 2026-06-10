const { PrismaClient } = require('@prisma/client');

async function createKitStock() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      }
    });

    console.log('🔧 Creando stock de prueba para kits...');

    // Obtener todos los kits activos
    const kits = await prisma.kit.findMany({
      where: { isActive: true },
      include: {
        kitProducts: {
          include: { product: true }
        }
      }
    });

    console.log(`📦 Encontrados ${kits.length} kits activos`);

    // Crear una tabla temporal para kit_inventory si no existe
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS kit_inventory (
          id TEXT PRIMARY KEY,
          kit_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (kit_id) REFERENCES kits(id)
        )
      `;
      console.log('✅ Tabla kit_inventory creada/verificada');
    } catch (error) {
      console.log('⚠️ La tabla ya existe o hubo un error:', error.message);
    }

    // Crear stock para cada kit
    for (const kit of kits) {
      const stockQuantity = Math.floor(Math.random() * 20) + 5; // 5-25 unidades
      
      try {
        // Insertar o actualizar el inventario del kit
        await prisma.$executeRaw`
          INSERT OR REPLACE INTO kit_inventory (id, kit_id, quantity, updated_at)
          VALUES (${kit.id}, ${kit.id}, ${stockQuantity}, CURRENT_TIMESTAMP)
        `;
        
        console.log(`✅ ${kit.code} - ${kit.name}: ${stockQuantity} unidades creadas`);
      } catch (error) {
        console.log(`❌ Error creando stock para ${kit.code}:`, error.message);
      }
    }

    // Verificar el stock creado
    const stockVerification = await prisma.$queryRaw`
      SELECT 
        k.code,
        k.name,
        ki.quantity
      FROM kits k
      JOIN kit_inventory ki ON k.id = ki.kit_id
      WHERE k.isActive = true
      ORDER BY ki.quantity DESC
    `;

    console.log('\n📊 Stock creado exitosamente:');
    console.log('================================');
    stockVerification.forEach((kit, index) => {
      console.log(`${index + 1}. ${kit.code} - ${kit.name} (${kit.quantity} disponibles)`);
    });

    await prisma.$disconnect();
    console.log('\n🎉 ¡Stock de kits creado exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createKitStock();
