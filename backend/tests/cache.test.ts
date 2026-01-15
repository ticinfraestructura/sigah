/**
 * Tests de Caché
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  cacheGet, 
  cacheSet, 
  cacheDel, 
  cacheFlush,
  cacheGetOrSet,
  CacheKeys 
} from '../src/services/cache.service';

describe('Cache Service', () => {
  beforeEach(() => {
    cacheFlush();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', () => {
      cacheSet('test-key', { data: 'test' });
      const result = cacheGet<{ data: string }>('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return undefined for non-existent key', () => {
      const result = cacheGet('non-existent');
      expect(result).toBeUndefined();
    });

    it('should delete a key', () => {
      cacheSet('to-delete', 'value');
      cacheDel('to-delete');
      const result = cacheGet('to-delete');
      expect(result).toBeUndefined();
    });

    it('should flush all cache', () => {
      cacheSet('key1', 'value1');
      cacheSet('key2', 'value2');
      cacheFlush();
      expect(cacheGet('key1')).toBeUndefined();
      expect(cacheGet('key2')).toBeUndefined();
    });
  });

  describe('Cache Keys', () => {
    it('should generate correct dashboard keys', () => {
      expect(CacheKeys.dashboardStats()).toBe('dashboard:stats');
      expect(CacheKeys.dashboardAlerts()).toBe('dashboard:alerts');
    });

    it('should generate correct product keys', () => {
      expect(CacheKeys.products()).toBe('products:all');
      expect(CacheKeys.products('category=1')).toBe('products:category=1');
      expect(CacheKeys.product('uuid-123')).toBe('product:uuid-123');
    });

    it('should generate correct user permission keys', () => {
      expect(CacheKeys.userPermissions('user-123')).toBe('user:user-123:permissions');
    });
  });

  describe('Cache-Aside Pattern', () => {
    it('should fetch and cache on miss', async () => {
      let fetchCount = 0;
      const fetchFn = async () => {
        fetchCount++;
        return { data: 'fetched' };
      };

      const result1 = await cacheGetOrSet('cache-aside-key', fetchFn);
      const result2 = await cacheGetOrSet('cache-aside-key', fetchFn);

      expect(result1).toEqual({ data: 'fetched' });
      expect(result2).toEqual({ data: 'fetched' });
      expect(fetchCount).toBe(1); // Solo debe llamar una vez
    });
  });
});
