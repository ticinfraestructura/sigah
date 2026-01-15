/**
 * Rutas de Backup
 * 
 * Endpoints para gestión de backups (solo administradores)
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { 
  createBackup, 
  restoreBackup, 
  listBackups, 
  deleteBackup,
  getBackupStats 
} from '../services/backup.service';

const router = Router();

/**
 * @swagger
 * /api/backups:
 *   get:
 *     tags: [Backups]
 *     summary: List all backups
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, authorize('system', 'manage'), async (req: AuthRequest, res: Response) => {
  const backups = listBackups();
  const stats = getBackupStats();
  
  res.json({
    success: true,
    data: {
      backups: backups.map(b => ({
        ...b,
        sizeMB: (b.size / 1024 / 1024).toFixed(2)
      })),
      stats
    }
  });
});

/**
 * @swagger
 * /api/backups:
 *   post:
 *     tags: [Backups]
 *     summary: Create a new backup
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, authorize('system', 'manage'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const backupPath = await createBackup('manual');
    
    res.json({
      success: true,
      message: 'Backup creado exitosamente',
      data: { path: backupPath }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/backups/{name}/restore:
 *   post:
 *     tags: [Backups]
 *     summary: Restore a backup
 *     security:
 *       - bearerAuth: []
 */
router.post('/:name/restore', authenticate, authorize('system', 'manage'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    await restoreBackup(name);
    
    res.json({
      success: true,
      message: 'Backup restaurado exitosamente. Reinicie el servidor para aplicar los cambios.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/backups/{name}:
 *   delete:
 *     tags: [Backups]
 *     summary: Delete a backup
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:name', authenticate, authorize('system', 'manage'), async (req: AuthRequest, res: Response) => {
  const { name } = req.params;
  const deleted = deleteBackup(name);
  
  res.json({
    success: deleted,
    message: deleted ? 'Backup eliminado' : 'Backup no encontrado'
  });
});

export default router;
