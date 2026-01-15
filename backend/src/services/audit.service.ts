import { PrismaClient } from '@prisma/client';

// Audit actions (SQLite doesn't support enums)
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'REACTIVATE' | 'APPROVE' | 'REJECT' | 'DELIVER' | 'STATUS_CHANGE';

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async log(
    entity: string,
    entityId: string,
    action: AuditAction,
    userId: string,
    oldValues?: object | null,
    newValues?: object | null
  ) {
    await this.prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        userId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null
      }
    });
  }

  async getEntityHistory(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}
