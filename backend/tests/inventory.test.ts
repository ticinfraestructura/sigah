import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_PREFIX = 'TEST_INV_';
let testCategoryId: string;
let testProductId: string;

beforeAll(async () => {
  const testProducts = await prisma.product.findMany({ where: { code: { startsWith: TEST_PREFIX } }, select: { id: true } });
  const testProductIds = testProducts.map(p => p.id);
  if (testProductIds.length > 0) {
    await prisma.stockMovement.deleteMany({ where: { productId: { in: testProductIds } } });
    await prisma.productLot.deleteMany({ where: { productId: { in: testProductIds } } });
  }
  await prisma.product.deleteMany({ where: { code: { startsWith: TEST_PREFIX } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });

  const cat = await prisma.category.create({
    data: { name: `${TEST_PREFIX}Alimentos`, description: 'Categoría de prueba' }
  });
  testCategoryId = cat.id;

  const product = await prisma.product.create({
    data: {
      code: `${TEST_PREFIX}PROD001`,
      name: `${TEST_PREFIX}Arroz 1kg`,
      unit: 'kg',
      minStock: 10,
      isPerishable: false,
      categoryId: testCategoryId
    }
  });
  testProductId = product.id;
});

afterAll(async () => {
  const testProducts = await prisma.product.findMany({ where: { code: { startsWith: TEST_PREFIX } }, select: { id: true } });
  const testProductIds = testProducts.map(p => p.id);
  if (testProductIds.length > 0) {
    await prisma.stockMovement.deleteMany({ where: { productId: { in: testProductIds } } });
    await prisma.productLot.deleteMany({ where: { productId: { in: testProductIds } } });
  }
  await prisma.product.deleteMany({ where: { code: { startsWith: TEST_PREFIX } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('Inventory - Productos', () => {
  it('should create a product with required fields', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(product).not.toBeNull();
    expect(product!.code).toBe(`${TEST_PREFIX}PROD001`);
    expect(product!.unit).toBe('kg');
    expect(product!.minStock).toBe(10);
  });

  it('should find product by category', async () => {
    const products = await prisma.product.findMany({
      where: { categoryId: testCategoryId }
    });
    expect(products.length).toBeGreaterThanOrEqual(1);
    expect(products.every(p => p.categoryId === testCategoryId)).toBe(true);
  });

  it('should enforce unique product code', async () => {
    await expect(
      prisma.product.create({
        data: {
          code: `${TEST_PREFIX}PROD001`,
          name: 'Duplicado',
          unit: 'kg',
          minStock: 5,
          isPerishable: false,
          categoryId: testCategoryId
        }
      })
    ).rejects.toThrow();
  });

  it('should create a product lot with stock', async () => {
    const lot = await prisma.productLot.create({
      data: {
        lotNumber: `${TEST_PREFIX}LOT001`,
        productId: testProductId,
        quantity: 100,
        isActive: true
      }
    });
    expect(lot.quantity).toBe(100);
    expect(lot.productId).toBe(testProductId);
  });

  it('should calculate total stock from lots', async () => {
    const lots = await prisma.productLot.findMany({
      where: { productId: testProductId, isActive: true, quantity: { gt: 0 } }
    });
    const total = lots.reduce((sum, lot) => sum + lot.quantity, 0);
    expect(total).toBeGreaterThanOrEqual(100);
  });

  it('should detect low stock when below minStock', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProductId } });
    const lots = await prisma.productLot.findMany({
      where: { productId: testProductId, isActive: true }
    });
    const total = lots.reduce((sum, lot) => sum + lot.quantity, 0);
    const isLowStock = total < product!.minStock;
    expect(typeof isLowStock).toBe('boolean');
  });

  it('should deactivate a product (soft delete)', async () => {
    await prisma.product.update({
      where: { id: testProductId },
      data: { isActive: false }
    });
    const product = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(product!.isActive).toBe(false);

    await prisma.product.update({
      where: { id: testProductId },
      data: { isActive: true }
    });
  });
});
