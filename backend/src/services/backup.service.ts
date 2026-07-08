/**
 * Servicio de Backup
 *
 * Proporciona respaldos automáticos de la base de datos PostgreSQL
 * - Backup manual bajo demanda vía pg_dump
 * - Backup automático programado
 * - Rotación de backups antiguos
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger.service';

const execAsync = promisify(exec);

// Configuración
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 30; // Mantener últimos 30 backups

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Parsear DATABASE_URL de PostgreSQL
 * Formato: postgresql://user:password@host:port/dbname
 */
const parseDatabaseUrl = (): { user: string; password: string; host: string; port: string; dbname: string } => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL no está configurada en las variables de entorno');
  }

  try {
    const parsed = new URL(url);
    return {
      user: parsed.username,
      password: parsed.password,
      host: parsed.hostname,
      port: parsed.port || '5432',
      dbname: parsed.pathname.replace(/^\//, '').split('?')[0]
    };
  } catch {
    throw new Error(`DATABASE_URL inválida: ${url}`);
  }
};

/**
 * Crear backup de la base de datos PostgreSQL usando pg_dump
 */
export const createBackup = async (type: 'manual' | 'auto' = 'auto'): Promise<string> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup-${type}-${timestamp}.sql`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  try {
    const db = parseDatabaseUrl();

    // Construir comando pg_dump con formato plain SQL comprimido
    const env = { ...process.env, PGPASSWORD: db.password };
    const command = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.dbname} -F p --no-password -f "${backupPath}"`;

    await execAsync(command, { env });

    // Verificar que el backup se creó correctamente
    if (!fs.existsSync(backupPath)) {
      throw new Error('pg_dump no generó el archivo de backup');
    }
    const stats = fs.statSync(backupPath);

    logger.info(`[BACKUP] Created: ${backupName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Rotar backups antiguos
    await rotateBackups();

    return backupPath;
  } catch (error) {
    logger.error('[BACKUP] Failed to create backup', { error });
    throw error;
  }
};

/**
 * Restaurar backup PostgreSQL usando psql
 */
export const restoreBackup = async (backupName: string): Promise<void> => {
  const backupPath = path.join(BACKUP_DIR, backupName);

  try {
    // Verificar que existe el backup
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupName}`);
    }

    const db = parseDatabaseUrl();

    // Crear backup del estado actual antes de restaurar
    await createBackup('auto');

    // Restaurar usando psql
    const env = { ...process.env, PGPASSWORD: db.password };
    const command = `psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.dbname} --no-password -f "${backupPath}"`;

    await execAsync(command, { env });

    logger.info(`[BACKUP] Restored: ${backupName}`);
  } catch (error) {
    logger.error('[BACKUP] Failed to restore backup', { error });
    throw error;
  }
};

/**
 * Listar backups disponibles
 */
export const listBackups = (): Array<{
  name: string;
  size: number;
  createdAt: Date;
  type: string;
}> => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(name => {
        const filePath = path.join(BACKUP_DIR, name);
        const stats = fs.statSync(filePath);
        const type = name.includes('manual') ? 'manual' : 
                     name.includes('auto') ? 'auto' : 
                     name.includes('pre-restore') ? 'pre-restore' : 'unknown';
        return {
          name,
          size: stats.size,
          createdAt: stats.birthtime,
          type
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return files;
  } catch (error) {
    logger.error('[BACKUP] Failed to list backups', { error });
    return [];
  }
};

/**
 * Eliminar backup específico
 */
export const deleteBackup = (backupName: string): boolean => {
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  try {
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      logger.info(`[BACKUP] Deleted: ${backupName}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[BACKUP] Failed to delete backup', { error });
    return false;
  }
};

/**
 * Rotar backups antiguos
 */
const rotateBackups = async (): Promise<void> => {
  const backups = listBackups();
  
  // Mantener solo los últimos MAX_BACKUPS
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    for (const backup of toDelete) {
      deleteBackup(backup.name);
    }
    logger.info(`[BACKUP] Rotated ${toDelete.length} old backups`);
  }
};

/**
 * Obtener estadísticas de backups
 */
export const getBackupStats = () => {
  const backups = listBackups();
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
  
  return {
    count: backups.length,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    lastBackup: backups[0]?.createdAt || null,
    oldestBackup: backups[backups.length - 1]?.createdAt || null
  };
};

// ============ BACKUP AUTOMÁTICO ============

let backupInterval: NodeJS.Timeout | null = null;

/**
 * Iniciar backups automáticos
 */
export const startAutoBackup = (intervalHours: number = 24): void => {
  if (backupInterval) {
    clearInterval(backupInterval);
  }
  
  // Crear backup inicial
  createBackup('auto').catch(err => logger.error('[BACKUP] Auto backup failed', { error: err }));
  
  // Programar backups periódicos
  backupInterval = setInterval(() => {
    createBackup('auto').catch(err => logger.error('[BACKUP] Auto backup failed', { error: err }));
  }, intervalHours * 60 * 60 * 1000);
  
  logger.info(`[BACKUP] Auto backup started (every ${intervalHours} hours)`);
};

/**
 * Detener backups automáticos
 */
export const stopAutoBackup = (): void => {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    logger.info('[BACKUP] Auto backup stopped');
  }
};

// Iniciar backup automático al cargar el módulo (cada 24 horas)
if (process.env.NODE_ENV === 'production') {
  startAutoBackup(24);
} else {
  // En desarrollo, backup cada 4 horas
  startAutoBackup(4);
}
