import { Router, Response, NextFunction } from 'express';
// Reporte de cancelaciones actualizado - v2
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// TIPOS DE REPORTES DISPONIBLES
// ============================================
const REPORT_TYPES = {
  inventory: {
    name: 'Inventario',
    description: 'Stock actual, movimientos y productos por vencer',
    subtypes: [
      { id: 'stock_actual', name: 'Stock Actual', description: 'Estado actual del inventario' },
      { id: 'movimientos', name: 'Movimientos', description: 'Historial de entradas, salidas y ajustes' },
      { id: 'historico_eliminaciones', name: 'Histórico Eliminaciones', description: 'Registro de lotes eliminados y sus motivos' },
      { id: 'por_vencer', name: 'Por Vencer', description: 'Productos próximos a vencer' },
      { id: 'bajo_stock', name: 'Bajo Stock', description: 'Productos con stock bajo' }
    ]
  },
  kits: {
    name: 'Kits',
    description: 'Kits configurados y su disponibilidad',
    subtypes: [
      { id: 'listado', name: 'Listado de Kits', description: 'Todos los kits configurados' },
      { id: 'disponibilidad', name: 'Disponibilidad', description: 'Kits disponibles para entrega' },
      { id: 'composicion', name: 'Composición', description: 'Detalle de productos por kit' }
    ]
  },
  beneficiaries: {
    name: 'Beneficiarios',
    description: 'Registro de beneficiarios y sus solicitudes',
    subtypes: [
      { id: 'listado', name: 'Listado', description: 'Todos los beneficiarios registrados' },
      { id: 'por_ubicacion', name: 'Por Ubicación', description: 'Beneficiarios agrupados por ubicación' },
      { id: 'historial_ayudas', name: 'Historial de Ayudas', description: 'Ayudas recibidas por beneficiario' }
    ]
  },
  requests: {
    name: 'Solicitudes',
    description: 'Solicitudes de ayuda y su estado',
    subtypes: [
      { id: 'listado', name: 'Listado General', description: 'Todas las solicitudes' },
      { id: 'por_estado', name: 'Por Estado', description: 'Solicitudes agrupadas por estado' },
      { id: 'pendientes', name: 'Pendientes', description: 'Solicitudes sin procesar' }
    ]
  },
  deliveries: {
    name: 'Entregas',
    description: 'Entregas realizadas y su trazabilidad',
    subtypes: [
      { id: 'listado', name: 'Listado General', description: 'Todas las entregas' },
      { id: 'por_estado', name: 'Por Estado', description: 'Entregas agrupadas por estado' },
      { id: 'trazabilidad', name: 'Trazabilidad', description: 'Flujo completo de cada entrega' },
      { id: 'cancelaciones', name: 'Cancelaciones', description: 'Detalle completo de entregas canceladas' }
    ]
  },
  authorizations: {
    name: 'Autorizaciones',
    description: 'Historial de autorizaciones y segregación',
    subtypes: [
      { id: 'listado', name: 'Listado', description: 'Todas las autorizaciones' },
      { id: 'por_autorizador', name: 'Por Autorizador', description: 'Agrupado por quien autoriza' },
      { id: 'tiempos', name: 'Tiempos de Respuesta', description: 'Análisis de tiempos' }
    ]
  },
  returns: {
    name: 'Devoluciones',
    description: 'Devoluciones y sus motivos',
    subtypes: [
      { id: 'listado', name: 'Listado', description: 'Todas las devoluciones' },
      { id: 'por_motivo', name: 'Por Motivo', description: 'Agrupado por razón de devolución' },
      { id: 'por_producto', name: 'Por Producto', description: 'Productos más devueltos' }
    ]
  }
};

// Campos seleccionables por tipo de reporte
const REPORT_FIELDS: Record<string, { id: string; name: string; default: boolean }[]> = {
  inventory: [
    { id: 'code', name: 'Código', default: true },
    { id: 'name', name: 'Nombre', default: true },
    { id: 'category', name: 'Categoría', default: true },
    { id: 'stock', name: 'Stock Actual', default: true },
    { id: 'minStock', name: 'Stock Mínimo', default: true },
    { id: 'unit', name: 'Unidad', default: true },
    { id: 'isPerishable', name: 'Perecedero', default: false },
    { id: 'expiryDate', name: 'Fecha Vencimiento', default: false },
    { id: 'lotNumber', name: 'Lote', default: false }
  ],
  kits: [
    { id: 'code', name: 'Código', default: true },
    { id: 'name', name: 'Nombre', default: true },
    { id: 'description', name: 'Descripción', default: true },
    { id: 'products', name: 'Productos', default: true },
    { id: 'available', name: 'Disponibles', default: true },
    { id: 'isActive', name: 'Activo', default: false }
  ],
  beneficiaries: [
    { id: 'documentType', name: 'Tipo Doc.', default: true },
    { id: 'documentNumber', name: 'Documento', default: true },
    { id: 'firstName', name: 'Nombre', default: true },
    { id: 'lastName', name: 'Apellido', default: true },
    { id: 'phone', name: 'Teléfono', default: true },
    { id: 'address', name: 'Dirección', default: true },
    { id: 'city', name: 'Ciudad', default: true },
    { id: 'familySize', name: 'Núcleo Familiar', default: true },
    { id: 'vulnerabilityType', name: 'Tipo Vulnerabilidad', default: false },
    { id: 'requestCount', name: 'Total Solicitudes', default: true }
  ],
  requests: [
    { id: 'code', name: 'Código', default: true },
    { id: 'requestDate', name: 'Fecha Solicitud', default: true },
    { id: 'beneficiary', name: 'Beneficiario', default: true },
    { id: 'document', name: 'Documento', default: true },
    { id: 'status', name: 'Estado', default: true },
    { id: 'priority', name: 'Prioridad', default: true },
    { id: 'products', name: 'Productos', default: true },
    { id: 'kits', name: 'Kits', default: true },
    { id: 'createdBy', name: 'Creado Por', default: false },
    { id: 'notes', name: 'Notas', default: false }
  ],
  deliveries: [
    { id: 'code', name: 'Código Entrega', default: true },
    { id: 'requestCode', name: 'Código Solicitud', default: true },
    { id: 'beneficiary', name: 'Beneficiario', default: true },
    { id: 'status', name: 'Estado', default: true },
    { id: 'createdAt', name: 'Fecha Creación', default: true },
    { id: 'authorizedBy', name: 'Autorizado Por', default: true },
    { id: 'authorizationDate', name: 'Fecha Autorización', default: false },
    { id: 'warehouseUser', name: 'Recibido Bodega', default: false },
    { id: 'preparedBy', name: 'Preparado Por', default: false },
    { id: 'deliveredBy', name: 'Entregado Por', default: true },
    { id: 'deliveryDate', name: 'Fecha Entrega', default: true },
    { id: 'receivedBy', name: 'Recibido Por', default: true },
    { id: 'isPartial', name: 'Parcial', default: false }
  ],
  authorizations: [
    { id: 'deliveryCode', name: 'Código Entrega', default: true },
    { id: 'requestCode', name: 'Código Solicitud', default: true },
    { id: 'beneficiary', name: 'Beneficiario', default: true },
    { id: 'authorizedBy', name: 'Autorizado Por', default: true },
    { id: 'authorizationDate', name: 'Fecha Autorización', default: true },
    { id: 'authorizationNotes', name: 'Notas', default: false },
    { id: 'isPartialAuth', name: 'Autorización Parcial', default: true },
    { id: 'responseTime', name: 'Tiempo Respuesta (hrs)', default: true }
  ],
  returns: [
    { id: 'code', name: 'Código', default: true },
    { id: 'deliveryCode', name: 'Código Entrega', default: true },
    { id: 'returnDate', name: 'Fecha Devolución', default: true },
    { id: 'reason', name: 'Motivo', default: true },
    { id: 'products', name: 'Productos', default: true },
    { id: 'quantities', name: 'Cantidades', default: true },
    { id: 'condition', name: 'Condición', default: true },
    { id: 'processedBy', name: 'Procesado Por', default: true },
    { id: 'notes', name: 'Notas', default: false }
  ]
};

// ============================================
// ENDPOINTS DE CONFIGURACIÓN
// ============================================

// Obtener tipos de reportes disponibles
router.get('/types', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: REPORT_TYPES });
});

// Campos específicos por subtipo
const SUBTYPE_FIELDS: Record<string, { id: string; name: string; default: boolean }[]> = {
  'cancelaciones': [
    { id: 'code', name: 'Código Entrega', default: true },
    { id: 'requestCode', name: 'Código Solicitud', default: true },
    { id: 'beneficiary', name: 'Beneficiario', default: true },
    { id: 'document', name: 'Documento', default: true },
    { id: 'estadoAnterior', name: 'Estado Anterior', default: true },
    { id: 'fechaCancelacion', name: 'Fecha Cancelación', default: true },
    { id: 'horaCancelacion', name: 'Hora Cancelación', default: true },
    { id: 'canceladoPor', name: 'Cancelado Por', default: true },
    { id: 'motivoCancelacion', name: 'Motivo de Cancelación', default: true },
    { id: 'productos', name: 'Productos/Kits', default: true },
    { id: 'fechaCreacion', name: 'Fecha Creación', default: true },
    { id: 'creadoPor', name: 'Creado Por', default: false },
    { id: 'autorizadoPor', name: 'Autorizado Por', default: false },
    { id: 'fechaAutorizacion', name: 'Fecha Autorización', default: false },
    { id: 'notasAutorizacion', name: 'Notas Autorización', default: false }
  ],
  'historico_eliminaciones': [
    { id: 'fecha', name: 'Fecha', default: true },
    { id: 'hora', name: 'Hora', default: true },
    { id: 'productCode', name: 'Código Producto', default: true },
    { id: 'productName', name: 'Nombre Producto', default: true },
    { id: 'category', name: 'Categoría', default: true },
    { id: 'lotNumber', name: 'Número de Lote', default: true },
    { id: 'quantityRemoved', name: 'Cantidad Eliminada', default: true },
    { id: 'reason', name: 'Motivo de Eliminación', default: true },
    { id: 'user', name: 'Usuario', default: true },
    { id: 'source', name: 'Fuente', default: false }
  ],
  'movimientos': [
    { id: 'fecha', name: 'Fecha', default: true },
    { id: 'hora', name: 'Hora', default: true },
    { id: 'code', name: 'Código Producto', default: true },
    { id: 'name', name: 'Nombre Producto', default: true },
    { id: 'category', name: 'Categoría', default: true },
    { id: 'lotNumber', name: 'Lote', default: true },
    { id: 'type', name: 'Tipo Movimiento', default: true },
    { id: 'quantity', name: 'Cantidad', default: true },
    { id: 'reason', name: 'Motivo', default: true },
    { id: 'reference', name: 'Referencia', default: false },
    { id: 'user', name: 'Usuario', default: true }
  ]
};

// Obtener campos disponibles para un tipo de reporte
router.get('/fields/:reportType', authenticate, async (req: AuthRequest, res: Response) => {
  const { reportType } = req.params;
  const { subtype } = req.query;
  
  // Primero verificar si hay campos específicos para el subtipo
  if (subtype && SUBTYPE_FIELDS[subtype as string]) {
    return res.json({ success: true, data: SUBTYPE_FIELDS[subtype as string] });
  }
  
  const fields = REPORT_FIELDS[reportType];
  if (!fields) {
    return res.status(400).json({ success: false, error: 'Tipo de reporte inválido' });
  }
  res.json({ success: true, data: fields });
});

// ============================================
// GENERACIÓN DE REPORTES PARAMETRIZABLES
// ============================================

router.post('/generate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      reportType, 
      subtype, 
      startDate, 
      endDate, 
      fields, 
      filters,
      groupBy,
      sortBy,
      sortOrder = 'desc'
    } = req.body;

    if (!reportType) {
      return res.status(400).json({ success: false, error: 'Tipo de reporte requerido' });
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const hasDateFilter = startDate || endDate;

    let data: any[] = [];
    let summary: any = {};

    switch (reportType) {
      case 'inventory':
        data = await generateInventoryReport(prisma, subtype, dateFilter, hasDateFilter, filters);
        break;
      case 'kits':
        data = await generateKitsReport(prisma, subtype, filters);
        break;
      case 'beneficiaries':
        data = await generateBeneficiariesReport(prisma, subtype, dateFilter, hasDateFilter, filters);
        break;
      case 'requests':
        data = await generateRequestsReport(prisma, subtype, dateFilter, hasDateFilter, filters);
        break;
      case 'deliveries':
        data = await generateDeliveriesReport(prisma, subtype, dateFilter, hasDateFilter, filters);
        break;
      case 'authorizations':
        data = await generateAuthorizationsReport(prisma, subtype, dateFilter, hasDateFilter, filters);
        break;
      case 'returns':
        data = await generateReturnsReport(prisma, subtype, dateFilter, hasDateFilter, filters);
        break;
      default:
        return res.status(400).json({ success: false, error: 'Tipo de reporte no soportado' });
    }

    // Filtrar campos si se especifican (excepto para subtipos especiales que deben mostrar todo)
    const noFilterSubtypes = ['historico_eliminaciones', 'movimientos', 'trazabilidad', 'cancelaciones'];
    if (fields && fields.length > 0 && !noFilterSubtypes.includes(subtype)) {
      data = data.map(row => {
        const filtered: any = {};
        fields.forEach((field: string) => {
          if (row.hasOwnProperty(field)) {
            filtered[field] = row[field];
          }
        });
        return filtered;
      });
    }

    // Ordenar si se especifica
    if (sortBy && data.length > 0) {
      data.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
    }

    // Generar resumen
    summary = {
      totalRecords: data.length,
      generatedAt: new Date().toISOString(),
      filters: { reportType, subtype, startDate, endDate, ...filters }
    };

    res.json({ success: true, data, summary });
  } catch (error) {
    next(error);
  }
});

// ============================================
// FUNCIONES DE GENERACIÓN POR TIPO
// ============================================

async function generateInventoryReport(prisma: PrismaClient, subtype: string, dateFilter: any, hasDateFilter: boolean, filters: any) {
  switch (subtype) {
    case 'stock_actual':
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          categoryId: filters?.categoryId || undefined
        },
        include: {
          category: true,
          lots: { where: { isActive: true } }
        },
        orderBy: { name: 'asc' }
      });
      return products.map(p => ({
        code: p.code,
        name: p.name,
        category: p.category.name,
        stock: p.lots.reduce((sum, l) => sum + l.quantity, 0),
        minStock: p.minStock,
        unit: p.unit,
        isPerishable: p.isPerishable ? 'Sí' : 'No',
        status: p.lots.reduce((sum, l) => sum + l.quantity, 0) <= p.minStock ? 'BAJO' : 'OK'
      }));

    case 'movimientos':
      const movements = await prisma.stockMovement.findMany({
        where: {
          createdAt: hasDateFilter ? dateFilter : undefined,
          type: filters?.type || undefined
        },
        include: {
          product: { include: { category: true } },
          lot: true,
          user: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return movements.map(m => ({
        fecha: m.createdAt.toISOString().split('T')[0],
        hora: m.createdAt.toISOString().split('T')[1].substring(0, 5),
        code: m.product.code,
        name: m.product.name,
        category: m.product.category.name,
        lotNumber: m.lot?.lotNumber || '-',
        type: m.type,
        quantity: m.quantity,
        reason: m.reason || '-',
        reference: m.reference || '-',
        user: `${m.user.firstName} ${m.user.lastName}`
      }));

    case 'historico_eliminaciones':
      // Obtener movimientos de tipo EXIT que sean eliminaciones (reference empieza con ELIMINACION)
      const deletionMovements = await prisma.stockMovement.findMany({
        where: {
          createdAt: hasDateFilter ? dateFilter : undefined,
          reference: { startsWith: 'ELIMINACION' }
        },
        include: {
          product: { include: { category: true } },
          lot: true,
          user: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // También obtener lotes inactivos del auditLog
      const deletedLotAudits = await prisma.auditLog.findMany({
        where: {
          entity: 'ProductLot',
          action: 'DELETE',
          createdAt: hasDateFilter ? dateFilter : undefined
        },
        include: {
          user: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Combinar información de ambas fuentes
      const deletionRecords = deletionMovements.map(m => ({
        fecha: m.createdAt.toISOString().split('T')[0],
        hora: m.createdAt.toISOString().split('T')[1].substring(0, 5),
        productCode: m.product.code,
        productName: m.product.name,
        category: m.product.category.name,
        lotNumber: m.lot?.lotNumber || '-',
        quantityRemoved: Math.abs(m.quantity),
        reason: m.reason || 'Sin motivo especificado',
        user: `${m.user.firstName} ${m.user.lastName}`,
        source: 'Movimiento'
      }));

      // Añadir registros de auditoría que no estén en movimientos
      for (const audit of deletedLotAudits) {
        const oldValues = JSON.parse(audit.oldValues || '{}');
        const newValues = JSON.parse(audit.newValues || '{}');
        
        // Verificar si ya existe en deletionRecords
        const exists = deletionRecords.some(r => 
          r.lotNumber === oldValues.lotNumber && 
          new Date(r.fecha).toDateString() === audit.createdAt.toDateString()
        );
        
        if (!exists && oldValues.lotNumber) {
          // Obtener información del producto
          const product = await prisma.product.findUnique({
            where: { id: oldValues.productId },
            include: { category: true }
          });
          
          deletionRecords.push({
            fecha: audit.createdAt.toISOString().split('T')[0],
            hora: audit.createdAt.toISOString().split('T')[1].substring(0, 5),
            productCode: product?.code || '-',
            productName: product?.name || '-',
            category: product?.category?.name || '-',
            lotNumber: oldValues.lotNumber || '-',
            quantityRemoved: oldValues.quantity || 0,
            reason: newValues.reason || 'Sin motivo especificado',
            user: `${audit.user.firstName} ${audit.user.lastName}`,
            source: 'Auditoría'
          });
        }
      }

      // Ordenar por fecha descendente
      return deletionRecords.sort((a, b) => 
        new Date(b.fecha + ' ' + b.hora).getTime() - new Date(a.fecha + ' ' + a.hora).getTime()
      );

    case 'por_vencer':
      const daysAhead = filters?.days || 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      const expiringLots = await prisma.productLot.findMany({
        where: {
          isActive: true,
          quantity: { gt: 0 },
          expiryDate: {
            lte: futureDate,
            gte: new Date()
          }
        },
        include: {
          product: { include: { category: true } }
        },
        orderBy: { expiryDate: 'asc' }
      });
      return expiringLots.map(l => ({
        code: l.product.code,
        name: l.product.name,
        category: l.product.category.name,
        lotNumber: l.lotNumber,
        quantity: l.quantity,
        expiryDate: l.expiryDate?.toISOString().split('T')[0] || '-',
        daysToExpiry: l.expiryDate ? Math.ceil((l.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : '-'
      }));

    case 'bajo_stock':
      const lowStockProducts = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          lots: { where: { isActive: true } }
        }
      });
      return lowStockProducts
        .map(p => ({
          code: p.code,
          name: p.name,
          category: p.category.name,
          stock: p.lots.reduce((sum, l) => sum + l.quantity, 0),
          minStock: p.minStock,
          deficit: p.minStock - p.lots.reduce((sum, l) => sum + l.quantity, 0)
        }))
        .filter(p => p.stock <= p.minStock)
        .sort((a, b) => b.deficit - a.deficit);

    default:
      return [];
  }
}

async function generateKitsReport(prisma: PrismaClient, subtype: string, filters: any) {
  const kits = await prisma.kit.findMany({
    where: { isActive: filters?.includeInactive ? undefined : true },
    include: {
      kitProducts: {
        include: {
          product: {
            include: {
              lots: { where: { isActive: true } }
            }
          }
        }
      }
    }
  });

  switch (subtype) {
    case 'listado':
      return kits.map(k => ({
        code: k.code,
        name: k.name,
        description: k.description || '-',
        productCount: k.kitProducts.length,
        isActive: k.isActive ? 'Sí' : 'No'
      }));

    case 'disponibilidad':
      return kits.map(k => {
        const availability = k.kitProducts.map(kp => {
          const stock = kp.product.lots.reduce((sum, l) => sum + l.quantity, 0);
          return Math.floor(stock / kp.quantity);
        });
        const available = availability.length > 0 ? Math.min(...availability) : 0;
        return {
          code: k.code,
          name: k.name,
          available,
          products: k.kitProducts.map(kp => `${kp.product.name} (${kp.quantity})`).join(', ')
        };
      });

    case 'composicion':
      const result: any[] = [];
      kits.forEach(k => {
        k.kitProducts.forEach(kp => {
          result.push({
            kitCode: k.code,
            kitName: k.name,
            productCode: kp.product.code,
            productName: kp.product.name,
            quantityPerKit: kp.quantity,
            stockAvailable: kp.product.lots.reduce((sum, l) => sum + l.quantity, 0)
          });
        });
      });
      return result;

    default:
      return [];
  }
}

async function generateBeneficiariesReport(prisma: PrismaClient, subtype: string, dateFilter: any, hasDateFilter: boolean, filters: any) {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: {
      isActive: filters?.includeInactive ? undefined : true,
      city: filters?.city || undefined,
      populationType: filters?.populationType || undefined
    },
    include: {
      requests: {
        where: hasDateFilter ? { requestDate: dateFilter } : undefined,
        include: { deliveries: true }
      }
    }
  });

  switch (subtype) {
    case 'listado':
      return beneficiaries.map(b => ({
        documentType: b.documentType,
        documentNumber: b.documentNumber,
        firstName: b.firstName,
        lastName: b.lastName,
        phone: b.phone || '-',
        address: b.address || '-',
        city: b.city || '-',
        familySize: b.familySize,
        populationType: b.populationType || '-',
        requestCount: b.requests.length
      }));

    case 'por_ubicacion':
      const byCity: Record<string, any[]> = {};
      beneficiaries.forEach(b => {
        const city = b.city || 'Sin Ciudad';
        if (!byCity[city]) byCity[city] = [];
        byCity[city].push({
          document: `${b.documentType}-${b.documentNumber}`,
          name: `${b.firstName} ${b.lastName}`,
          familySize: b.familySize,
          requests: b.requests.length
        });
      });
      const result: any[] = [];
      Object.entries(byCity).forEach(([city, items]) => {
        result.push({
          city,
          totalBeneficiaries: items.length,
          totalFamilyMembers: items.reduce((sum, i) => sum + i.familySize, 0),
          totalRequests: items.reduce((sum, i) => sum + i.requests, 0)
        });
      });
      return result.sort((a, b) => b.totalBeneficiaries - a.totalBeneficiaries);

    case 'historial_ayudas':
      return beneficiaries.map(b => ({
        document: `${b.documentType}-${b.documentNumber}`,
        name: `${b.firstName} ${b.lastName}`,
        totalRequests: b.requests.length,
        deliveredRequests: b.requests.filter((r: any) => r.deliveries.some((d: any) => d.status === 'DELIVERED')).length,
        pendingRequests: b.requests.filter((r: any) => !r.deliveries.some((d: any) => d.status === 'DELIVERED')).length
      }));

    default:
      return [];
  }
}

async function generateRequestsReport(prisma: PrismaClient, subtype: string, dateFilter: any, hasDateFilter: boolean, filters: any) {
  const requests = await prisma.request.findMany({
    where: {
      requestDate: hasDateFilter ? dateFilter : undefined,
      status: filters?.status || undefined,
      beneficiaryId: filters?.beneficiaryId || undefined
    },
    include: {
      beneficiary: true,
      requestProducts: { include: { product: true } },
      requestKits: { include: { kit: true } },
      deliveries: true,
      createdBy: { select: { firstName: true, lastName: true } }
    },
    orderBy: { requestDate: 'desc' }
  });

  switch (subtype) {
    case 'listado':
      return requests.map(r => ({
        code: r.code,
        requestDate: r.requestDate.toISOString().split('T')[0],
        beneficiary: `${r.beneficiary.firstName} ${r.beneficiary.lastName}`,
        document: `${r.beneficiary.documentType}-${r.beneficiary.documentNumber}`,
        status: r.status,
        priority: r.priority,
        products: r.requestProducts.map(p => `${p.product.name} (${p.quantityRequested})`).join(', ') || '-',
        kits: r.requestKits.map(k => `${k.kit.name} (${k.quantityRequested})`).join(', ') || '-',
        deliveries: r.deliveries.length,
        createdBy: `${r.createdBy.firstName} ${r.createdBy.lastName}`,
        notes: r.notes || '-'
      }));

    case 'por_estado':
      const byStatus: Record<string, number> = {};
      requests.forEach(r => {
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      });
      if (requests.length === 0) return [];
      return Object.entries(byStatus).map(([status, count]) => ({
        status,
        count,
        percentage: ((count / requests.length) * 100).toFixed(1) + '%'
      }));

    case 'pendientes':
      return requests
        .filter(r => ['REGISTERED', 'IN_REVIEW', 'APPROVED'].includes(r.status))
        .map(r => ({
          code: r.code,
          requestDate: r.requestDate.toISOString().split('T')[0],
          beneficiary: `${r.beneficiary.firstName} ${r.beneficiary.lastName}`,
          status: r.status,
          priority: r.priority,
          daysPending: Math.ceil((Date.now() - r.requestDate.getTime()) / (1000 * 60 * 60 * 24))
        }));

    default:
      return [];
  }
}

async function generateDeliveriesReport(prisma: PrismaClient, subtype: string, dateFilter: any, hasDateFilter: boolean, filters: any) {
  // Para cancelaciones, filtrar directamente en la query
  const statusFilter = subtype === 'cancelaciones' ? 'CANCELLED' : (filters?.status || undefined);
  
  const deliveries = await prisma.delivery.findMany({
    where: {
      createdAt: hasDateFilter ? dateFilter : undefined,
      status: statusFilter,
      authorizedById: filters?.authorizedById || undefined,
      deliveredById: filters?.deliveredById || undefined
    },
    include: {
      request: { include: { beneficiary: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      authorizedBy: { select: { firstName: true, lastName: true } },
      warehouseUser: { select: { firstName: true, lastName: true } },
      preparedBy: { select: { firstName: true, lastName: true } },
      deliveredBy: { select: { firstName: true, lastName: true } },
      deliveryDetails: { include: { product: true, kit: true } },
      history: { 
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  switch (subtype) {
    case 'listado':
      return deliveries.map(d => ({
        code: d.code,
        requestCode: d.request.code,
        beneficiary: `${d.request.beneficiary.firstName} ${d.request.beneficiary.lastName}`,
        status: d.status,
        createdAt: d.createdAt.toISOString().split('T')[0],
        authorizedBy: d.authorizedBy ? `${d.authorizedBy.firstName} ${d.authorizedBy.lastName}` : '-',
        authorizationDate: d.authorizationDate?.toISOString().split('T')[0] || '-',
        warehouseUser: d.warehouseUser ? `${d.warehouseUser.firstName} ${d.warehouseUser.lastName}` : '-',
        preparedBy: d.preparedBy ? `${d.preparedBy.firstName} ${d.preparedBy.lastName}` : '-',
        deliveredBy: d.deliveredBy ? `${d.deliveredBy.firstName} ${d.deliveredBy.lastName}` : '-',
        deliveryDate: d.deliveryDate?.toISOString().split('T')[0] || '-',
        receivedBy: d.receivedBy || '-',
        isPartial: d.isPartial ? 'Sí' : 'No'
      }));

    case 'por_estado':
      const byStatusD: Record<string, number> = {};
      deliveries.forEach(d => {
        byStatusD[d.status] = (byStatusD[d.status] || 0) + 1;
      });
      if (deliveries.length === 0) return [];
      return Object.entries(byStatusD).map(([status, count]) => ({
        status,
        count,
        percentage: ((count / deliveries.length) * 100).toFixed(1) + '%'
      }));

    case 'trazabilidad':
      return deliveries.map(d => ({
        code: d.code,
        beneficiary: `${d.request.beneficiary.firstName} ${d.request.beneficiary.lastName}`,
        status: d.status,
        paso1_creacion: d.createdAt.toISOString().split('T')[0],
        paso1_usuario: d.createdBy ? `${d.createdBy.firstName} ${d.createdBy.lastName}` : '-',
        paso2_autorizacion: d.authorizationDate?.toISOString().split('T')[0] || 'Pendiente',
        paso2_usuario: d.authorizedBy ? `${d.authorizedBy.firstName} ${d.authorizedBy.lastName}` : '-',
        paso3_bodega: d.warehouseReceivedDate?.toISOString().split('T')[0] || 'Pendiente',
        paso3_usuario: d.warehouseUser ? `${d.warehouseUser.firstName} ${d.warehouseUser.lastName}` : '-',
        paso4_preparacion: d.preparationDate?.toISOString().split('T')[0] || 'Pendiente',
        paso4_usuario: d.preparedBy ? `${d.preparedBy.firstName} ${d.preparedBy.lastName}` : '-',
        paso5_entrega: d.deliveryDate?.toISOString().split('T')[0] || 'Pendiente',
        paso5_usuario: d.deliveredBy ? `${d.deliveredBy.firstName} ${d.deliveredBy.lastName}` : '-'
      }));

    case 'cancelaciones':
      // Las entregas ya vienen filtradas por CANCELLED desde la query
      return deliveries.map(d => {
        // Buscar el registro de historial donde se canceló
        const cancellationHistory = d.history.find((h: any) => h.toStatus === 'CANCELLED');
        const previousStatus = cancellationHistory?.fromStatus || '-';
        const cancellationDate = cancellationHistory?.createdAt;
        const cancelledByUser = cancellationHistory?.user;
        const cancellationNotes = cancellationHistory?.notes || d.notes || 'Sin motivo especificado';
        
        // Obtener productos y kits
        const items = d.deliveryDetails.map((dd: any) => {
          if (dd.product) {
            return `${dd.product.name} (${dd.quantity})`;
          } else if (dd.kit) {
            return `Kit: ${dd.kit.name} (${dd.quantity})`;
          }
          return '';
        }).filter(Boolean).join(', ') || '-';

        return {
          code: d.code,
          requestCode: d.request.code,
          beneficiary: `${d.request.beneficiary.firstName} ${d.request.beneficiary.lastName}`,
          document: `${d.request.beneficiary.documentType}-${d.request.beneficiary.documentNumber}`,
          estadoAnterior: previousStatus,
          fechaCancelacion: cancellationDate ? cancellationDate.toISOString().split('T')[0] : '-',
          horaCancelacion: cancellationDate ? cancellationDate.toISOString().split('T')[1].substring(0, 5) : '-',
          canceladoPor: cancelledByUser ? `${cancelledByUser.firstName} ${cancelledByUser.lastName}` : '-',
          motivoCancelacion: cancellationNotes,
          productos: items,
          fechaCreacion: d.createdAt.toISOString().split('T')[0],
          creadoPor: d.createdBy ? `${d.createdBy.firstName} ${d.createdBy.lastName}` : '-',
          autorizadoPor: d.authorizedBy ? `${d.authorizedBy.firstName} ${d.authorizedBy.lastName}` : '-',
          fechaAutorizacion: d.authorizationDate?.toISOString().split('T')[0] || '-',
          notasAutorizacion: d.authorizationNotes || '-'
        };
      });

    default:
      return [];
  }
}

async function generateAuthorizationsReport(prisma: PrismaClient, subtype: string, dateFilter: any, hasDateFilter: boolean, filters: any) {
  const deliveries = await prisma.delivery.findMany({
    where: {
      authorizationDate: hasDateFilter ? dateFilter : { not: null },
      authorizedById: filters?.authorizedById || undefined
    },
    include: {
      request: { include: { beneficiary: true } },
      authorizedBy: { select: { firstName: true, lastName: true } }
    },
    orderBy: { authorizationDate: 'desc' }
  });

  switch (subtype) {
    case 'listado':
      return deliveries.map(d => ({
        deliveryCode: d.code,
        requestCode: d.request.code,
        beneficiary: `${d.request.beneficiary.firstName} ${d.request.beneficiary.lastName}`,
        authorizedBy: d.authorizedBy ? `${d.authorizedBy.firstName} ${d.authorizedBy.lastName}` : '-',
        authorizationDate: d.authorizationDate?.toISOString().split('T')[0] || '-',
        authorizationNotes: d.authorizationNotes || '-',
        isPartialAuth: d.isPartialAuth ? 'Sí' : 'No',
        responseTime: d.authorizationDate && d.createdAt 
          ? Math.round((d.authorizationDate.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60)) 
          : '-'
      }));

    case 'por_autorizador':
      const byAuthorizer: Record<string, { count: number; avgTime: number; times: number[] }> = {};
      deliveries.forEach(d => {
        if (d.authorizedBy) {
          const name = `${d.authorizedBy.firstName} ${d.authorizedBy.lastName}`;
          if (!byAuthorizer[name]) byAuthorizer[name] = { count: 0, avgTime: 0, times: [] };
          byAuthorizer[name].count++;
          if (d.authorizationDate && d.createdAt) {
            const hours = (d.authorizationDate.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
            byAuthorizer[name].times.push(hours);
          }
        }
      });
      return Object.entries(byAuthorizer).map(([name, data]) => ({
        authorizer: name,
        totalAuthorizations: data.count,
        avgResponseTimeHours: data.times.length > 0 
          ? (data.times.reduce((a, b) => a + b, 0) / data.times.length).toFixed(1) 
          : '-'
      }));

    case 'tiempos':
      const times = deliveries
        .filter(d => d.authorizationDate && d.createdAt)
        .map(d => ({
          deliveryCode: d.code,
          createdAt: d.createdAt.toISOString(),
          authorizedAt: d.authorizationDate!.toISOString(),
          responseTimeHours: Math.round((d.authorizationDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60))
        }));
      return times.sort((a, b) => b.responseTimeHours - a.responseTimeHours);

    default:
      return [];
  }
}

async function generateReturnsReport(prisma: PrismaClient, subtype: string, dateFilter: any, hasDateFilter: boolean, filters: any) {
  const returns = await prisma.return.findMany({
    where: {
      returnDate: hasDateFilter ? dateFilter : undefined,
      reason: filters?.reason || undefined
    },
    include: {
      delivery: { include: { request: { include: { beneficiary: true } } } },
      processedBy: { select: { firstName: true, lastName: true } },
      returnDetails: { include: { product: true } }
    },
    orderBy: { returnDate: 'desc' }
  });

  switch (subtype) {
    case 'listado':
      return returns.map(r => ({
        id: r.id.substring(0, 8),
        deliveryCode: r.delivery.code,
        returnDate: r.returnDate.toISOString().split('T')[0],
        reason: r.reason,
        products: r.returnDetails.map(rd => `${rd.product.name} (${rd.quantity})`).join(', '),
        condition: r.returnDetails.map(rd => rd.condition).join(', '),
        processedBy: `${r.processedBy.firstName} ${r.processedBy.lastName}`,
        notes: r.notes || '-'
      }));

    case 'por_motivo':
      const byReason: Record<string, number> = {};
      returns.forEach(r => {
        byReason[r.reason] = (byReason[r.reason] || 0) + 1;
      });
      if (returns.length === 0) return [];
      return Object.entries(byReason).map(([reason, count]) => ({
        reason,
        count,
        percentage: ((count / returns.length) * 100).toFixed(1) + '%'
      }));

    case 'por_producto':
      const byProduct: Record<string, { count: number; quantity: number }> = {};
      returns.forEach(r => {
        r.returnDetails.forEach(rd => {
          const name = rd.product.name;
          if (!byProduct[name]) byProduct[name] = { count: 0, quantity: 0 };
          byProduct[name].count++;
          byProduct[name].quantity += rd.quantity;
        });
      });
      return Object.entries(byProduct)
        .map(([product, data]) => ({
          product,
          returnCount: data.count,
          totalQuantity: data.quantity
        }))
        .sort((a, b) => b.returnCount - a.returnCount);

    default:
      return [];
  }
}

// ============================================
// EXPORTACIÓN A EXCEL
// ============================================

router.post('/export/excel', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { reportType, subtype, startDate, endDate, filters, data: providedData } = req.body;

    let data = providedData;
    
    // Si no se proporcionan datos, generarlos
    if (!data || data.length === 0) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      const hasDateFilter = startDate || endDate;

      switch (reportType) {
        case 'inventory':
          data = await generateInventoryReport(prisma, subtype || 'stock_actual', dateFilter, hasDateFilter, filters);
          break;
        case 'kits':
          data = await generateKitsReport(prisma, subtype || 'listado', filters);
          break;
        case 'beneficiaries':
          data = await generateBeneficiariesReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        case 'requests':
          data = await generateRequestsReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        case 'deliveries':
          data = await generateDeliveriesReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        case 'authorizations':
          data = await generateAuthorizationsReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        case 'returns':
          data = await generateReturnsReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        default:
          return res.status(400).json({ success: false, error: 'Tipo de reporte inválido' });
      }
    }

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    let worksheet;
    
    if (!data || data.length === 0) {
      // Crear hoja vacía con mensaje
      worksheet = XLSX.utils.aoa_to_sheet([
        ['No hay datos disponibles para este reporte'],
        [''],
        ['Tipo de Reporte:', reportType || '-'],
        ['Subtipo:', subtype || '-'],
        ['Fecha Inicio:', startDate || '-'],
        ['Fecha Fin:', endDate || '-'],
        ['Generado:', new Date().toISOString()]
      ]);
    } else {
      worksheet = XLSX.utils.json_to_sheet(data);
      
      // Ajustar ancho de columnas
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, ...data.map((row: any) => String(row[key] || '').length)) + 2
      }));
      worksheet['!cols'] = colWidths;
    }

    const sheetName = REPORT_TYPES[reportType as keyof typeof REPORT_TYPES]?.name || 'Reporte';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// ============================================
// EXPORTACIÓN A PDF
// ============================================

router.post('/export/pdf', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { reportType, subtype, startDate, endDate, filters, data: providedData, title } = req.body;

    let data = providedData;
    
    // Si no se proporcionan datos, generarlos
    if (!data || data.length === 0) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      const hasDateFilter = startDate || endDate;

      switch (reportType) {
        case 'inventory':
          data = await generateInventoryReport(prisma, subtype || 'stock_actual', dateFilter, hasDateFilter, filters);
          break;
        case 'kits':
          data = await generateKitsReport(prisma, subtype || 'listado', filters);
          break;
        case 'beneficiaries':
          data = await generateBeneficiariesReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        case 'requests':
          data = await generateRequestsReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        case 'deliveries':
          data = await generateDeliveriesReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        case 'authorizations':
          data = await generateAuthorizationsReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
        case 'returns':
          data = await generateReturnsReport(prisma, subtype || 'listado', dateFilter, hasDateFilter, filters);
          break;
      }
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);
    });

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('SIGAH - Sistema de Gestión de Ayudas Humanitarias', { align: 'center' });
    doc.moveDown(0.5);
    
    const reportTitle = title || REPORT_TYPES[reportType as keyof typeof REPORT_TYPES]?.name || 'Reporte';
    doc.fontSize(14).text(reportTitle, { align: 'center' });
    doc.moveDown(0.3);

    if (startDate || endDate) {
      doc.fontSize(10).font('Helvetica').text(`Período: ${startDate || 'Inicio'} - ${endDate || 'Actual'}`, { align: 'center' });
    }
    doc.fontSize(9).text(`Generado: ${new Date().toLocaleString('es-ES')}`, { align: 'center' });
    doc.moveDown(1);

    // Datos
    if (data && data.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text(`Total de registros: ${data.length}`);
      doc.moveDown(0.5);

      // Configuración de tabla
      const keys = Object.keys(data[0]);
      const maxCols = Math.min(keys.length, 12);
      const tableWidth = doc.page.width - 80;
      const startX = 40;
      let currentY = doc.y;

      // Campos que necesitan más espacio (textos largos)
      const wideFields = ['motivocancelacion', 'motivo', 'notas', 'productos', 'reason', 'notes', 'description', 'notasautorizacion'];
      
      // Calcular anchos de columna dinámicamente
      const selectedKeys = keys.slice(0, maxCols);
      const colWidths = selectedKeys.map(key => {
        const isWide = wideFields.some(f => key.toLowerCase().includes(f));
        return isWide ? 2.5 : 1; // Campos anchos obtienen 2.5x el espacio
      });
      const totalWeight = colWidths.reduce((a, b) => a + b, 0);
      const normalizedWidths = colWidths.map(w => (w / totalWeight) * tableWidth);

      // Función para calcular altura de fila basada en contenido
      const calculateRowHeight = (rowData: string[], isHeader: boolean): number => {
        if (isHeader) return 22;
        
        let maxLines = 1;
        rowData.forEach((cell, i) => {
          const width = normalizedWidths[i] - 6;
          const text = String(cell || '-');
          const avgCharWidth = 4; // Aproximación
          const charsPerLine = Math.floor(width / avgCharWidth);
          const lines = Math.ceil(text.length / charsPerLine);
          maxLines = Math.max(maxLines, Math.min(lines, 4)); // Máximo 4 líneas
        });
        return Math.max(18, maxLines * 10 + 8);
      };

      // Función para dibujar una fila
      const drawRow = (rowData: string[], y: number, isHeader: boolean = false) => {
        const height = calculateRowHeight(rowData, isHeader);
        
        // Fondo de la fila
        if (isHeader) {
          doc.rect(startX, y, tableWidth, height).fill('#e5e7eb');
        }
        
        // Bordes y texto
        let currentX = startX;
        rowData.forEach((cell, i) => {
          const colWidth = normalizedWidths[i];
          
          // Borde de celda
          doc.rect(currentX, y, colWidth, height).stroke('#9ca3af');
          
          // Texto
          doc.fillColor('#000000')
             .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
             .fontSize(isHeader ? 8 : 7);
          
          const textY = y + 4;
          const cellText = String(cell || '-');
          const isWideField = wideFields.some(f => selectedKeys[i]?.toLowerCase().includes(f));
          
          doc.text(cellText, currentX + 3, textY, { 
            width: colWidth - 6, 
            height: height - 6,
            ellipsis: !isWideField,
            lineBreak: isWideField
          });
          
          currentX += colWidth;
        });
        
        return y + height;
      };

      // Dibujar encabezados con nombres legibles
      const headerNames: Record<string, string> = {
        'code': 'Código',
        'requestCode': 'Solicitud',
        'beneficiary': 'Beneficiario',
        'document': 'Documento',
        'estadoAnterior': 'Estado Ant.',
        'fechaCancelacion': 'Fecha Cancel.',
        'horaCancelacion': 'Hora',
        'canceladoPor': 'Cancelado Por',
        'motivoCancelacion': 'Motivo de Cancelación',
        'productos': 'Productos/Kits',
        'fechaCreacion': 'Creación',
        'creadoPor': 'Creado Por',
        'autorizadoPor': 'Autorizado Por',
        'fechaAutorizacion': 'Fecha Autoriz.',
        'notasAutorizacion': 'Notas'
      };
      const headers = selectedKeys.map(k => headerNames[k] || k.substring(0, 15));
      currentY = drawRow(headers, currentY, true);

      // Dibujar filas de datos
      const maxRows = 100;
      data.slice(0, maxRows).forEach((row: any) => {
        const rowValues = selectedKeys.map(key => String(row[key] ?? '-'));
        const rowHeight = calculateRowHeight(rowValues, false);
        
        // Nueva página si es necesario
        if (currentY + rowHeight > doc.page.height - 60) {
          doc.addPage();
          currentY = 40;
          // Repetir encabezados en nueva página
          currentY = drawRow(headers, currentY, true);
        }
        
        currentY = drawRow(rowValues, currentY, false);
      });

      if (data.length > maxRows) {
        doc.y = currentY + 10;
        doc.fontSize(9).text(`... y ${data.length - maxRows} registros más. Exporte a Excel para ver todos.`, { align: 'center' });
      }
    } else {
      doc.fontSize(12).text('No hay datos para mostrar', { align: 'center' });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
});

// ============================================
// VISTA RÁPIDA / DASHBOARD DE REPORTES
// ============================================

router.get('/quick/:reportType', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { reportType } = req.params;

    let quickData: any = {};

    switch (reportType) {
      case 'inventory':
        const products = await prisma.product.findMany({
          where: { isActive: true },
          include: { lots: { where: { isActive: true } } }
        });
        const totalStock = products.reduce((sum, p) => sum + p.lots.reduce((s, l) => s + l.quantity, 0), 0);
        const lowStock = products.filter(p => p.lots.reduce((s, l) => s + l.quantity, 0) <= p.minStock).length;
        
        const expiringCount = await prisma.productLot.count({
          where: {
            isActive: true,
            quantity: { gt: 0 },
            expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() }
          }
        });

        quickData = {
          totalProducts: products.length,
          totalStock,
          lowStockProducts: lowStock,
          expiringIn30Days: expiringCount
        };
        break;

      case 'requests':
        const requestStats = await prisma.request.groupBy({
          by: ['status'],
          _count: true
        });
        quickData = {
          byStatus: requestStats.reduce((acc, r) => ({ ...acc, [r.status]: r._count }), {}),
          total: requestStats.reduce((sum, r) => sum + r._count, 0)
        };
        break;

      case 'deliveries':
        const deliveryStats = await prisma.delivery.groupBy({
          by: ['status'],
          _count: true
        });
        quickData = {
          byStatus: deliveryStats.reduce((acc, d) => ({ ...acc, [d.status]: d._count }), {}),
          total: deliveryStats.reduce((sum, d) => sum + d._count, 0)
        };
        break;

      case 'beneficiaries':
        const totalBeneficiaries = await prisma.beneficiary.count({ where: { isActive: true } });
        const withRequests = await prisma.beneficiary.count({
          where: { isActive: true, requests: { some: {} } }
        });
        quickData = {
          total: totalBeneficiaries,
          withRequests,
          withoutRequests: totalBeneficiaries - withRequests
        };
        break;

      case 'kits':
        const kits = await prisma.kit.findMany({
          where: { isActive: true },
          include: {
            kitProducts: {
              include: {
                product: { include: { lots: { where: { isActive: true } } } }
              }
            }
          }
        });
        const availableKits = kits.filter(k => {
          if (k.kitProducts.length === 0) return false;
          const availability = k.kitProducts.map(kp => {
            const stock = kp.product.lots.reduce((sum, l) => sum + l.quantity, 0);
            return Math.floor(stock / kp.quantity);
          });
          return Math.min(...availability) > 0;
        }).length;
        quickData = {
          total: kits.length,
          available: availableKits,
          unavailable: kits.length - availableKits
        };
        break;

      case 'authorizations':
        const pendingAuth = await prisma.delivery.count({
          where: { status: 'PENDING_AUTHORIZATION' }
        });
        const authorizedToday = await prisma.delivery.count({
          where: {
            authorizationDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        });
        const totalAuthorized = await prisma.delivery.count({
          where: { authorizationDate: { not: null } }
        });
        quickData = {
          pending: pendingAuth,
          authorizedToday,
          totalAuthorized
        };
        break;

      case 'returns':
        const totalReturns = await prisma.return.count();
        const returnsThisMonth = await prisma.return.count({
          where: {
            returnDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        });
        quickData = {
          total: totalReturns,
          thisMonth: returnsThisMonth
        };
        break;

      default:
        // Para tipos no soportados, devolver datos vacíos en lugar de error
        quickData = { message: 'Estadísticas rápidas no disponibles para este tipo' };
    }

    res.json({ success: true, data: quickData });
  } catch (error) {
    next(error);
  }
});

export default router;
