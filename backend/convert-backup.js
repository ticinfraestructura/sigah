const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

// Configurar SQLite temporalmente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function convertBackup() {
  try {
    console.log('🔄 Convirtiendo backup de PostgreSQL a SQLite...');
    
    // Leer el backup de PostgreSQL
    const sqlContent = fs.readFileSync('./restore.sql', 'utf8');
    
    // Extraer datos de las tablas principales
    const tables = [
      'categories',
      'products', 
      'product_lots',
      'kits',
      'kit_products',
      'beneficiaries',
      'users',
      'roles',
      'role_permissions',
      'requests',
      'request_products',
      'request_kits',
      'deliveries',
      'delivery_details',
      'stock_movements'
    ];
    
    console.log('📊 Creando estructura básica...');
    
    // Primero crear la estructura con Prisma
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    
    // Procesar cada tabla
    for (const tableName of tables) {
      console.log(`📦 Procesando tabla: ${tableName}`);
      
      // Extraer datos del COPY
      const copyRegex = new RegExp(`COPY public\\.${tableName}.*?FROM stdin;([\\s\\S]*?)\\\\\\.`, 'g');
      const match = copyRegex.exec(sqlContent);
      
      if (match && match[1]) {
        const dataLines = match[1].trim().split('\n').filter(line => line.trim());
        
        if (dataLines.length > 0) {
          console.log(`   Encontrados ${dataLines.length} registros`);
          
          // Insertar datos según la tabla
          for (const line of dataLines) {
            const fields = line.split('\t');
            
            try {
              switch (tableName) {
                case 'categories':
                  if (fields.length >= 4) {
                    await prisma.$executeRaw`
                      INSERT OR IGNORE INTO categories (id, name, description, isActive, createdAt, updatedAt)
                      VALUES (${fields[0]}, ${fields[1]}, ${fields[2] || null}, ${fields[3] === 't'}, datetime('now'), datetime('now'))
                    `;
                  }
                  break;
                  
                case 'products':
                  if (fields.length >= 9) {
                    await prisma.$executeRaw`
                      INSERT OR IGNORE INTO products (id, code, name, description, categoryId, unit, isPerishable, minStock, isActive, createdAt, updatedAt)
                      VALUES (${fields[0]}, ${fields[1]}, ${fields[2]}, ${fields[3] || null}, ${fields[4]}, ${fields[5]}, ${fields[6] === 't'}, ${fields[7]}, ${fields[8] === 't'}, datetime('now'), datetime('now'))
                    `;
                  }
                  break;
                  
                case 'beneficiaries':
                  if (fields.length >= 12) {
                    await prisma.$executeRaw`
                      INSERT OR IGNORE INTO beneficiaries (id, documentType, documentNumber, firstName, lastName, phone, email, address, city, populationType, familySize, notes, isActive, createdAt, updatedAt)
                      VALUES (${fields[0]}, ${fields[1]}, ${fields[2]}, ${fields[3]}, ${fields[4]}, ${fields[5] || null}, ${fields[6] || null}, ${fields[7] || null}, ${fields[8] || null}, ${fields[9] || null}, ${fields[10]}, ${fields[11] || null}, ${fields[12] === 't'}, datetime('now'), datetime('now'))
                    `;
                  }
                  break;
                  
                case 'users':
                  if (fields.length >= 6) {
                    await prisma.$executeRaw`
                      INSERT OR IGNORE INTO users (id, email, password, firstName, lastName, isActive, createdAt, updatedAt)
                      VALUES (${fields[0]}, ${fields[1]}, ${fields[2]}, ${fields[3]}, ${fields[4]}, ${fields[5] === 't'}, datetime('now'), datetime('now'))
                    `;
                  }
                  break;
                  
                // Agregar más tablas según sea necesario
              }
            } catch (err) {
              console.log(`   ⚠️ Error insertando registro: ${err.message}`);
            }
          }
        }
      }
    }
    
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    
    console.log('✅ Conversión completada');
    
    // Verificar datos
    const counts = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.beneficiary.count(),
      prisma.user.count()
    ]);
    
    console.log('📊 Resumen de datos restaurados:');
    console.log(`   Categorías: ${counts[0]}`);
    console.log(`   Productos: ${counts[1]}`);
    console.log(`   Beneficiarios: ${counts[2]}`);
    console.log(`   Usuarios: ${counts[3]}`);
    
  } catch (error) {
    console.error('❌ Error en conversión:', error);
  } finally {
    await prisma.$disconnect();
  }
}

convertBackup();
