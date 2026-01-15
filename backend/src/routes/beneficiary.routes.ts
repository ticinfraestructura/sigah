import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { authenticate, hasPermission, AuthRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

const router = Router();

// Get all beneficiaries
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { search, populationType, includeInactive, page = '1', limit = '50' } = req.query;

    const where: any = {};
    
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (populationType) {
      where.populationType = populationType;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { documentNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [beneficiaries, total] = await Promise.all([
      prisma.beneficiary.findMany({
        where,
        orderBy: { lastName: 'asc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.beneficiary.count({ where })
    ]);

    res.json({
      success: true,
      data: beneficiaries,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get beneficiary by ID with requests history
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: req.params.id },
      include: {
        requests: {
          include: {
            requestProducts: { include: { product: true } },
            requestKits: { include: { kit: true } },
            deliveries: true
          },
          orderBy: { requestDate: 'desc' },
          take: 10
        }
      }
    });

    if (!beneficiary) {
      throw new AppError('Beneficiario no encontrado', 404);
    }

    res.json({ success: true, data: beneficiary });
  } catch (error) {
    next(error);
  }
});

// Create beneficiary
router.post('/', authenticate, hasPermission('beneficiaries', 'create'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { 
      documentType, 
      documentNumber, 
      firstName, 
      lastName, 
      phone, 
      email, 
      address, 
      city,
      populationType,
      familySize,
      notes 
    } = req.body;

    if (!documentType || !documentNumber || !firstName || !lastName) {
      throw new AppError('Tipo de documento, número, nombre y apellido son requeridos', 400);
    }

    const existing = await prisma.beneficiary.findUnique({
      where: { documentType_documentNumber: { documentType, documentNumber } }
    });

    if (existing) {
      throw new AppError('Ya existe un beneficiario con ese documento', 400);
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        documentType,
        documentNumber,
        firstName,
        lastName,
        phone,
        email,
        address,
        city,
        populationType,
        familySize: familySize || 1,
        notes
      }
    });

    await auditService.log('Beneficiary', beneficiary.id, 'CREATE', req.user!.id, null, beneficiary);

    res.status(201).json({ success: true, data: beneficiary });
  } catch (error) {
    next(error);
  }
});

// Update beneficiary
router.put('/:id', authenticate, hasPermission('beneficiaries', 'edit'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const auditService = new AuditService(prisma);
    const { 
      documentType, 
      documentNumber, 
      firstName, 
      lastName, 
      phone, 
      email, 
      address, 
      city,
      populationType,
      familySize,
      notes,
      isActive 
    } = req.body;

    const existing = await prisma.beneficiary.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError('Beneficiario no encontrado', 404);
    }

    // Check for duplicate document if changing
    if (documentType && documentNumber && 
        (documentType !== existing.documentType || documentNumber !== existing.documentNumber)) {
      const duplicate = await prisma.beneficiary.findUnique({
        where: { documentType_documentNumber: { documentType, documentNumber } }
      });
      if (duplicate && duplicate.id !== existing.id) {
        throw new AppError('Ya existe otro beneficiario con ese documento', 400);
      }
    }

    const beneficiary = await prisma.beneficiary.update({
      where: { id: req.params.id },
      data: {
        documentType,
        documentNumber,
        firstName,
        lastName,
        phone,
        email,
        address,
        city,
        populationType,
        familySize,
        notes,
        isActive
      }
    });

    await auditService.log('Beneficiary', beneficiary.id, 'UPDATE', req.user!.id, existing, beneficiary);

    res.json({ success: true, data: beneficiary });
  } catch (error) {
    next(error);
  }
});

// Search beneficiary by document
router.get('/search/document', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { documentType, documentNumber } = req.query;

    if (!documentType || !documentNumber) {
      throw new AppError('Tipo y número de documento son requeridos', 400);
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { 
        documentType_documentNumber: { 
          documentType: documentType as any, 
          documentNumber: documentNumber as string 
        } 
      }
    });

    res.json({ success: true, data: beneficiary });
  } catch (error) {
    next(error);
  }
});

export default router;
