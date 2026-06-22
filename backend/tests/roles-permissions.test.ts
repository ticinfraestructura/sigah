/**
 * Tests de Roles, Usuarios y Permisos
 *
 * Cubre:
 * - Validación Zod: roleId obligatorio al crear usuario
 * - Middleware hasPermission / isAdmin / authorize
 */

import { describe, it, expect, vi } from 'vitest';
import { userZodSchemas } from '../src/middleware/validation.middleware';
import { hasPermission, isAdmin, authorize, AuthRequest } from '../src/middleware/auth.middleware';
import { Response, NextFunction } from 'express';

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn() as NextFunction;

const validUserData = {
  email: 'juan.bodega@test.com',
  password: 'Password123!',
  firstName: 'Juan',
  lastName: 'Bodega',
  phone: '+573001234567',
  roleId: '550e8400-e29b-41d4-a716-446655440000'
};

// ============================================================
// 1. Validación Zod: roleId obligatorio
// ============================================================
describe('User Create Validation - roleId required', () => {
  it('should accept valid user data with roleId UUID', () => {
    const result = userZodSchemas.create.safeParse(validUserData);
    expect(result.success).toBe(true);
  });

  it('should reject when roleId is missing', () => {
    const { roleId, ...dataWithoutRole } = validUserData;
    const result = userZodSchemas.create.safeParse(dataWithoutRole);
    expect(result.success).toBe(false);
  });

  it('should reject when roleId is invalid UUID', () => {
    const result = userZodSchemas.create.safeParse({
      ...validUserData,
      roleId: 'not-a-uuid'
    });
    expect(result.success).toBe(false);
  });

  it('should reject when roleId is empty string', () => {
    const result = userZodSchemas.create.safeParse({
      ...validUserData,
      roleId: ''
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// 2. hasPermission middleware
// ============================================================
describe('hasPermission middleware', () => {
  const baseUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@sigah.com',
    roleId: '550e8400-e29b-41d4-a716-446655440001',
    roleName: 'Bodega',
    firstName: 'Test',
    lastName: 'User',
    permissions: [{ module: 'inventory', action: 'view' }]
  };

  it('should allow access when user has exact permission', () => {
    const req = { user: baseUser } as AuthRequest;
    const middleware = hasPermission('inventory', 'view');
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should deny access when user lacks permission', () => {
    const req = { user: baseUser } as AuthRequest;
    const middleware = hasPermission('users', 'create');
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should allow access for Administrador regardless of permissions', () => {
    const req = { user: { ...baseUser, roleName: 'Administrador' } } as AuthRequest;
    const middleware = hasPermission('users', 'delete');
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject when user is not authenticated', () => {
    const req = {} as AuthRequest;
    const middleware = hasPermission('inventory', 'view');
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

// ============================================================
// 3. isAdmin middleware
// ============================================================
describe('isAdmin middleware', () => {
  it('should allow access for Administrador', () => {
    const req = { user: { roleName: 'Administrador' } } as AuthRequest;
    const middleware = isAdmin();
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should deny access for non-admin role', () => {
    const req = { user: { roleName: 'Bodega' } } as AuthRequest;
    const middleware = isAdmin();
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should reject when user is not authenticated', () => {
    const req = {} as AuthRequest;
    const middleware = isAdmin();
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

// ============================================================
// 4. authorize middleware (legacy role names)
// ============================================================
describe('authorize middleware', () => {
  it('should allow ADMIN role mapped to Administrador', () => {
    const req = { user: { roleName: 'Administrador' } } as AuthRequest;
    const middleware = authorize('ADMIN');
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should allow WAREHOUSE role mapped to Bodega', () => {
    const req = { user: { roleName: 'Bodega' } } as AuthRequest;
    const middleware = authorize('WAREHOUSE');
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should deny access for unmapped role', () => {
    const req = { user: { roleName: 'Consulta' } } as AuthRequest;
    const middleware = authorize('ADMIN');
    middleware(req, mockResponse(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
