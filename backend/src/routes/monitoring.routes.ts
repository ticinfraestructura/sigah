import { Router, Request, Response } from 'express';
import { Logger, MetricsService, HealthCheckService } from '../services/logging.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Registrar health checks
HealthCheckService.register('database', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
});

HealthCheckService.register('memory', async () => {
  const usage = process.memoryUsage();
  const threshold = 500 * 1024 * 1024; // 500MB
  return usage.heapUsed < threshold;
});

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await HealthCheckService.getHealthStatus();
    
    res.status(health.status === 'healthy' ? 200 : 503).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    Logger.error('Health check failed', { error });
    res.status(503).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// Metrics endpoint
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = MetricsService.getMetrics();
    const systemMetrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        application: metrics,
        system: systemMetrics
      }
    });
  } catch (error) {
    Logger.error('Metrics endpoint failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

// Logs endpoint (solo para desarrollo/admin)
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { level = 'info', limit = 100, since } = req.query;

    // En producción, esto debería leer de un sistema de logs centralizado
    // Por ahora, retornamos información básica
    res.json({
      success: true,
      data: {
        message: 'Logs endpoint - implementar con sistema de logs centralizado',
        level,
        limit,
        since,
        availableLevels: ['error', 'warn', 'info', 'debug']
      }
    });
  } catch (error) {
    Logger.error('Logs endpoint failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get logs'
    });
  }
});

// Performance monitoring endpoint
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const performanceMetrics = {
      database: {
        connectionPool: await getDatabasePoolStats(),
        queryTime: await getAverageQueryTime()
      },
      application: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime()
      },
      requests: {
        total: MetricsService.getMetrics()['http_requests_total'] || 0,
        errors: MetricsService.getMetrics()['http_errors_total'] || 0,
        avgResponseTime: MetricsService.getMetrics()['http_response_time_avg'] || 0
      }
    };

    res.json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    Logger.error('Performance endpoint failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
});

// Funciones auxiliares
async function getDatabasePoolStats() {
  try {
    // Implementar según el pool de conexión que se use
    return {
      active: 1,
      idle: 4,
      total: 5
    };
  } catch (error) {
    return null;
  }
}

async function getAverageQueryTime() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return Date.now() - start;
  } catch (error) {
    return null;
  }
}

export default router;
