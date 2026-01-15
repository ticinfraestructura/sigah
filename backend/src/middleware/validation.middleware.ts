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

// ============ MIDDLEWARE DE VALIDACIÓN ZOD ============

export const validateZod = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.issues.map((e: z.ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};
