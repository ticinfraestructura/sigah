/**
 * Middleware de Logging HTTP
 * 
 * Registra todas las peticiones HTTP con tiempo de respuesta
 */

import { Request, Response, NextFunction } from 'express';
import { logHttp } from '../services/logger.service';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Capturar cuando la respuesta termine
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logHttp(req, res, responseTime);
  });
  
  next();
};
