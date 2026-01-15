import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

const router = Router();

// Get all categories
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const includeInactive = req.query.includeInactive === 'true';

    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// Get category by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { products: { where: { isActive: true } } }
    });

    if (!category) {
      throw new AppError('Categoría no encontrada', 404);
    }

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// Create category
router.post('/', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { name, description } = req.body;

    if (!name) {
      throw new AppError('El nombre es requerido', 400);
    }

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      throw new AppError('Ya existe una categoría con ese nombre', 400);
    }

    const category = await prisma.category.create({
      data: { name, description }
    });

    await auditService.log('Category', category.id, 'CREATE', req.user!.id, null, category);

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// Update category
router.put('/:id', authenticate, authorize('ADMIN', 'WAREHOUSE'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { name, description, isActive } = req.body;

    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError('Categoría no encontrada', 404);
    }

    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findUnique({ where: { name } });
      if (duplicate) {
        throw new AppError('Ya existe una categoría con ese nombre', 400);
      }
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description, isActive }
    });

    await auditService.log('Category', category.id, 'UPDATE', req.user!.id, existing, category);

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// Delete (deactivate) category
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);

    const existing = await prisma.category.findUnique({ 
      where: { id: req.params.id },
      include: { products: { where: { isActive: true } } }
    });

    if (!existing) {
      throw new AppError('Categoría no encontrada', 404);
    }

    if (existing.products.length > 0) {
      throw new AppError('No se puede eliminar una categoría con productos activos', 400);
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    await auditService.log('Category', category.id, 'DELETE', req.user!.id, existing, category);

    res.json({ success: true, message: 'Categoría desactivada' });
  } catch (error) {
    next(error);
  }
});

export default router;
