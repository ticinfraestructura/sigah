import { Router, Request, Response, NextFunction } from 'express';
import { ReportsService } from '../services/reports.service';
import { authenticateImproved } from './auth-improved.routes';

const router = Router();

// Obtener tipos de reportes disponibles
router.get('/types', authenticateImproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportTypes = [
      {
        id: 'inventory',
        name: 'Reporte de Inventario',
        description: 'Listado completo de productos con stock y movimientos',
        formats: ['json', 'excel', 'pdf']
      },
      {
        id: 'movements',
        name: 'Reporte de Movimientos',
        description: 'Historial de movimientos de stock',
        formats: ['json', 'excel', 'pdf']
      },
      {
        id: 'beneficiaries',
        name: 'Reporte de Beneficiarios',
        description: 'Listado de beneficiarios y sus solicitudes',
        formats: ['json', 'excel', 'pdf']
      },
      {
        id: 'requests',
        name: 'Reporte de Solicitudes',
        description: 'Historial de solicitudes y su estado',
        formats: ['json', 'excel', 'pdf']
      }
    ];

    res.json({
      success: true,
      data: reportTypes
    });
  } catch (error) {
    next(error);
  }
});

// Generar reporte
router.post('/generate/:type', authenticateImproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const options = req.body;

    // Validar tipo de reporte
    const validTypes = ['inventory', 'movements', 'beneficiaries', 'requests'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de reporte no válido'
      });
    }

    // Generar reporte
    const report = await ReportsService.generateReport(type as any, options);

    // Si es un archivo, enviar como descarga
    if (options.format && options.format !== 'json') {
      res.setHeader('Content-Type', report.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      return res.send(report.data);
    }

    // Si es JSON, enviar como respuesta normal
    res.json({
      success: true,
      data: report.data,
      filename: report.filename
    });
  } catch (error) {
    next(error);
  }
});

// Vista previa de reporte (sin exportar)
router.post('/preview/:type', authenticateImproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const options = { ...req.body, format: 'json' };

    const validTypes = ['inventory', 'movements', 'beneficiaries', 'requests'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de reporte no válido'
      });
    }

    const report = await ReportsService.generateReport(type as any, options);

    res.json({
      success: true,
      data: {
        title: report.data.title,
        generatedAt: report.data.generatedAt,
        summary: report.data.summary,
        sampleData: report.data.data.slice(0, 5), // Solo primeros 5 registros para vista previa
        totalRecords: report.data.data.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Estadísticas de reportes
router.get('/stats', authenticateImproved, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Aquí podrías agregar estadísticas de uso de reportes
    const stats = {
      totalReportsGenerated: 0,
      mostUsedType: 'inventory',
      averageGenerationTime: '2.3s',
      popularFormats: ['excel', 'pdf', 'json']
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
