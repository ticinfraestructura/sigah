/**
 * Script de Importación de Datos a PostgreSQL
 * 
 * Uso: npx tsx scripts/import-to-postgres.ts
 * 
 * Ejecutar después de migrate-to-postgres.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

async function main() {
  console.log('\n========================================');
  console.log('  SIGAH - Importación a PostgreSQL');
  console.log('========================================\n');

  const importDataPath = path.join(process.cwd(), 'backups', 'import-data.json');
  
  if (!fs.existsSync(importDataPath)) {
    log.error('No se encontró import-data.json');
    log.info('Ejecute primero: npx tsx scripts/migrate-to-postgres.ts');
    process.exit(1);
  }

  log.info('Cargando datos...');
  const data = JSON.parse(fs.readFileSync(importDataPath, 'utf-8'));

  log.info('Conectando a PostgreSQL...');
  const prisma = new PrismaClient();

  try {
    // Orden de importación (respetando foreign keys)
    const importOrder = [
      { name: 'roles', data: data.roles, model: prisma.role },
      { name: 'permissions', data: data.permissions, model: prisma.permission },
      { name: 'users', data: data.users, model: prisma.user },
      { name: 'rolePermissions', data: data.rolePermissions, model: prisma.rolePermission },
      { name: 'categories', data: data.categories, model: prisma.category },
      { name: 'products', data: data.products, model: prisma.product },
      { name: 'productLots', data: data.productLots, model: prisma.productLot },
      { name: 'kits', data: data.kits, model: prisma.kit },
      { name: 'kitProducts', data: data.kitProducts, model: prisma.kitProduct },
      { name: 'beneficiaries', data: data.beneficiaries, model: prisma.beneficiary },
      { name: 'requests', data: data.requests, model: prisma.request },
      { name: 'requestProducts', data: data.requestProducts, model: prisma.requestProduct },
      { name: 'requestKits', data: data.requestKits, model: prisma.requestKit },
      { name: 'requestHistories', data: data.requestHistories, model: prisma.requestHistory },
      { name: 'deliveries', data: data.deliveries, model: prisma.delivery },
      { name: 'deliveryDetails', data: data.deliveryDetails, model: prisma.deliveryDetail },
      { name: 'deliveryHistories', data: data.deliveryHistories, model: prisma.deliveryHistory },
      { name: 'stockMovements', data: data.stockMovements, model: prisma.stockMovement },
      { name: 'returns', data: data.returns, model: prisma.return },
      { name: 'returnDetails', data: data.returnDetails, model: prisma.returnDetail },
      { name: 'notifications', data: data.notifications, model: prisma.notification },
      { name: 'auditLogs', data: data.auditLogs, model: prisma.auditLog }
    ];

    for (const { name, data: records, model } of importOrder) {
      if (!records || records.length === 0) {
        log.warn(`${name}: sin datos`);
        continue;
      }

      log.info(`Importando ${name}...`);
      
      let imported = 0;
      let errors = 0;

      for (const record of records) {
        try {
          // Convertir fechas de string a Date
          const processedRecord = { ...record };
          for (const [key, value] of Object.entries(processedRecord)) {
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
              processedRecord[key] = new Date(value);
            }
          }

          await (model as any).create({ data: processedRecord });
          imported++;
        } catch (error: any) {
          // Ignorar duplicados
          if (error.code === 'P2002') {
            log.warn(`  Duplicado ignorado en ${name}`);
          } else {
            errors++;
            log.error(`  Error en ${name}: ${error.message}`);
          }
        }
      }

      log.success(`${name}: ${imported}/${records.length} importados${errors > 0 ? `, ${errors} errores` : ''}`);
    }

    console.log('\n========================================');
    console.log('  Importación Completada');
    console.log('========================================');
    console.log('\nVerificación:');
    
    // Verificar conteos
    const counts = {
      users: await prisma.user.count(),
      roles: await prisma.role.count(),
      products: await prisma.product.count(),
      beneficiaries: await prisma.beneficiary.count(),
      requests: await prisma.request.count()
    };

    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count} registros`);
    });

    console.log('\n✅ Migración a PostgreSQL completada exitosamente!\n');

  } catch (error) {
    log.error(`Error durante la importación: ${error}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
