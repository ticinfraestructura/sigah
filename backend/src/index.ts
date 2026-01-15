import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';

// Routes
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import kitRoutes from './routes/kit.routes';
import beneficiaryRoutes from './routes/beneficiary.routes';
import requestRoutes from './routes/request.routes';
import deliveryRoutes from './routes/delivery.routes';
import returnRoutes from './routes/return.routes';
import inventoryRoutes from './routes/inventory.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import roleRoutes from './routes/role.routes';
import userRoutes from './routes/user.routes';
import whatsappNotificationRoutes from './routes/whatsapp-notification.routes';
import backupRoutes from './routes/backup.routes';
import auditRoutes from './routes/audit.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { detectSuspiciousActivity, additionalSecurityHeaders } from './middleware/security.middleware';
import { httpLogger } from './middleware/http-logger.middleware';

// Config
import { swaggerSpec } from './config/swagger.config';

// Services
import logger from './services/logger.service';
import './services/backup.service'; // Iniciar backup automático
import { initSocketServer } from './services/socket.service';
import http from 'http';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ============ SEGURIDAD CRÍTICA ============

// 1. Headers de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS Restrictivo
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    // En desarrollo, permitir cualquier localhost/127.0.0.1
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400 // 24 horas
}));

// 3. Rate Limiting General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requests por ventana
  message: { 
    success: false, 
    error: 'Demasiadas solicitudes. Por favor, espere unos minutos.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health' // No limitar health check
});

// 4. Rate Limiting Estricto para Autenticación
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 intentos de login por hora
  message: { 
    success: false, 
    error: 'Demasiados intentos de inicio de sesión. Cuenta bloqueada temporalmente por 1 hora.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Deshabilitar validación de IPv6 para desarrollo
  validate: { xForwardedForHeader: false }
});

// Aplicar rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/change-password', authLimiter);

// 5. Limitar tamaño del body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Compresión de respuestas
app.use(compression());

// 7. Headers de seguridad adicionales
app.use(additionalSecurityHeaders);

// 8. Detección de actividad sospechosa
app.use(detectSuspiciousActivity);

// 9. HTTP Logger
app.use(httpLogger);

// Make prisma available in routes
app.set('prisma', prisma);

// ============ DOCUMENTACIÓN API ============
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SIGAH API Documentation'
}));

// Endpoint para obtener spec JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============ ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/whatsapp-notifications', whatsappNotificationRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/audit', auditRoutes);

// Health check con información extendida
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Error handler
app.use(errorHandler);

// Create HTTP server and initialize Socket.io
const httpServer = http.createServer(app);
const io = initSocketServer(httpServer);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 SIGAH Backend running on http://localhost:${PORT}`);
  logger.info(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
  logger.info(`🔌 WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  io?.close();
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma, io };
