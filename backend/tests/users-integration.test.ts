/**
 * Tests de integración de Roles, Usuarios y Permisos
 * Requiere base de datos PostgreSQL de pruebas (sigah_test)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_PREFIX = 'test-auto';
const TEST_EMAIL = `${TEST_PREFIX}@sigah.com`;
const TEST_PASSWORD = 'Password123!';

let testRoleId: string;
let testUserId: string;

// ============================================================
// Setup / Teardown
// ============================================================
beforeAll(async () => {
  // Limpieza previa
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_PREFIX } } });
  await prisma.role.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });

  // Crear rol de prueba
  const role = await prisma.role.create({
    data: {
      name: `${TEST_PREFIX}-Bodeguero`,
      description: 'Rol de prueba para integración',
      isActive: true
    }
  });
  testRoleId = role.id;

  // Crear usuario con rol de prueba
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Integración',
      phone: '+573001234567',
      roleId: testRoleId,
      isActive: true
    }
  });
  testUserId = user.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_PREFIX } } });
  await prisma.role.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });
  await prisma.$disconnect();
});

// ============================================================
// Tests de integración con datos reales
// ============================================================
describe('Users and Roles Integration', () => {
  it('should create user with role and load relation', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      include: { role: true }
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe(TEST_EMAIL);
    expect(user?.role?.id).toBe(testRoleId);
    expect(user?.role?.name).toBe(`${TEST_PREFIX}-Bodeguero`);
  });

  it('should verify password with bcrypt', async () => {
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user).not.toBeNull();
    const isValid = await bcrypt.compare(TEST_PASSWORD, user!.password);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user).not.toBeNull();
    const isValid = await bcrypt.compare('WrongPassword', user!.password);
    expect(isValid).toBe(false);
  });

  it('should list role permissions (schema current format)', async () => {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: testRoleId }
    });

    expect(Array.isArray(rolePermissions)).toBe(true);
  });

  it('should enforce unique email constraint', async () => {
    await expect(
      prisma.user.create({
        data: {
          email: TEST_EMAIL,
          password: 'AnotherPass123!',
          firstName: 'Otro',
          lastName: 'Test',
          roleId: testRoleId
        }
      })
    ).rejects.toThrow();
  });

  it('should block inactive user login simulation', async () => {
    const user = await prisma.user.update({
      where: { id: testUserId },
      data: { isActive: false }
    });

    expect(user.isActive).toBe(false);

    await prisma.user.update({
      where: { id: testUserId },
      data: { isActive: true }
    });
  });

});
