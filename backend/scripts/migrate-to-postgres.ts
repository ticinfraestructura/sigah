/**
 * Script de Migración SQLite -> PostgreSQL
 * 
 * Uso: npx tsx scripts/migrate-to-postgres.ts
 * 
 * Requisitos:
 * 1. PostgreSQL instalado y corriendo
 * 2. Base de datos creada
 * 3. Variables de entorno configuradas
 */

import { PrismaClient as SQLiteClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colores para consola
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
  console.log('  SIGAH - Migración a PostgreSQL');
  console.log('========================================\n');

  // Verificar variables de entorno
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    log.error('POSTGRES_URL no está configurada');
    log.info('Ejemplo: POSTGRES_URL="postgresql://user:password@localhost:5432/sigah"');
    process.exit(1);
  }

  log.info('Conectando a SQLite...');
  const sqlite = new SQLiteClient();

  try {
    // 1. Exportar datos de SQLite
    log.info('Exportando datos de SQLite...');
    
    const data = {
      users: await sqlite.user.findMany(),
      roles: await sqlite.role.findMany(),
      permissions: await sqlite.permission.findMany(),
      rolePermissions: await sqlite.rolePermission.findMany(),
      categories: await sqlite.category.findMany(),
      products: await sqlite.product.findMany(),
      productLots: await sqlite.productLot.findMany(),
      stockMovements: await sqlite.stockMovement.findMany(),
      kits: await sqlite.kit.findMany(),
      kitProducts: await sqlite.kitProduct.findMany(),
      beneficiaries: await sqlite.beneficiary.findMany(),
      requests: await sqlite.request.findMany(),
      requestProducts: await sqlite.requestProduct.findMany(),
      requestKits: await sqlite.requestKit.findMany(),
      requestHistories: await sqlite.requestHistory.findMany(),
      deliveries: await sqlite.delivery.findMany(),
      deliveryDetails: await sqlite.deliveryDetail.findMany(),
      deliveryHistories: await sqlite.deliveryHistory.findMany(),
      returns: await sqlite.return.findMany(),
      returnDetails: await sqlite.returnDetail.findMany(),
      notifications: await sqlite.notification.findMany(),
      auditLogs: await sqlite.auditLog.findMany()
    };

    // Guardar backup
    const backupPath = path.join(process.cwd(), 'backups', `migration-backup-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    log.success(`Backup guardado en: ${backupPath}`);

    // Mostrar estadísticas
    console.log('\nDatos a migrar:');
    Object.entries(data).forEach(([table, records]) => {
      console.log(`  - ${table}: ${(records as any[]).length} registros`);
    });

    // 2. Cambiar schema a PostgreSQL
    log.info('\nCambiando schema a PostgreSQL...');
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const postgresSchemaPath = path.join(process.cwd(), 'prisma', 'schema.postgresql.prisma');
    
    if (!fs.existsSync(postgresSchemaPath)) {
      log.error('No se encontró schema.postgresql.prisma');
      process.exit(1);
    }

    // Backup del schema actual
    fs.copyFileSync(schemaPath, schemaPath + '.sqlite.backup');
    
    // Copiar schema de PostgreSQL
    fs.copyFileSync(postgresSchemaPath, schemaPath);
    log.success('Schema actualizado a PostgreSQL');

    // 3. Actualizar .env
    log.info('Actualizando DATABASE_URL...');
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Comentar la URL de SQLite y agregar PostgreSQL
    envContent = envContent.replace(
      /^DATABASE_URL=.*$/m,
      `# DATABASE_URL="file:./dev.db"  # SQLite (comentado)\nDATABASE_URL="${postgresUrl}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    log.success('.env actualizado');

    // 4. Generar cliente Prisma
    log.info('Generando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // 5. Crear tablas en PostgreSQL
    log.info('Creando tablas en PostgreSQL...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    // 6. Importar datos
    log.info('\nImportando datos a PostgreSQL...');
    
    // Necesitamos un nuevo cliente para PostgreSQL
    // Esto requiere reiniciar el proceso o usar dynamic import
    log.warn('Para completar la migración, ejecute:');
    console.log('\n  npx tsx scripts/import-to-postgres.ts\n');
    
    // Guardar datos para importación
    const importDataPath = path.join(process.cwd(), 'backups', 'import-data.json');
    fs.writeFileSync(importDataPath, JSON.stringify(data, null, 2));
    log.success(`Datos preparados para importación: ${importDataPath}`);

    console.log('\n========================================');
    console.log('  Migración Fase 1 Completada');
    console.log('========================================');
    console.log('\nPróximos pasos:');
    console.log('1. Verificar conexión a PostgreSQL');
    console.log('2. Ejecutar: npx tsx scripts/import-to-postgres.ts');
    console.log('3. Verificar datos migrados');
    console.log('4. Actualizar configuración de producción\n');

  } catch (error) {
    log.error(`Error durante la migración: ${error}`);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
  }
}

main();
