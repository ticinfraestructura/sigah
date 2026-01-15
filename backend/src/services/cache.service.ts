/**
 * Servicio de Caché
 * 
 * Proporciona caché en memoria para consultas frecuentes
 * Reduce carga en base de datos
 */

import NodeCache from 'node-cache';
import logger from './logger.service';

// Configuración del caché
const cache = new NodeCache({
  stdTTL: 300, // 5 minutos por defecto
  checkperiod: 60, // Verificar expiración cada minuto
  useClones: true, // Clonar objetos para evitar mutaciones
  deleteOnExpire: true
});

// Estadísticas
let hits = 0;
let misses = 0;

// ============ FUNCIONES PRINCIPALES ============

/**
 * Obtener valor del caché
 */
export const cacheGet = <T>(key: string): T | undefined => {
  const value = cache.get<T>(key);
  if (value !== undefined) {
    hits++;
    logger.debug(`[CACHE] Hit: ${key}`);
    return value;
  }
  misses++;
  logger.debug(`[CACHE] Miss: ${key}`);
  return undefined;
};

/**
 * Guardar valor en caché
 */
export const cacheSet = <T>(key: string, value: T, ttl?: number): boolean => {
  const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
  if (success) {
    logger.debug(`[CACHE] Set: ${key} (TTL: ${ttl || 300}s)`);
  }
  return success;
};

/**
 * Eliminar valor del caché
 */
export const cacheDel = (key: string | string[]): number => {
  const deleted = cache.del(key);
  logger.debug(`[CACHE] Del: ${Array.isArray(key) ? key.join(', ') : key}`);
  return deleted;
};

/**
 * Limpiar todo el caché
 */
export const cacheFlush = (): void => {
  cache.flushAll();
  logger.info('[CACHE] Flushed all cache');
};

/**
 * Obtener o establecer (cache-aside pattern)
 */
export const cacheGetOrSet = async <T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttl?: number
): Promise<T> => {
  const cached = cacheGet<T>(key);
  if (cached !== undefined) {
    return cached;
  }
  
  const value = await fetchFn();
  cacheSet(key, value, ttl);
  return value;
};

// ============ KEYS HELPERS ============

export const CacheKeys = {
  // Dashboard
  dashboardStats: () => 'dashboard:stats',
  dashboardAlerts: () => 'dashboard:alerts',
  
  // Productos
  products: (filters?: string) => `products:${filters || 'all'}`,
  product: (id: string) => `product:${id}`,
  productStock: (id: string) => `product:${id}:stock`,
  
  // Categorías
  categories: () => 'categories:all',
  category: (id: string) => `category:${id}`,
  
  // Beneficiarios
  beneficiaries: (filters?: string) => `beneficiaries:${filters || 'all'}`,
  beneficiary: (id: string) => `beneficiary:${id}`,
  
  // Solicitudes
  requests: (filters?: string) => `requests:${filters || 'all'}`,
  request: (id: string) => `request:${id}`,
  
  // Kits
  kits: () => 'kits:all',
  kit: (id: string) => `kit:${id}`,
  
  // Roles y permisos
  roles: () => 'roles:all',
  role: (id: string) => `role:${id}`,
  permissions: () => 'permissions:all',
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  
  // Reportes
  report: (type: string, params: string) => `report:${type}:${params}`
};

// ============ INVALIDACIÓN POR ENTIDAD ============

/**
 * Invalidar caché relacionado con productos
 */
export const invalidateProductCache = (productId?: string) => {
  const keys = cache.keys().filter(k => k.startsWith('product'));
  cacheDel(keys);
  cacheDel([CacheKeys.dashboardStats(), CacheKeys.dashboardAlerts()]);
};

/**
 * Invalidar caché relacionado con beneficiarios
 */
export const invalidateBeneficiaryCache = (beneficiaryId?: string) => {
  const keys = cache.keys().filter(k => k.startsWith('beneficiar'));
  cacheDel(keys);
};

/**
 * Invalidar caché relacionado con solicitudes
 */
export const invalidateRequestCache = (requestId?: string) => {
  const keys = cache.keys().filter(k => k.startsWith('request'));
  cacheDel(keys);
  cacheDel([CacheKeys.dashboardStats()]);
};

/**
 * Invalidar caché relacionado con roles
 */
export const invalidateRoleCache = () => {
  const keys = cache.keys().filter(k => k.startsWith('role') || k.includes('permissions'));
  cacheDel(keys);
};

// ============ ESTADÍSTICAS ============

export const getCacheStats = () => {
  const stats = cache.getStats();
  return {
    keyCount: cache.keys().length,
    cacheHits: hits,
    cacheMisses: misses,
    hitRate: hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) + '%' : '0%',
    nodeStats: stats
  };
};

// Resetear estadísticas cada hora
setInterval(() => {
  logger.info('[CACHE] Stats', getCacheStats());
  hits = 0;
  misses = 0;
}, 60 * 60 * 1000);

export default cache;
