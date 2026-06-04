const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function checkTables() {
  try {
    console.log('🔍 Verificando tablas disponibles en SQLite...');
    
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`;
    
    console.log('📋 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });
    
    // Verificar qué modelos están disponibles
    const models = [
      'category', 'product', 'productLot', 'kit', 'kitProduct',
      'beneficiary', 'user', 'stockMovement', 'request'
    ];
    
    console.log('\n🔍 Verificando modelos disponibles:');
    for (const model of models) {
      try {
        const count = await prisma[model].count();
        console.log(`   ✅ ${model}: ${count} registros`);
      } catch (error) {
        console.log(`   ❌ ${model}: No disponible`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
