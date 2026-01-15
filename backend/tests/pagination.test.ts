/**
 * Tests de Paginación
 */

import { describe, it, expect } from 'vitest';
import { 
  parsePaginationParams, 
  createPaginatedResponse,
  generatePaginationLinks 
} from '../src/utils/pagination.utils';

describe('Pagination Utils', () => {
  describe('parsePaginationParams', () => {
    it('should use default values when no params provided', () => {
      const result = parsePaginationParams({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(0);
    });

    it('should parse valid page and limit', () => {
      const result = parsePaginationParams({ page: '2', limit: '20' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(20);
    });

    it('should enforce minimum page of 1', () => {
      const result = parsePaginationParams({ page: '0' });
      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit of 100', () => {
      const result = parsePaginationParams({ limit: '500' });
      expect(result.limit).toBe(100);
    });

    it('should use custom defaults', () => {
      const result = parsePaginationParams({}, { page: 1, limit: 25 });
      expect(result.limit).toBe(25);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create correct pagination metadata', () => {
      const data = [1, 2, 3, 4, 5];
      const result = createPaginatedResponse(data, 50, { page: 1, limit: 5, skip: 0 });
      
      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.totalPages).toBe(10);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should correctly identify last page', () => {
      const result = createPaginatedResponse([], 50, { page: 10, limit: 5, skip: 45 });
      
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle single page', () => {
      const result = createPaginatedResponse([1, 2], 2, { page: 1, limit: 10, skip: 0 });
      
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  describe('generatePaginationLinks', () => {
    it('should generate correct links for first page', () => {
      const links = generatePaginationLinks('/api/items', { page: 1, limit: 10, skip: 0 }, 100);
      
      expect(links.self).toBe('/api/items?page=1&limit=10');
      expect(links.first).toBe('/api/items?page=1&limit=10');
      expect(links.last).toBe('/api/items?page=10&limit=10');
      expect(links.next).toBe('/api/items?page=2&limit=10');
      expect(links.prev).toBeNull();
    });

    it('should generate correct links for middle page', () => {
      const links = generatePaginationLinks('/api/items', { page: 5, limit: 10, skip: 40 }, 100);
      
      expect(links.next).toBe('/api/items?page=6&limit=10');
      expect(links.prev).toBe('/api/items?page=4&limit=10');
    });

    it('should generate correct links for last page', () => {
      const links = generatePaginationLinks('/api/items', { page: 10, limit: 10, skip: 90 }, 100);
      
      expect(links.next).toBeNull();
      expect(links.prev).toBe('/api/items?page=9&limit=10');
    });
  });
});
