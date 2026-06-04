import winston from 'winston';
import path from 'path';

// Niveles de log
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Contexto de aplicación
export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  module?: string;
  action?: string;
  entityId?: string;
  [key: string]: any;
}

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  })
);

// Logger principal
export class Logger {
  private static instance: winston.Logger;

  static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || LogLevel.INFO,
        format: customFormat,
        defaultMeta: {
          service: 'sigah-backend',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        },
        transports: [
          // Console para desarrollo
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                let msg = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                  msg += ` ${JSON.stringify(meta)}`;
                }
                return msg;
              })
            )
          }),

          // Archivos para producción
          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: LogLevel.ERROR,
            maxsize: 5242880, // 5MB
            maxFiles: 5
          }),

          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
          })
        ]
      });

      // En producción, agregar logs externos (Elasticsearch, etc.)
      if (process.env.NODE_ENV === 'production') {
        // Aquí se podría agregar transporte a Elasticsearch, CloudWatch, etc.
        Logger.instance.add(new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'production.log'),
          level: LogLevel.INFO,
          maxsize: 10485760, // 10MB
          maxFiles: 10
        }));
      }
    }

    return Logger.instance;
  }

  // Métodos de logging con contexto
  static error(message: string, context?: LogContext): void {
    Logger.getInstance().error(message, context);
  }

  static warn(message: string, context?: LogContext): void {
    Logger.getInstance().warn(message, context);
  }

  static info(message: string, context?: LogContext): void {
    Logger.getInstance().info(message, context);
  }

  static debug(message: string, context?: LogContext): void {
    Logger.getInstance().debug(message, context);
  }

  // Logging específico para auditoría
  static audit(action: string, context: LogContext): void {
    Logger.info(`AUDIT: ${action}`, {
      ...context,
      audit: true,
      action,
      timestamp: new Date().toISOString()
    });
  }

  // Logging para rendimiento
  static performance(operation: string, duration: number, context?: LogContext): void {
    Logger.info(`PERFORMANCE: ${operation}`, {
      ...context,
      performance: true,
      operation,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // Logging para seguridad
  static security(event: string, context: LogContext): void {
    Logger.warn(`SECURITY: ${event}`, {
      ...context,
      security: true,
      event,
      timestamp: new Date().toISOString()
    });
  }

  // Logging para errores de aplicación
  static applicationError(error: Error, context?: LogContext): void {
    Logger.error('APPLICATION_ERROR', {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Middleware para logging de requests HTTP
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const requestId = req.id || Math.random().toString(36).substring(7);

  // Agregar contexto al request
  req.requestId = requestId;
  req.logger = Logger;

  // Log del request
  Logger.info('HTTP_REQUEST', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Interceptación del response para logging
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - start;
    
    Logger.info('HTTP_RESPONSE', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: duration,
      userId: req.user?.id
    });

    // Log de errores HTTP
    if (res.statusCode >= 400) {
      Logger.error('HTTP_ERROR', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: duration,
        userId: req.user?.id,
        error: data
      });
    }

    originalSend.call(this, data);
  };

  next();
};

// Servicio de métricas
export class MetricsService {
  private static metrics: Map<string, any> = new Map();

  static increment(metric: string, value: number = 1, tags?: Record<string, string>): void {
    const key = `${metric}:${JSON.stringify(tags || {})}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);

    // Log de métrica
    Logger.info('METRIC', {
      metric,
      value: current + value,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  static gauge(metric: string, value: number, tags?: Record<string, string>): void {
    const key = `${metric}:${JSON.stringify(tags || {})}`;
    this.metrics.set(key, value);

    // Log de métrica
    Logger.info('GAUGE', {
      metric,
      value,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  static histogram(metric: string, value: number, tags?: Record<string, string>): void {
    const key = `${metric}:${JSON.stringify(tags || {})}`;
    const values = this.metrics.get(key) || [];
    values.push(value);
    this.metrics.set(key, values);

    // Log de histograma
    Logger.info('HISTOGRAM', {
      metric,
      value,
      count: values.length,
      avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  static getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    return result;
  }

  static reset(): void {
    this.metrics.clear();
  }
}

// Health check service
export class HealthCheckService {
  private static checks: Map<string, () => Promise<boolean>> = new Map();

  static register(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  static async runChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, check] of this.checks.entries()) {
      try {
        results[name] = await check();
      } catch (error) {
        Logger.error(`Health check failed for ${name}`, { error });
        results[name] = false;
      }
    }

    return results;
  }

  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    const checks = await this.runChecks();
    const allHealthy = Object.values(checks).every(result => result);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

export default Logger;
