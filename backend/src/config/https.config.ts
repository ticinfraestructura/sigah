/**
 * Configuración HTTPS
 * 
 * Proporciona:
 * - Servidor HTTPS con certificados SSL
 * - Redirección HTTP a HTTPS
 * - Generación de certificados para desarrollo
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { Express } from 'express';
import logger from '../services/logger.service';

// Rutas de certificados
const SSL_DIR = path.join(process.cwd(), 'ssl');
const CERT_PATH = process.env.SSL_CERT_PATH || path.join(SSL_DIR, 'cert.pem');
const KEY_PATH = process.env.SSL_KEY_PATH || path.join(SSL_DIR, 'key.pem');

// Puertos
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '80');
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '443');

/**
 * Verificar si existen certificados SSL
 */
export const hasSSLCertificates = (): boolean => {
  return fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH);
};

/**
 * Cargar certificados SSL
 */
export const loadSSLCertificates = (): { key: Buffer; cert: Buffer } | null => {
  try {
    if (!hasSSLCertificates()) {
      logger.warn('[HTTPS] SSL certificates not found');
      return null;
    }

    return {
      key: fs.readFileSync(KEY_PATH),
      cert: fs.readFileSync(CERT_PATH)
    };
  } catch (error) {
    logger.error('[HTTPS] Failed to load SSL certificates', { error });
    return null;
  }
};

/**
 * Crear servidor HTTPS
 */
export const createHTTPSServer = (app: Express): https.Server | null => {
  const credentials = loadSSLCertificates();
  
  if (!credentials) {
    return null;
  }

  const server = https.createServer(credentials, app);
  
  logger.info('[HTTPS] Server created with SSL certificates');
  return server;
};

/**
 * Crear servidor de redirección HTTP -> HTTPS
 */
export const createHTTPRedirectServer = (): http.Server => {
  const redirectApp = http.createServer((req, res) => {
    const host = req.headers.host?.replace(/:\d+$/, '') || 'localhost';
    const redirectUrl = `https://${host}:${HTTPS_PORT}${req.url}`;
    
    res.writeHead(301, { Location: redirectUrl });
    res.end();
  });

  return redirectApp;
};

/**
 * Middleware para forzar HTTPS
 */
export const forceHTTPS = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Verificar header de proxy (para load balancers)
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    if (!isSecure) {
      const host = req.headers.host?.replace(/:\d+$/, '') || 'localhost';
      return res.redirect(301, `https://${host}${req.url}`);
    }
  }
  next();
};

/**
 * Configuración HSTS (HTTP Strict Transport Security)
 */
export const hstsConfig = {
  maxAge: 31536000, // 1 año
  includeSubDomains: true,
  preload: true
};

/**
 * Iniciar servidores HTTP y HTTPS
 */
export const startServers = (
  app: Express,
  options: {
    httpPort?: number;
    httpsPort?: number;
    enableHTTPRedirect?: boolean;
  } = {}
): { http?: http.Server; https?: https.Server } => {
  const {
    httpPort = HTTP_PORT,
    httpsPort = HTTPS_PORT,
    enableHTTPRedirect = true
  } = options;

  const servers: { http?: http.Server; https?: https.Server } = {};

  // Intentar crear servidor HTTPS
  const httpsServer = createHTTPSServer(app);
  
  if (httpsServer) {
    httpsServer.listen(httpsPort, () => {
      logger.info(`🔒 HTTPS Server running on https://localhost:${httpsPort}`);
    });
    servers.https = httpsServer;

    // Crear servidor de redirección HTTP si está habilitado
    if (enableHTTPRedirect) {
      const httpRedirect = createHTTPRedirectServer();
      httpRedirect.listen(httpPort, () => {
        logger.info(`🔄 HTTP Redirect Server running on http://localhost:${httpPort}`);
      });
      servers.http = httpRedirect;
    }
  } else {
    // Sin certificados, usar solo HTTP
    const httpServer = http.createServer(app);
    httpServer.listen(httpPort, () => {
      logger.warn(`⚠️ HTTP Server running on http://localhost:${httpPort} (no SSL)`);
    });
    servers.http = httpServer;
  }

  return servers;
};

/**
 * Instrucciones para generar certificados
 */
export const generateCertificatesInstructions = `
# Generar certificados SSL para desarrollo

## Opción 1: OpenSSL (autofirmado)
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"

## Opción 2: mkcert (recomendado para desarrollo)
# Instalar mkcert: https://github.com/FiloSottile/mkcert
mkcert -install
mkcert -key-file ssl/key.pem -cert-file ssl/cert.pem localhost 127.0.0.1

## Opción 3: Let's Encrypt (producción)
# Usar certbot: https://certbot.eff.org/
certbot certonly --standalone -d tu-dominio.com
# Los certificados se guardan en /etc/letsencrypt/live/tu-dominio.com/

## Variables de entorno para producción
SSL_CERT_PATH=/etc/letsencrypt/live/tu-dominio.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/tu-dominio.com/privkey.pem
`;

export default {
  hasSSLCertificates,
  loadSSLCertificates,
  createHTTPSServer,
  createHTTPRedirectServer,
  forceHTTPS,
  hstsConfig,
  startServers,
  generateCertificatesInstructions
};
