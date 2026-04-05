/**
 * Middleware de Validación de Entrada
 * 
 * Proporciona validación robusta para todos los endpoints de la API
 * Previene: SQL Injection, XSS, datos malformados
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { z } from 'zod';

// ============ HELPER FUNCTIONS ============

/**
 * Middleware que ejecuta las validaciones y retorna errores si existen
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ejecutar todas las validaciones
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    });
  };
};

/**
 * Sanitizar string para prevenir XSS
 */
const sanitizeString = (value: string): string => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// ============ VALIDACIONES COMUNES ============

export const commonValidations = {
  // UUID válido
  uuid: (field: string) => 
    param(field)
      .isUUID()
      .withMessage(`${field} debe ser un UUID válido`),

  // Paginación
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un número entero positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit debe ser entre 1 y 100')
  ],

  // Búsqueda
  search: query('search')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('búsqueda máximo 100 caracteres')
    .customSanitizer(sanitizeString)
};

// ============ VALIDACIONES DE AUTENTICACIÓN ============

export const authValidations = {
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('password')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Contraseña requerida')
  ],

  changePassword: [
    body('currentPassword')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Contraseña actual requerida'),
    body('newPassword')
      .isString()
      .isLength({ min: 8 })
      .withMessage('Nueva contraseña debe tener al menos 8 caracteres')
      .matches(/[A-Z]/)
      .withMessage('Debe contener al menos una mayúscula')
      .matches(/[a-z]/)
      .withMessage('Debe contener al menos una minúscula')
      .matches(/\d/)
      .withMessage('Debe contener al menos un número')
  ]
};

// ============ VALIDACIONES DE PRODUCTOS ============

export const productValidations = {
  create: [
    body('code')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Código debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage('Código solo puede contener letras, números, guiones y guiones bajos'),
    body('name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nombre debe tener entre 2 y 100 caracteres')
      .customSanitizer(sanitizeString),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Descripción máximo 500 caracteres')
      .customSanitizer(sanitizeString),
    body('categoryId')
      .isUUID()
      .withMessage('Categoría inválida'),
    body('unit')
      .isString()
      .isLength({ min: 1, max: 20 })
      .withMessage('Unidad requerida'),
    body('minStock')
      .isInt({ min: 0 })
      .withMessage('Stock mínimo debe ser un número positivo'),
    body('isPerishable')
      .isBoolean()
      .withMessage('isPerishable debe ser booleano')
  ],

  update: [
    param('id').isUUID().withMessage('ID inválido'),
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .customSanitizer(sanitizeString),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .customSanitizer(sanitizeString),
    body('minStock')
      .optional()
      .isInt({ min: 0 })
  ],

  addLot: [
    param('id').isUUID().withMessage('ID de producto inválido'),
    body('lotNumber')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Número de lote requerido'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Cantidad debe ser mayor a 0'),
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Fecha de vencimiento inválida')
  ]
};

// ============ VALIDACIONES DE BENEFICIARIOS ============

export const beneficiaryValidations = {
  create: [
    body('documentType')
      .isIn(['CC', 'TI', 'CE', 'PA', 'RC', 'NIT'])
      .withMessage('Tipo de documento inválido'),
    body('documentNumber')
      .isString()
      .trim()
      .isLength({ min: 5, max: 20 })
      .withMessage('Número de documento debe tener entre 5 y 20 caracteres')
      .matches(/^[a-zA-Z0-9-]+$/)
      .withMessage('Número de documento solo puede contener letras, números y guiones'),
    body('firstName')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nombre debe tener entre 2 y 50 caracteres')
      .customSanitizer(sanitizeString),
    body('lastName')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Apellido debe tener entre 2 y 50 caracteres')
      .customSanitizer(sanitizeString),
    body('phone')
      .optional()
      .isString()
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Teléfono inválido'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('address')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .customSanitizer(sanitizeString),
    body('populationType')
      .optional()
      .isString()
      .isLength({ max: 50 })
  ],

  update: [
    param('id').isUUID().withMessage('ID inválido'),
    body('firstName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .customSanitizer(sanitizeString),
    body('lastName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .customSanitizer(sanitizeString),
    body('phone')
      .optional()
      .matches(/^[0-9+\-\s()]+$/)
  ]
};

// ============ VALIDACIONES DE SOLICITUDES ============

export const requestValidations = {
  create: [
    body('beneficiaryId')
      .isUUID()
      .withMessage('Beneficiario inválido'),
    body('products')
      .optional()
      .isArray()
      .withMessage('products debe ser un array'),
    body('products.*.productId')
      .optional()
      .isUUID()
      .withMessage('ID de producto inválido'),
    body('products.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Cantidad debe ser mayor a 0'),
    body('kits')
      .optional()
      .isArray()
      .withMessage('kits debe ser un array'),
    body('kits.*.kitId')
      .optional()
      .isUUID()
      .withMessage('ID de kit inválido'),
    body('kits.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Cantidad debe ser mayor a 0'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .customSanitizer(sanitizeString)
  ],

  updateStatus: [
    param('id').isUUID().withMessage('ID inválido'),
    body('status')
      .isIn(['REGISTERED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED'])
      .withMessage('Estado inválido'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .customSanitizer(sanitizeString)
  ]
};

// ============ VALIDACIONES DE ENTREGAS ============

export const deliveryValidations = {
  create: [
    body('requestId')
      .isUUID()
      .withMessage('Solicitud inválida'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Debe incluir al menos un item'),
    body('items.*.productId')
      .optional()
      .isUUID()
      .withMessage('ID de producto inválido'),
    body('items.*.kitId')
      .optional()
      .isUUID()
      .withMessage('ID de kit inválido'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Cantidad debe ser mayor a 0'),
    body('receivedBy')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nombre de quien recibe requerido')
      .customSanitizer(sanitizeString),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .customSanitizer(sanitizeString)
  ]
};

// ============ VALIDACIONES DE INVENTARIO ============

export const inventoryValidations = {
  adjustment: [
    body('productId')
      .isUUID()
      .withMessage('Producto inválido'),
    body('lotId')
      .optional()
      .isUUID()
      .withMessage('Lote inválido'),
    body('quantity')
      .isInt()
      .withMessage('Cantidad debe ser un número entero'),
    body('type')
      .isIn(['ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN'])
      .withMessage('Tipo de movimiento inválido'),
    body('reason')
      .isString()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Razón debe tener entre 5 y 200 caracteres')
      .customSanitizer(sanitizeString)
  ]
};

// ============ VALIDACIONES DE ROLES ============

export const roleValidations = {
  create: [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nombre debe tener entre 2 y 50 caracteres')
      .customSanitizer(sanitizeString),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .customSanitizer(sanitizeString),
    body('permissions')
      .isArray()
      .withMessage('permissions debe ser un array'),
    body('permissions.*.module')
      .isString()
      .withMessage('Módulo requerido'),
    body('permissions.*.action')
      .isString()
      .withMessage('Acción requerida')
  ],

  assign: [
    body('userId')
      .isUUID()
      .withMessage('Usuario inválido'),
    body('roleId')
      .isUUID()
      .withMessage('Rol inválido')
  ]
};

// ============ SCHEMAS ZOD PARA VALIDACIÓN COMPLEJA ============

export const schemas = {
  // Schema para configuración de entorno
  envConfig: z.object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional()
  }),

  // Schema para filtros de reporte
  reportFilters: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.array(z.string()).optional(),
    categoryId: z.string().uuid().optional(),
    beneficiaryId: z.string().uuid().optional()
  })
};

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const whatsappPhoneRegex = /^\+?\d{10,15}$/;

const normalizeOptionalText = (value: unknown) => {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const normalizePhoneInput = (value: unknown) => {
  const normalized = normalizeOptionalText(value);
  if (typeof normalized !== 'string') return normalized;
  return normalized.replace(/[\s\-\(\)]/g, '');
};

const optionalWhatsappPhoneSchema = z.preprocess(
  normalizePhoneInput,
  z
    .string()
    .regex(whatsappPhoneRegex, 'Celular inválido. Use formato internacional, por ejemplo +573001234567')
    .optional()
    .nullable()
);

const optionalApiKeySchema = z.preprocess(normalizeOptionalText, z.string().min(4).max(255).optional().nullable());

export const authZodSchemas = {
  login: z.object({
    email: z.string().email('Email inválido').trim().toLowerCase(),
    password: z.string().min(1, 'Contraseña requerida')
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z
      .string()
      .regex(
        strongPasswordRegex,
        'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial'
      )
  }),
  sessionParam: z.object({
    sessionId: z.string().min(1, 'sessionId requerido')
  })
};

export const userZodSchemas = {
  idParam: z.object({
    id: z.string().uuid('ID inválido')
  }),
  create: z.object({
    email: z.string().email('Email inválido').trim().toLowerCase(),
    password: z
      .string()
      .regex(
        strongPasswordRegex,
        'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial'
      ),
    firstName: z.string().trim().min(2, 'Nombre mínimo 2 caracteres').max(80, 'Nombre máximo 80 caracteres'),
    lastName: z.string().trim().min(2, 'Apellido mínimo 2 caracteres').max(80, 'Apellido máximo 80 caracteres'),
    phone: optionalWhatsappPhoneSchema,
    whatsappApiKey: optionalApiKeySchema,
    telegramChatId: z.preprocess(normalizeOptionalText, z.string().max(255).optional().nullable()),
    roleId: z.string().uuid('Rol inválido').optional().nullable()
  }),
  update: z
    .object({
      email: z.string().email('Email inválido').trim().toLowerCase().optional(),
      password: z
        .string()
        .regex(
          strongPasswordRegex,
          'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial'
        )
        .optional(),
      firstName: z.string().trim().min(2).max(80).optional(),
      lastName: z.string().trim().min(2).max(80).optional(),
      phone: optionalWhatsappPhoneSchema,
      whatsappApiKey: optionalApiKeySchema,
      telegramChatId: z.preprocess(normalizeOptionalText, z.string().max(255).optional().nullable()),
      roleId: z.string().uuid('Rol inválido').optional().nullable()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe enviar al menos un campo para actualizar'
    }),
  resetPassword: z.object({
    newPassword: z
      .string()
      .regex(
        strongPasswordRegex,
        'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial'
      )
  })
};

export const requestZodSchemas = {
  listQuery: z.object({
    status: z
      .enum(['REGISTERED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED'])
      .optional(),
    beneficiaryId: z.string().uuid('beneficiaryId inválido').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }),
  idParam: z.object({
    id: z.string().uuid('ID inválido')
  }),
  create: z
    .object({
      beneficiaryId: z.string().uuid('Beneficiario inválido'),
      products: z
        .array(
          z.object({
            productId: z.string().uuid('ID de producto inválido'),
            quantity: z.number().int().min(1, 'Cantidad debe ser mayor a 0')
          })
        )
        .optional(),
      kits: z
        .array(
          z.object({
            kitId: z.string().uuid('ID de kit inválido'),
            quantity: z.number().int().min(1, 'Cantidad debe ser mayor a 0')
          })
        )
        .optional(),
      priority: z.number().int().min(0).optional(),
      notes: z.string().trim().max(500).optional()
    })
    .refine((data) => {
      const hasProducts = (data.products?.length ?? 0) > 0;
      const hasKits = (data.kits?.length ?? 0) > 0;
      return hasProducts || hasKits;
    }, {
      message: 'Debe solicitar al menos un producto o kit',
      path: ['products']
    }),
  updateStatus: z.object({
    status: z.enum(['REGISTERED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED']),
    notes: z.string().trim().max(500).optional()
  }),
  update: z
    .object({
      products: z.array(
        z.object({
          productId: z.string().uuid('ID de producto inválido'),
          quantity: z.number().int().min(1, 'Cantidad debe ser mayor a 0')
        })
      ).optional(),
      kits: z.array(
        z.object({
          kitId: z.string().uuid('ID de kit inválido'),
          quantity: z.number().int().min(1, 'Cantidad debe ser mayor a 0')
        })
      ).optional(),
      priority: z.number().int().min(0).optional(),
      notes: z.string().trim().max(500).optional().nullable()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe enviar al menos un campo para actualizar'
    })
};

export const deliveryZodSchemas = {
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  listQuery: z.object({
    requestId: z.string().uuid('requestId inválido').optional(),
    status: z.enum(['PENDING_AUTHORIZATION', 'AUTHORIZED', 'RECEIVED_WAREHOUSE', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    warehouseUserId: z.string().uuid('warehouseUserId inválido').optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }),
  create: z
    .object({
      requestId: z.string().uuid('Solicitud inválida'),
      products: z.array(
        z.object({
          productId: z.string().uuid('Producto inválido'),
          quantity: z.number().int().min(1, 'Cantidad inválida')
        })
      ).optional(),
      kits: z.array(
        z.object({
          kitId: z.string().uuid('Kit inválido'),
          quantity: z.number().int().min(1, 'Cantidad inválida')
        })
      ).optional(),
      notes: z.string().trim().max(500).optional(),
      isPartial: z.boolean().optional()
    })
    .refine((data) => (data.products?.length ?? 0) > 0 || (data.kits?.length ?? 0) > 0, {
      message: 'Debe incluir al menos un producto o kit',
      path: ['products']
    }),
  authorize: z.object({
    notes: z.string().trim().max(500).optional(),
    isPartialAuth: z.boolean().optional(),
    authorizedQuantities: z.record(z.string(), z.number().int().min(0)).optional()
  }),
  notesOnly: z.object({
    notes: z.string().trim().max(500).optional()
  }),
  deliver: z.object({
    receivedBy: z.string().trim().min(2).max(120),
    receiverDocument: z.string().trim().min(3).max(30),
    receiverSignature: z.string().trim().max(5000).optional(),
    notes: z.string().trim().max(500).optional()
  }),
  cancel: z.object({
    reason: z.string().trim().min(3, 'Motivo de cancelación es requerido').max(500)
  })
};

const reportScalarSchema = z.union([
  z.string().trim().max(500),
  z.number(),
  z.boolean(),
  z.null()
]);

const reportFilterValueSchema = z.union([
  reportScalarSchema,
  z.array(reportScalarSchema).max(100)
]);

const reportFiltersSchema = z
  .record(z.string().trim().min(1).max(80), reportFilterValueSchema)
  .superRefine((value, ctx) => {
    if (Object.keys(value).length > 40) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Demasiados filtros. Máximo permitido: 40'
      });
    }
  });

const reportRowSchema = z
  .record(z.string().trim().min(1).max(120), z.union([reportScalarSchema, z.array(reportScalarSchema).max(50)]))
  .superRefine((value, ctx) => {
    if (Object.keys(value).length > 120) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Demasiadas columnas por fila. Máximo permitido: 120'
      });
    }
  });

const optionalReportDateSchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Fecha inválida');

export const reportZodSchemas = {
  reportTypeParam: z.object({
    reportType: z.enum(['inventory', 'kits', 'beneficiaries', 'requests', 'deliveries', 'authorizations', 'returns'])
  }),
  fieldsQuery: z.object({ subtype: z.string().trim().max(80).optional() }),
  generate: z.object({
    reportType: z.enum(['inventory', 'kits', 'beneficiaries', 'requests', 'deliveries', 'authorizations', 'returns']),
    subtype: z.string().trim().max(80).optional(),
    startDate: optionalReportDateSchema,
    endDate: optionalReportDateSchema,
    fields: z.array(z.string().trim().min(1).max(80)).max(120).optional(),
    filters: reportFiltersSchema.optional(),
    groupBy: z.string().trim().max(80).optional(),
    sortBy: z.string().trim().max(80).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }),
  exportExcel: z.object({
    reportType: z.enum(['inventory', 'kits', 'beneficiaries', 'requests', 'deliveries', 'authorizations', 'returns']),
    subtype: z.string().trim().max(80).optional(),
    startDate: optionalReportDateSchema,
    endDate: optionalReportDateSchema,
    filters: reportFiltersSchema.optional(),
    data: z.array(reportRowSchema).max(5000).optional()
  }),
  exportPdf: z.object({
    reportType: z.enum(['inventory', 'kits', 'beneficiaries', 'requests', 'deliveries', 'authorizations', 'returns']),
    subtype: z.string().trim().max(80).optional(),
    startDate: optionalReportDateSchema,
    endDate: optionalReportDateSchema,
    filters: reportFiltersSchema.optional(),
    data: z.array(reportRowSchema).max(5000).optional(),
    title: z.string().trim().max(160).optional()
  })
};

export const productZodSchemas = {
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  lotParams: z.object({
    id: z.string().uuid('ID de producto inválido'),
    lotId: z.string().uuid('ID de lote inválido')
  }),
  listQuery: z.object({
    categoryId: z.string().uuid('categoryId inválido').optional(),
    isPerishable: z.enum(['true', 'false']).optional(),
    search: z.string().trim().max(120).optional(),
    includeInactive: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }),
  movementsQuery: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }),
  create: z.object({
    code: z.string().trim().min(2).max(50),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    categoryId: z.string().uuid('Categoría inválida'),
    unit: z.string().trim().min(1).max(20).optional(),
    isPerishable: z.boolean().optional(),
    minStock: z.number().int().min(0).optional()
  }),
  update: z
    .object({
      code: z.string().trim().min(2).max(50).optional(),
      name: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().max(500).optional().nullable(),
      categoryId: z.string().uuid('Categoría inválida').optional(),
      unit: z.string().trim().min(1).max(20).optional(),
      isPerishable: z.boolean().optional(),
      minStock: z.number().int().min(0).optional(),
      isActive: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe enviar al menos un campo para actualizar'
    }),
  addLot: z.object({
    lotNumber: z.string().trim().min(1).max(50).optional(),
    quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
    expiryDate: z.string().optional(),
    reason: z.string().trim().max(255).optional()
  }),
  updateLot: z
    .object({
      lotNumber: z.string().trim().min(1).max(50).optional(),
      quantity: z.number().int().min(0, 'La cantidad no puede ser negativa').optional(),
      expiryDate: z.string().optional().nullable()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe enviar al menos un campo para actualizar lote'
    }),
  deleteLotBody: z.object({
    reason: z.string().trim().max(255).optional()
  })
};

export const beneficiaryZodSchemas = {
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  listQuery: z.object({
    search: z.string().trim().max(120).optional(),
    populationType: z.string().trim().max(50).optional(),
    includeInactive: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }),
  create: z.object({
    documentType: z.enum(['CC', 'TI', 'CE', 'PA', 'RC', 'NIT']),
    documentNumber: z.string().trim().min(5).max(20),
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().min(2).max(80),
    phone: z.string().trim().max(30).optional(),
    email: z.string().email('Email inválido').optional(),
    address: z.string().trim().max(200).optional(),
    city: z.string().trim().max(80).optional(),
    populationType: z.string().trim().max(50).optional(),
    familySize: z.number().int().min(1).optional(),
    notes: z.string().trim().max(500).optional()
  }),
  update: z
    .object({
      documentType: z.enum(['CC', 'TI', 'CE', 'PA', 'RC', 'NIT']).optional(),
      documentNumber: z.string().trim().min(5).max(20).optional(),
      firstName: z.string().trim().min(2).max(80).optional(),
      lastName: z.string().trim().min(2).max(80).optional(),
      phone: z.string().trim().max(30).optional().nullable(),
      email: z.string().email('Email inválido').optional().nullable(),
      address: z.string().trim().max(200).optional().nullable(),
      city: z.string().trim().max(80).optional().nullable(),
      populationType: z.string().trim().max(50).optional().nullable(),
      familySize: z.number().int().min(1).optional(),
      notes: z.string().trim().max(500).optional().nullable(),
      isActive: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe enviar al menos un campo para actualizar'
    }),
  searchByDocumentQuery: z.object({
    documentType: z.enum(['CC', 'TI', 'CE', 'PA', 'RC', 'NIT']),
    documentNumber: z.string().trim().min(5).max(20)
  })
};

export const roleZodSchemas = {
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  create: z.object({
    name: z.string().trim().min(2).max(50),
    description: z.string().trim().max(200).optional(),
    permissions: z.array(z.object({ module: z.string().trim().min(1), action: z.string().trim().min(1) })).optional()
  }),
  update: z
    .object({
      name: z.string().trim().min(2).max(50).optional(),
      description: z.string().trim().max(200).optional().nullable(),
      permissions: z.array(z.object({ module: z.string().trim().min(1), action: z.string().trim().min(1) })).optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe enviar al menos un campo para actualizar'
    }),
  assign: z.object({
    userId: z.string().uuid('Usuario inválido'),
    roleId: z.string().uuid('Rol inválido')
  })
};

export const returnZodSchemas = {
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  listQuery: z.object({
    deliveryId: z.string().uuid('deliveryId inválido').optional(),
    reason: z.string().trim().max(120).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }),
  create: z.object({
    deliveryId: z.string().uuid('Entrega inválida'),
    reason: z.string().trim().min(1).max(200),
    notes: z.string().trim().max(500).optional(),
    items: z.array(z.object({
      productId: z.string().uuid('Producto inválido'),
      quantity: z.number().int().positive('Cantidad inválida'),
      condition: z.string().trim().min(1),
      lotId: z.string().uuid('Lote inválido').optional()
    })).min(1, 'Debe incluir al menos un producto')
  })
};

export const categoryZodSchemas = {
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  listQuery: z.object({ includeInactive: z.enum(['true', 'false']).optional() }),
  create: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional()
  }),
  update: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(500).optional().nullable(),
      isActive: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo para actualizar' })
};

export const inventoryZodSchemas = {
  stockQuery: z.object({
    categoryId: z.string().uuid().optional(),
    isPerishable: z.enum(['true', 'false']).optional(),
    lowStock: z.enum(['true', 'false']).optional()
  }),
  movementQuery: z.object({
    productId: z.string().uuid().optional(),
    type: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }),
  expiringQuery: z.object({
    days: z.coerce.number().int().min(1).max(365).optional()
  }),
  adjustment: z.object({
    productId: z.string().uuid('Producto inválido'),
    lotId: z.string().uuid('Lote inválido'),
    quantity: z.number().int('Cantidad inválida'),
    reason: z.string().trim().min(3).max(255)
  }),
  entry: z.object({
    productId: z.string().uuid('Producto inválido'),
    quantity: z.number().int().positive('Cantidad inválida'),
    lotNumber: z.string().trim().max(50).optional(),
    expiryDate: z.string().optional(),
    reason: z.string().trim().max(255).optional()
  })
};

export const kitZodSchemas = {
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  listQuery: z.object({ includeInactive: z.enum(['true', 'false']).optional() }),
  availabilityQuery: z.object({ quantity: z.coerce.number().int().min(1).optional() }),
  historyQuery: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().trim().max(50).optional()
  }),
  create: z.object({
    code: z.string().trim().min(2).max(50),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    products: z.array(z.object({
      productId: z.string().uuid('Producto inválido'),
      quantity: z.number().int().positive('Cantidad inválida')
    })).min(1, 'El kit debe tener al menos un producto')
  }),
  update: z
    .object({
      code: z.string().trim().min(2).max(50).optional(),
      name: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().max(500).optional().nullable(),
      isActive: z.boolean().optional(),
      products: z.array(z.object({
        productId: z.string().uuid('Producto inválido'),
        quantity: z.number().int().positive('Cantidad inválida')
      })).optional()
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo para actualizar' })
};

export const notificationZodSchemas = {
  emptyQuery: z.object({}).strict(),
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  listQuery: z.object({
    channel: z.enum(['INTERNAL', 'WHATSAPP', 'TELEGRAM']).optional(),
    type: z.enum(['INFO', 'ALERT', 'DELIVERY', 'REQUEST', 'SYSTEM', 'REMINDER']).optional(),
    criticality: z.enum(['INFORMATIVE', 'LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional()
  }),
  send: z.object({
    receiverId: z.string().uuid('receiverId inválido'),
    type: z.enum(['INFO', 'ALERT', 'DELIVERY', 'REQUEST', 'SYSTEM', 'REMINDER']),
    criticality: z.enum(['INFORMATIVE', 'LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('NORMAL'),
    title: z.string().trim().min(2).max(160),
    message: z.string().trim().min(2).max(4000),
    sendWhatsApp: z.boolean().optional().default(true),
    referenceType: z.string().trim().max(50).optional(),
    referenceId: z.string().trim().max(100).optional(),
    actionUrl: z.string().url('actionUrl inválida').optional()
  }),
  sendBulk: z.object({
    receiverIds: z.array(z.string().uuid('receiverId inválido')).min(1).max(100),
    type: z.enum(['INFO', 'ALERT', 'DELIVERY', 'REQUEST', 'SYSTEM', 'REMINDER']),
    criticality: z.enum(['INFORMATIVE', 'LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('NORMAL'),
    title: z.string().trim().min(2).max(160),
    message: z.string().trim().min(2).max(4000),
    sendWhatsApp: z.boolean().optional().default(true)
  }),
  test: z.object({
    phone: z.string().trim().min(8).max(30)
  }),
  telegramTest: z.object({
    chatId: z.string().trim().min(3).max(64)
  }),
  setMode: z.object({
    mode: z.enum(['auto', 'simulated', 'real'])
  })
};

export const inAppNotificationZodSchemas = {
  idParam: z.object({ id: z.string().uuid('ID inválido') }),
  listQuery: z.object({
    unreadOnly: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional()
  })
};

export const dashboardZodSchemas = {
  chartsQuery: z.object({
    months: z.coerce.number().int().min(1).max(24).optional()
  }),
  activityQuery: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
};

export const backupZodSchemas = {
  nameParam: z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Nombre de backup inválido')
  })
};

export const auditZodSchemas = {
  entityParams: z.object({
    entity: z.string().trim().min(1).max(80),
    entityId: z.string().trim().min(1).max(120)
  }),
  searchQuery: z.object({
    entity: z.string().trim().max(80).optional(),
    entityId: z.string().trim().max(120).optional(),
    userId: z.string().uuid('userId inválido').optional(),
    action: z.string().trim().max(80).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional()
  }),
  statsQuery: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }),
  compareQuery: z.object({
    id1: z.string().trim().min(1),
    id2: z.string().trim().min(1)
  }),
  exportQuery: z.object({
    entity: z.string().trim().max(80).optional(),
    entityId: z.string().trim().max(120).optional(),
    userId: z.string().uuid('userId inválido').optional(),
    action: z.string().trim().max(80).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
};

// ============ MIDDLEWARE DE VALIDACIÓN ZOD ============

type ZodRequestSchemas = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

export const validateZodRequest = (requestSchemas: ZodRequestSchemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const details: { field: string; message: string }[] = [];

    const runValidation = (target: 'body' | 'params' | 'query', schema?: z.ZodTypeAny) => {
      if (!schema) return;

      const result = schema.safeParse(req[target]);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          details.push({
            field: [target, ...issue.path].join('.'),
            message: issue.message
          });
        });
        return;
      }

      (req as any)[target] = result.data;
    };

    runValidation('params', requestSchemas.params);
    runValidation('query', requestSchemas.query);
    runValidation('body', requestSchemas.body);

    if (details.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details
      });
    }

    next();
  };
};

export const validateZod = <T>(schema: z.ZodSchema<T>) => {
  return validateZodRequest({ body: schema });
};
