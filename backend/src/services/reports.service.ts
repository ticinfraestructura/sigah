import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export interface ReportOptions {
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'excel' | 'pdf';
  filters?: {
    categoryId?: string;
    status?: string;
    userId?: string;
  };
}

export class ReportsService {
  // Reporte de inventario completo
  static async generateInventoryReport(options: ReportOptions = {}) {
    try {
      const where: any = { isActive: true };
      
      if (options.filters?.categoryId) {
        where.categoryId = options.filters.categoryId;
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          lots: { where: { isActive: true } },
          stockMovements: {
            where: options.startDate || options.endDate ? {
              createdAt: {
                gte: options.startDate ? new Date(options.startDate) : undefined,
                lte: options.endDate ? new Date(options.endDate) : undefined
              }
            } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        },
        orderBy: { name: 'asc' }
      });

      const reportData = products.map(product => ({
        Código: product.code,
        Nombre: product.name,
        Categoría: product.category.name,
        Unidad: product.unit,
        Stock_Total: product.lots.reduce((sum, lot) => sum + lot.quantity, 0),
        Stock_Minimo: product.minStock,
        Lotes: product.lots.length,
        Estado_Stock: product.lots.reduce((sum, lot) => sum + lot.quantity, 0) < product.minStock ? 'BAJO' : 'OK',
        Perecedero: product.isPerishable ? 'Sí' : 'No',
        Movimientos_Recientes: product.stockMovements.length
      }));

      return {
        title: 'Reporte de Inventario',
        generatedAt: new Date().toISOString(),
        data: reportData,
        summary: {
          totalProducts: products.length,
          lowStockProducts: products.filter(p => 
            p.lots.reduce((sum, lot) => sum + lot.quantity, 0) < p.minStock
          ).length,
          totalStock: products.reduce((sum, p) => 
            sum + p.lots.reduce((s, lot) => s + lot.quantity, 0), 0
          ),
          categories: [...new Set(products.map(p => p.category.name))].length
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error generando reporte de inventario: ${message}`);
    }
  }

  // Reporte de movimientos de stock
  static async generateStockMovementsReport(options: ReportOptions = {}) {
    try {
      const where: any = {};
      
      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = new Date(options.startDate);
        if (options.endDate) where.createdAt.lte = new Date(options.endDate);
      }

      if (options.filters?.userId) {
        where.userId = options.filters.userId;
      }

      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          product: true,
          lot: true,
          user: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const reportData = movements.map(movement => ({
        Fecha: movement.createdAt.toLocaleDateString(),
        Hora: movement.createdAt.toLocaleTimeString(),
        Producto: movement.product.name,
        Lote: movement.lot?.lotNumber || 'N/A',
        Tipo: movement.type === 'ENTRY' ? 'ENTRADA' : movement.type === 'EXIT' ? 'SALIDA' : 'AJUSTE',
        Cantidad: movement.quantity,
        Motivo: movement.reason || 'N/A',
        Referencia: movement.reference || 'N/A',
        Usuario: `${movement.user?.firstName} ${movement.user?.lastName}`.trim()
      }));

      return {
        title: 'Reporte de Movimientos de Stock',
        generatedAt: new Date().toISOString(),
        data: reportData,
        summary: {
          totalMovements: movements.length,
          entries: movements.filter(m => m.type === 'ENTRY').length,
          exits: movements.filter(m => m.type === 'EXIT').length,
          adjustments: movements.filter(m => m.type === 'ADJUSTMENT').length
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error generando reporte de movimientos: ${message}`);
    }
  }

  // Reporte de beneficiarios
  static async generateBeneficiariesReport(options: ReportOptions = {}) {
    try {
      const where: any = { isActive: true };
      
      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = new Date(options.startDate);
        if (options.endDate) where.createdAt.lte = new Date(options.endDate);
      }

      const beneficiaries = await prisma.beneficiary.findMany({
        where,
        include: {
          requests: {
            where: options.startDate || options.endDate ? {
              createdAt: {
                gte: options.startDate ? new Date(options.startDate) : undefined,
                lte: options.endDate ? new Date(options.endDate) : undefined
              }
            } : undefined,
            select: { status: true, createdAt: true }
          }
        },
        orderBy: { lastName: 'asc' }
      });

      const reportData = beneficiaries.map(beneficiary => ({
        'Tipo_Documento': beneficiary.documentType,
        'Número_Documento': beneficiary.documentNumber,
        Nombres: beneficiary.firstName,
        Apellidos: beneficiary.lastName,
        Teléfono: beneficiary.phone || 'N/A',
        Email: beneficiary.email || 'N/A',
        Dirección: beneficiary.address || 'N/A',
        Ciudad: beneficiary.city || 'N/A',
        'Tipo_Población': beneficiary.populationType,
        'Tamaño_Familiar': beneficiary.familySize,
        'Total_Solicitudes': beneficiary.requests.length,
        'Solicitudes_Aprobadas': beneficiary.requests.filter(r => r.status === 'APPROVED').length,
        'Fecha_Registro': beneficiary.createdAt.toLocaleDateString()
      }));

      return {
        title: 'Reporte de Beneficiarios',
        generatedAt: new Date().toISOString(),
        data: reportData,
        summary: {
          totalBeneficiaries: beneficiaries.length,
          averageFamilySize: beneficiaries.reduce((sum, b) => sum + b.familySize, 0) / beneficiaries.length,
          populationTypes: [...new Set(beneficiaries.map(b => b.populationType))].length,
          totalRequests: beneficiaries.reduce((sum, b) => sum + b.requests.length, 0)
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error generando reporte de beneficiarios: ${message}`);
    }
  }

  // Reporte de solicitudes
  static async generateRequestsReport(options: ReportOptions = {}) {
    try {
      const where: any = {};
      
      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = new Date(options.startDate);
        if (options.endDate) where.createdAt.lte = new Date(options.endDate);
      }

      if (options.filters?.status) {
        where.status = options.filters.status;
      }

      const requests = await prisma.request.findMany({
        where,
        include: {
          beneficiary: {
            select: { firstName: true, lastName: true, documentNumber: true }
          },
          createdBy: {
            select: { firstName: true, lastName: true }
          },
          requestProducts: {
            include: { product: { select: { name: true } } }
          },
          requestKits: {
            include: { kit: { select: { name: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const reportData = requests.map(request => ({
        Código: request.code,
        'Fecha_Creación': request.createdAt.toLocaleDateString(),
        Beneficiario: `${request.beneficiary.firstName} ${request.beneficiary.lastName}`,
        'Documento': request.beneficiary.documentNumber,
        Estado: request.status,
        Prioridad: request.priority,
        'Productos_Solicitados': request.requestProducts.length,
        'Kits_Solicitados': request.requestKits.length,
        'Creado_Por': `${request.createdBy.firstName} ${request.createdBy.lastName}`,
        Notas: request.notes || 'N/A'
      }));

      return {
        title: 'Reporte de Solicitudes',
        generatedAt: new Date().toISOString(),
        data: reportData,
        summary: {
          totalRequests: requests.length,
          statusBreakdown: requests.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          priorityBreakdown: requests.reduce((acc, r) => {
            acc[`Prioridad_${r.priority}`] = (acc[`Prioridad_${r.priority}`] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error generando reporte de solicitudes: ${message}`);
    }
  }

  // Exportar a Excel
  static async exportToExcel(reportData: any): Promise<Buffer> {
    try {
      const wb = XLSX.utils.book_new();
      
      // Hoja principal de datos
      const wsData = XLSX.utils.json_to_sheet(reportData.data);
      XLSX.utils.book_append_sheet(wb, wsData, 'Datos');

      // Hoja de resumen
      if (reportData.summary) {
        const summaryData = Object.entries(reportData.summary).map(([key, value]) => ({
          Métrica: key,
          Valor: typeof value === 'object' ? JSON.stringify(value) : value
        }));
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
      }

      // Hoja de metadatos
      const metadata = [
        { 'Reporte': reportData.title },
        { 'Generado': reportData.generatedAt },
        { 'Registros': reportData.data.length }
      ];
      const wsMetadata = XLSX.utils.json_to_sheet(metadata);
      XLSX.utils.book_append_sheet(wb, wsMetadata, 'Información');

      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error exportando a Excel: ${message}`);
    }
  }

  // Exportar a PDF
  static async exportToPDF(reportData: any): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Encabezado
        doc.fontSize(20).text(reportData.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generado: ${new Date(reportData.generatedAt).toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        // Resumen
        if (reportData.summary) {
          doc.fontSize(14).text('Resumen', { underline: true });
          doc.moveDown(0.5);
          
          Object.entries(reportData.summary).forEach(([key, value]) => {
            const text = typeof value === 'object' ? `${key}: ${JSON.stringify(value)}` : `${key}: ${value}`;
            doc.fontSize(10).text(text);
            doc.moveDown(0.3);
          });
          doc.moveDown();
        }

        // Tabla de datos
        if (reportData.data.length > 0) {
          doc.fontSize(14).text('Datos', { underline: true });
          doc.moveDown(0.5);

          const headers = Object.keys(reportData.data[0]);
          const rowHeight = 20;
          const tableTop = doc.y;
          const tableWidth = 500;
          const columnWidth = tableWidth / headers.length;

          // Encabezados de tabla
          headers.forEach((header, i) => {
            doc.fontSize(9).text(header, 50 + i * columnWidth, tableTop, { width: columnWidth });
          });

          // Datos de tabla
          reportData.data.slice(0, 50).forEach((row: any, rowIndex: number) => {
            const y = tableTop + (rowIndex + 1) * rowHeight;
            if (y > 700) { // Nueva página si es necesario
              doc.addPage();
              return;
            }
            
            headers.forEach((header, colIndex) => {
              const value = row[header] || '';
              doc.fontSize(8).text(String(value), 50 + colIndex * columnWidth, y, { width: columnWidth });
            });
          });
        }

        // Pie de página
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(`Página ${i + 1} de ${pageCount}`, 50, 800, { align: 'center' });
        }

        doc.end();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error exportando a PDF: ${message}`);
    }
  }

  // Generar reporte completo
  static async generateReport(type: 'inventory' | 'movements' | 'beneficiaries' | 'requests', options: ReportOptions = {}) {
    let reportData;

    switch (type) {
      case 'inventory':
        reportData = await this.generateInventoryReport(options);
        break;
      case 'movements':
        reportData = await this.generateStockMovementsReport(options);
        break;
      case 'beneficiaries':
        reportData = await this.generateBeneficiariesReport(options);
        break;
      case 'requests':
        reportData = await this.generateRequestsReport(options);
        break;
      default:
        throw new Error('Tipo de reporte no válido');
    }

    // Exportar según formato solicitado
    switch (options.format) {
      case 'excel':
        return {
          data: await this.exportToExcel(reportData),
          filename: `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
      case 'pdf':
        return {
          data: await this.exportToPDF(reportData),
          filename: `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
          mimeType: 'application/pdf'
        };
      default:
        return {
          data: reportData,
          filename: `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
    }
  }
}
