/**
 * Servicio de Redis
 * 
 * Proporciona:
 * - Caché distribuido
 * - Gestión de sesiones
 * - Rate limiting distribuido
 * - Pub/Sub para notificaciones
 */

import Redis from 'ioredis';
import logger from './logger.service';

// Configuración de Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0');

// Cliente principal
let redisClient: Redis | null = null;

// Cliente para pub/sub
let redisPubClient: Redis | null = null;
let redisSubClient: Redis | null = null;

// ============ CONEXIÓN ============

/**
 * Inicializar conexión a Redis
 */
export const initRedis = async (): Promise<Redis> => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(REDIS_URL, {
      password: REDIS_PASSWORD,
      db: REDIS_DB,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('[REDIS] Max retries reached, giving up');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      logger.info('[REDIS] Connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('[REDIS] Connection error', { error: err.message });
    });

    redisClient.on('close', () => {
      logger.warn('[REDIS] Connection closed');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('[REDIS] Failed to initialize', { error });
    throw error;
  }
};

/**
 * Obtener cliente Redis (lazy init)
 */
export const getRedis = async (): Promise<Redis> => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

/**
 * Verificar si Redis está disponible
 */
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    const client = await getRedis();
    await client.ping();
    return true;
  } catch {
    return false;
  }
};

/**
 * Cerrar conexión
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  if (redisPubClient) {
    await redisPubClient.quit();
    redisPubClient = null;
  }
  if (redisSubClient) {
    await redisSubClient.quit();
    redisSubClient = null;
  }
  logger.info('[REDIS] All connections closed');
};

// ============ CACHÉ ============

const CACHE_PREFIX = 'cache:';

/**
 * Obtener valor del caché
 */
export const redisGet = async <T>(key: string): Promise<T | null> => {
  try {
    const client = await getRedis();
    const value = await client.get(CACHE_PREFIX + key);
    if (value) {
      logger.debug(`[REDIS] Cache hit: ${key}`);
      return JSON.parse(value);
    }
    logger.debug(`[REDIS] Cache miss: ${key}`);
    return null;
  } catch (error) {
    logger.error('[REDIS] Get error', { key, error });
    return null;
  }
};

/**
 * Guardar valor en caché
 */
export const redisSet = async <T>(
  key: string, 
  value: T, 
  ttlSeconds: number = 300
): Promise<boolean> => {
  try {
    const client = await getRedis();
    await client.setex(CACHE_PREFIX + key, ttlSeconds, JSON.stringify(value));
    logger.debug(`[REDIS] Cache set: ${key} (TTL: ${ttlSeconds}s)`);
    return true;
  } catch (error) {
    logger.error('[REDIS] Set error', { key, error });
    return false;
  }
};

/**
 * Eliminar del caché
 */
export const redisDel = async (keys: string | string[]): Promise<number> => {
  try {
    const client = await getRedis();
    const prefixedKeys = Array.isArray(keys) 
      ? keys.map(k => CACHE_PREFIX + k)
      : [CACHE_PREFIX + keys];
    const deleted = await client.del(...prefixedKeys);
    logger.debug(`[REDIS] Cache del: ${deleted} keys`);
    return deleted;
  } catch (error) {
    logger.error('[REDIS] Del error', { keys, error });
    return 0;
  }
};

/**
 * Invalidar caché por patrón
 */
export const redisInvalidatePattern = async (pattern: string): Promise<number> => {
  try {
    const client = await getRedis();
    const keys = await client.keys(CACHE_PREFIX + pattern);
    if (keys.length > 0) {
      const deleted = await client.del(...keys);
      logger.info(`[REDIS] Invalidated ${deleted} keys matching: ${pattern}`);
      return deleted;
    }
    return 0;
  } catch (error) {
    logger.error('[REDIS] Invalidate pattern error', { pattern, error });
    return 0;
  }
};

/**
 * Cache-aside pattern
 */
export const redisGetOrSet = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> => {
  const cached = await redisGet<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  const value = await fetchFn();
  await redisSet(key, value, ttlSeconds);
  return value;
};

// ============ SESIONES ============

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 24 * 60 * 60; // 24 horas

export interface RedisSession {
  userId: string;
  token: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  lastActivity: string;
}

/**
 * Crear sesión
 */
export const createSession = async (
  sessionId: string,
  session: RedisSession
): Promise<boolean> => {
  try {
    const client = await getRedis();
    const key = SESSION_PREFIX + sessionId;
    
    // Guardar sesión
    await client.setex(key, SESSION_TTL, JSON.stringify(session));
    
    // Agregar a lista de sesiones del usuario
    await client.sadd(`user:${session.userId}:sessions`, sessionId);
    
    logger.info(`[REDIS] Session created: ${sessionId}`);
    return true;
  } catch (error) {
    logger.error('[REDIS] Create session error', { sessionId, error });
    return false;
  }
};

/**
 * Obtener sesión
 */
export const getSession = async (sessionId: string): Promise<RedisSession | null> => {
  try {
    const client = await getRedis();
    const data = await client.get(SESSION_PREFIX + sessionId);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('[REDIS] Get session error', { sessionId, error });
    return null;
  }
};

/**
 * Actualizar actividad de sesión
 */
export const updateSessionActivity = async (sessionId: string): Promise<boolean> => {
  try {
    const client = await getRedis();
    const key = SESSION_PREFIX + sessionId;
    const session = await getSession(sessionId);
    
    if (session) {
      session.lastActivity = new Date().toISOString();
      await client.setex(key, SESSION_TTL, JSON.stringify(session));
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[REDIS] Update session error', { sessionId, error });
    return false;
  }
};

/**
 * Eliminar sesión
 */
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const client = await getRedis();
    const session = await getSession(sessionId);
    
    if (session) {
      await client.del(SESSION_PREFIX + sessionId);
      await client.srem(`user:${session.userId}:sessions`, sessionId);
      logger.info(`[REDIS] Session deleted: ${sessionId}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[REDIS] Delete session error', { sessionId, error });
    return false;
  }
};

/**
 * Obtener todas las sesiones de un usuario
 */
export const getUserSessions = async (userId: string): Promise<RedisSession[]> => {
  try {
    const client = await getRedis();
    const sessionIds = await client.smembers(`user:${userId}:sessions`);
    
    const sessions: RedisSession[] = [];
    for (const id of sessionIds) {
      const session = await getSession(id);
      if (session) {
        sessions.push({ ...session, token: id });
      } else {
        // Limpiar sesión expirada
        await client.srem(`user:${userId}:sessions`, id);
      }
    }
    
    return sessions;
  } catch (error) {
    logger.error('[REDIS] Get user sessions error', { userId, error });
    return [];
  }
};

/**
 * Eliminar todas las sesiones de un usuario
 */
export const deleteUserSessions = async (userId: string): Promise<number> => {
  try {
    const client = await getRedis();
    const sessionIds = await client.smembers(`user:${userId}:sessions`);
    
    for (const id of sessionIds) {
      await client.del(SESSION_PREFIX + id);
    }
    await client.del(`user:${userId}:sessions`);
    
    logger.info(`[REDIS] Deleted ${sessionIds.length} sessions for user: ${userId}`);
    return sessionIds.length;
  } catch (error) {
    logger.error('[REDIS] Delete user sessions error', { userId, error });
    return 0;
  }
};

// ============ TOKEN BLACKLIST ============

const BLACKLIST_PREFIX = 'blacklist:';

/**
 * Agregar token a blacklist
 */
export const blacklistToken = async (token: string, ttlSeconds: number): Promise<boolean> => {
  try {
    const client = await getRedis();
    await client.setex(BLACKLIST_PREFIX + token, ttlSeconds, '1');
    logger.info('[REDIS] Token blacklisted');
    return true;
  } catch (error) {
    logger.error('[REDIS] Blacklist token error', { error });
    return false;
  }
};

/**
 * Verificar si token está en blacklist
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const client = await getRedis();
    const exists = await client.exists(BLACKLIST_PREFIX + token);
    return exists === 1;
  } catch (error) {
    logger.error('[REDIS] Check blacklist error', { error });
    return false;
  }
};

// ============ RATE LIMITING ============

const RATE_LIMIT_PREFIX = 'ratelimit:';

/**
 * Verificar y actualizar rate limit
 */
export const checkRateLimit = async (
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> => {
  try {
    const client = await getRedis();
    const redisKey = RATE_LIMIT_PREFIX + key;
    
    const multi = client.multi();
    multi.incr(redisKey);
    multi.ttl(redisKey);
    
    const results = await multi.exec();
    const count = results?.[0]?.[1] as number || 0;
    let ttl = results?.[1]?.[1] as number || -1;
    
    // Si es la primera request, establecer TTL
    if (ttl === -1) {
      await client.expire(redisKey, windowSeconds);
      ttl = windowSeconds;
    }
    
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    
    return { allowed, remaining, resetIn: ttl };
  } catch (error) {
    logger.error('[REDIS] Rate limit check error', { key, error });
    // En caso de error, permitir la request
    return { allowed: true, remaining: maxRequests, resetIn: 0 };
  }
};

// ============ PUB/SUB ============

/**
 * Publicar mensaje
 */
export const publish = async (channel: string, message: any): Promise<number> => {
  try {
    if (!redisPubClient) {
      redisPubClient = new Redis(REDIS_URL, { password: REDIS_PASSWORD, db: REDIS_DB });
    }
    return await redisPubClient.publish(channel, JSON.stringify(message));
  } catch (error) {
    logger.error('[REDIS] Publish error', { channel, error });
    return 0;
  }
};

/**
 * Suscribirse a canal
 */
export const subscribe = async (
  channel: string,
  callback: (message: any) => void
): Promise<void> => {
  try {
    if (!redisSubClient) {
      redisSubClient = new Redis(REDIS_URL, { password: REDIS_PASSWORD, db: REDIS_DB });
    }
    
    await redisSubClient.subscribe(channel);
    redisSubClient.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(JSON.parse(msg));
      }
    });
    
    logger.info(`[REDIS] Subscribed to channel: ${channel}`);
  } catch (error) {
    logger.error('[REDIS] Subscribe error', { channel, error });
  }
};

// ============ ESTADÍSTICAS ============

export const getRedisStats = async () => {
  try {
    const client = await getRedis();
    const info = await client.info();
    const dbSize = await client.dbsize();
    
    return {
      connected: true,
      dbSize,
      info: info.split('\n').slice(0, 20).join('\n')
    };
  } catch (error) {
    return {
      connected: false,
      error: (error as Error).message
    };
  }
};

export default {
  initRedis,
  getRedis,
  isRedisAvailable,
  closeRedis,
  redisGet,
  redisSet,
  redisDel,
  redisGetOrSet,
  redisInvalidatePattern,
  createSession,
  getSession,
  deleteSession,
  getUserSessions,
  blacklistToken,
  isTokenBlacklisted,
  checkRateLimit,
  publish,
  subscribe,
  getRedisStats
};
