import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Directorio de logs
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Archivo de log de seguridad
const SECURITY_LOG = path.join(LOG_DIR, 'security.log');

interface SecurityEvent {
  timestamp: string;
  type: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  userId?: string;
  email?: string;
  details?: string;
  success: boolean;
}

// Función para escribir log de seguridad
export const logSecurityEvent = (event: SecurityEvent) => {
  const logLine = JSON.stringify(event) + '\n';
  fs.appendFileSync(SECURITY_LOG, logLine);
  
  // También log a consola en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const icon = event.success ? '✅' : '⚠️';
    console.log(`${icon} [SECURITY] ${event.type}: ${event.email || event.ip} - ${event.details || ''}`);
  }
};

// Middleware para registrar intentos de login
export const logLoginAttempt = (success: boolean, email: string, req: Request, details?: string) => {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    path: req.path,
    method: req.method,
    email,
    details,
    success
  });
};

// Middleware para registrar accesos denegados
export const logAccessDenied = (req: Request, userId?: string, reason?: string) => {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    type: 'ACCESS_DENIED',
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    path: req.path,
    method: req.method,
    userId,
    details: reason,
    success: false
  });
};

// Middleware para registrar cambios de permisos
export const logPermissionChange = (req: Request, userId: string, action: string, details: string) => {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    type: 'PERMISSION_CHANGE',
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    path: req.path,
    method: req.method,
    userId,
    details: `${action}: ${details}`,
    success: true
  });
};

// Middleware para detectar actividad sospechosa
const suspiciousPatterns = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL Injection
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
  /(\.\.\/)|(\.\.\\)/g, // Path traversal
  /(\%00)/g, // Null byte
];

export const detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
  // Excluir endpoints que manejan datos legítimos de la base de datos
  const excludedPaths = [
    '/api/reports/export',
    '/api/reports/generate'
  ];
  
  if (excludedPaths.some(path => req.path.includes(path))) {
    return next();
  }

  const checkValue = (value: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };

  // Verificar query params
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string' && checkValue(value)) {
      logSecurityEvent({
        timestamp: new Date().toISOString(),
        type: 'SUSPICIOUS_REQUEST',
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        path: req.path,
        method: req.method,
        details: `Suspicious query param: ${key}`,
        success: false
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Solicitud inválida' 
      });
    }
  }

  // Verificar body (solo strings)
  const checkBody = (obj: any, prefix = ''): boolean => {
    for (const [key, value] of Object.entries(obj || {})) {
      if (typeof value === 'string' && checkValue(value)) {
        logSecurityEvent({
          timestamp: new Date().toISOString(),
          type: 'SUSPICIOUS_REQUEST',
          ip: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          path: req.path,
          method: req.method,
          details: `Suspicious body field: ${prefix}${key}`,
          success: false
        });
        return true;
      }
      if (typeof value === 'object' && value !== null) {
        if (checkBody(value, `${prefix}${key}.`)) return true;
      }
    }
    return false;
  };

  if (checkBody(req.body)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Solicitud inválida' 
    });
  }

  next();
};

// Middleware para agregar headers de seguridad adicionales
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevenir que el navegador detecte el tipo MIME
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Habilitar XSS filter del navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // No cachear respuestas sensibles
  if (req.path.includes('/auth/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};
