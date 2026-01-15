/**
 * Servicio de Auditoría Avanzada
 * 
 * Proporciona:
 * - Historial detallado de cambios por entidad
 * - Comparación de versiones
 * - Búsqueda en historial
 * - Exportación de auditoría
 */

import { PrismaClient } from '@prisma/client';
import logger from './logger.service';

const prisma = new PrismaClient();

// ============ TIPOS ============

export interface AuditEntry {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  userId: string;
  userName?: string;
  createdAt: Date;
  changes?: FieldChange[];
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditSearchParams {
  entity?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ============ FUNCIONES PRINCIPALES ============

/**
 * Registrar acción de auditoría
 */
export const logAuditAction = async (
  entity: string,
  entityId: string,
  action: string,
  userId: string,
  oldValues?: Record<string, any> | null,
  newValues?: Record<string, any> | null
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        userId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null
      }
    });

    logger.info('[AUDIT] Action logged', { entity, entityId, action, userId });
  } catch (error) {
    logger.error('[AUDIT] Failed to log action', { error, entity, entityId, action });
  }
};

/**
 * Obtener historial de una entidad específica
 */
export const getEntityHistory = async (
  entity: string,
  entityId: string
): Promise<AuditEntry[]> => {
  const logs = await prisma.auditLog.findMany({
    where: { entity, entityId },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return logs.map(log => ({
    id: log.id,
    entity: log.entity,
    entityId: log.entityId,
    action: log.action,
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
    newValues: log.newValues ? JSON.parse(log.newValues) : null,
    userId: log.userId,
    userName: `${log.user.firstName} ${log.user.lastName}`,
    createdAt: log.createdAt,
    changes: calculateChanges(
      log.oldValues ? JSON.parse(log.oldValues) : null,
      log.newValues ? JSON.parse(log.newValues) : null
    )
  }));
};

/**
 * Buscar en el historial de auditoría
 */
export const searchAuditLogs = async (
  params: AuditSearchParams
): Promise<{ data: AuditEntry[]; total: number }> => {
  const { entity, entityId, userId, action, startDate, endDate, page = 1, limit = 50 } = params;

  const where: any = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    data: logs.map(log => ({
      id: log.id,
      entity: log.entity,
      entityId: log.entityId,
      action: log.action,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      userId: log.userId,
      userName: `${log.user.firstName} ${log.user.lastName}`,
      createdAt: log.createdAt
    })),
    total
  };
};

/**
 * Obtener estadísticas de auditoría
 */
export const getAuditStats = async (startDate?: Date, endDate?: Date) => {
  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [byAction, byEntity, byUser, total] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true }
    }),
    prisma.auditLog.groupBy({
      by: ['entity'],
      where,
      _count: { entity: true }
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10
    }),
    prisma.auditLog.count({ where })
  ]);

  // Obtener nombres de usuarios
  const userIds = byUser.map(u => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true }
  });
  const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

  return {
    total,
    byAction: byAction.map(a => ({ action: a.action, count: a._count.action })),
    byEntity: byEntity.map(e => ({ entity: e.entity, count: e._count.entity })),
    byUser: byUser.map(u => ({ 
      userId: u.userId, 
      userName: userMap.get(u.userId) || 'Unknown',
      count: u._count.userId 
    }))
  };
};

/**
 * Comparar dos versiones de una entidad
 */
export const compareVersions = async (
  auditId1: string,
  auditId2: string
): Promise<FieldChange[]> => {
  const [log1, log2] = await Promise.all([
    prisma.auditLog.findUnique({ where: { id: auditId1 } }),
    prisma.auditLog.findUnique({ where: { id: auditId2 } })
  ]);

  if (!log1 || !log2) {
    throw new Error('Audit logs not found');
  }

  const values1 = log1.newValues ? JSON.parse(log1.newValues) : {};
  const values2 = log2.newValues ? JSON.parse(log2.newValues) : {};

  return calculateChanges(values1, values2);
};

/**
 * Exportar auditoría a CSV
 */
export const exportAuditToCSV = async (params: AuditSearchParams): Promise<string> => {
  const { data } = await searchAuditLogs({ ...params, limit: 10000 });

  const headers = ['Fecha', 'Entidad', 'ID Entidad', 'Acción', 'Usuario', 'Cambios'];
  const rows = data.map(log => [
    log.createdAt.toISOString(),
    log.entity,
    log.entityId,
    log.action,
    log.userName || log.userId,
    JSON.stringify(log.changes || {})
  ]);

  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
};

// ============ HELPERS ============

/**
 * Calcular cambios entre dos objetos
 */
const calculateChanges = (
  oldValues: Record<string, any> | null,
  newValues: Record<string, any> | null
): FieldChange[] => {
  const changes: FieldChange[] = [];
  
  if (!oldValues && !newValues) return changes;
  
  const allKeys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {})
  ]);

  for (const key of allKeys) {
    const oldVal = oldValues?.[key];
    const newVal = newValues?.[key];
    
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal
      });
    }
  }

  return changes;
};

/**
 * Limpiar logs antiguos (más de 1 año)
 */
export const cleanOldAuditLogs = async (olderThanDays: number = 365): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } }
  });

  logger.info(`[AUDIT] Cleaned ${result.count} old audit logs`);
  return result.count;
};
