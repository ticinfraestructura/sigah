/**
 * Servicio de Logs Estructurados
 * 
 * Proporciona logging centralizado con Winston
 * - Logs en formato JSON para producción
 * - Logs coloridos para desarrollo
 * - Rotación diaria de archivos
 * - Niveles: error, warn, info, http, debug
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Directorio de logs
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Formato personalizado para desarrollo
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Formato JSON para producción
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transporte para errores (archivo rotativo)
const errorTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: prodFormat
});

// Transporte para todos los logs (archivo rotativo)
const combinedTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: prodFormat
});

// Transporte para HTTP requests
const httpTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '20m',
  maxFiles: '7d',
  format: prodFormat
});

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'sigah-backend' },
  transports: [
    errorTransport,
    combinedTransport,
    httpTransport
  ]
});

// En desarrollo, agregar consola con colores
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: devFormat,
    level: 'debug'
  }));
}

// ============ HELPERS ============

/**
 * Log de request HTTP
 */
export const logHttp = (req: any, res: any, responseTime: number) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

/**
 * Log de error con contexto
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
};

/**
 * Log de seguridad
 */
export const logSecurity = (event: string, details: Record<string, any>) => {
  logger.warn(`[SECURITY] ${event}`, {
    type: 'security',
    ...details
  });
};

/**
 * Log de auditoría
 */
export const logAudit = (action: string, details: Record<string, any>) => {
  logger.info(`[AUDIT] ${action}`, {
    type: 'audit',
    ...details
  });
};

/**
 * Log de performance
 */
export const logPerformance = (operation: string, duration: number, details?: Record<string, any>) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level](`[PERF] ${operation}`, {
    type: 'performance',
    duration: `${duration}ms`,
    ...details
  });
};

/**
 * Log de base de datos
 */
export const logDatabase = (query: string, duration: number) => {
  if (duration > 500) {
    logger.warn('[DB] Slow query', { query: query.substring(0, 200), duration: `${duration}ms` });
  } else {
    logger.debug('[DB] Query', { query: query.substring(0, 100), duration: `${duration}ms` });
  }
};

export default logger;
