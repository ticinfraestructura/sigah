/**
 * Rutas de Auditoría Avanzada
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { auditZodSchemas, validateZodRequest } from '../middleware/validation.middleware';
import { 
  getEntityHistory,
  searchAuditLogs,
  getAuditStats,
  compareVersions,
  exportAuditToCSV
} from '../services/audit-advanced.service';

const router = Router();

/**
 * @swagger
 * /api/audit/entity/{entity}/{entityId}:
 *   get:
 *     tags: [Audit]
 *     summary: Get entity history
 */
router.get('/entity/:entity/:entityId', authenticate, authorize('ADMIN'), validateZodRequest({ params: auditZodSchemas.entityParams }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entity, entityId } = req.params;
    const history = await getEntityHistory(entity, entityId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/audit/search:
 *   get:
 *     tags: [Audit]
 *     summary: Search audit logs
 */
router.get('/search', authenticate, authorize('ADMIN'), validateZodRequest({ query: auditZodSchemas.searchQuery }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entity, entityId, userId, action, startDate, endDate, page = 1, limit = 50 } = req.query as {
      entity?: string;
      entityId?: string;
      userId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    };
    
    const result = await searchAuditLogs({
      entity: entity as string,
      entityId: entityId as string,
      userId: userId as string,
      action: action as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page,
      limit
    });
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     tags: [Audit]
 *     summary: Get audit statistics
 */
router.get('/stats', authenticate, authorize('ADMIN'), validateZodRequest({ query: auditZodSchemas.statsQuery }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getAuditStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/audit/compare:
 *   get:
 *     tags: [Audit]
 *     summary: Compare two audit versions
 */
router.get('/compare', authenticate, authorize('ADMIN'), validateZodRequest({ query: auditZodSchemas.compareQuery }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id1, id2 } = req.query;

    const changes = await compareVersions(id1 as string, id2 as string);
    
    res.json({
      success: true,
      data: changes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     tags: [Audit]
 *     summary: Export audit logs to CSV
 */
router.get('/export', authenticate, authorize('ADMIN'), validateZodRequest({ query: auditZodSchemas.exportQuery }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entity, entityId, userId, action, startDate, endDate } = req.query;
    
    const csv = await exportAuditToCSV({
      entity: entity as string,
      entityId: entityId as string,
      userId: userId as string,
      action: action as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
