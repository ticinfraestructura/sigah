import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_PREFIX = 'TEST_KIT_';
let testKitId: string;
let testCategoryId: string;
let testProductId: string;

beforeAll(async () => {
  // Limpieza previa en orden de dependencias
  const testKits = await prisma.kit.findMany({ where: { code: { startsWith: TEST_PREFIX } }, select: { id: true } });
  const testKitIds = testKits.map(k => k.id);
  if (testKitIds.length > 0) {
    await prisma.kitInventoryMovement.deleteMany({
      where: { kitInventory: { kitId: { in: testKitIds } } }
    });
    await prisma.kitInventory.deleteMany({ where: { kitId: { in: testKitIds } } });
    await prisma.kitProduct.deleteMany({ where: { kitId: { in: testKitIds } } });
  }
  await prisma.kit.deleteMany({ where: { code: { startsWith: TEST_PREFIX } } });

  const testProducts = await prisma.product.findMany({ where: { code: { startsWith: TEST_PREFIX } }, select: { id: true } });
  if (testProducts.length > 0) {
    await prisma.productLot.deleteMany({ where: { productId: { in: testProducts.map(p => p.id) } } });
  }
  await prisma.product.deleteMany({ where: { code: { startsWith: TEST_PREFIX } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });

  // Crear datos de prueba
  const cat = await prisma.category.create({
    data: { name: `${TEST_PREFIX}Higiene`, description: 'Cat prueba kits' }
  });
  testCategoryId = cat.id;

  const product = await prisma.product.create({
    data: {
      code: `${TEST_PREFIX}PROD001`,
      name: `${TEST_PREFIX}Jabón`,
      unit: 'unidad',
      minStock: 5,
      isPerishable: false,
      categoryId: testCategoryId
    }
  });
  testProductId = product.id;

  const kit = await prisma.kit.create({
    data: { code: `${TEST_PREFIX}KIT001`, name: `${TEST_PREFIX}Kit Higiene` }
  });
  testKitId = kit.id;
});

afterAll(async () => {
  const testKits = await prisma.kit.findMany({ where: { code: { startsWith: TEST_PREFIX } }, select: { id: true } });
  const testKitIds = testKits.map(k => k.id);
  if (testKitIds.length > 0) {
    await prisma.kitInventoryMovement.deleteMany({
      where: { kitInventory: { kitId: { in: testKitIds } } }
    });
    await prisma.kitInventory.deleteMany({ where: { kitId: { in: testKitIds } } });
    await prisma.kitProduct.deleteMany({ where: { kitId: { in: testKitIds } } });
  }
  await prisma.kit.deleteMany({ where: { code: { startsWith: TEST_PREFIX } } });

  const testProducts = await prisma.product.findMany({ where: { code: { startsWith: TEST_PREFIX } }, select: { id: true } });
  if (testProducts.length > 0) {
    await prisma.productLot.deleteMany({ where: { productId: { in: testProducts.map(p => p.id) } } });
  }
  await prisma.product.deleteMany({ where: { code: { startsWith: TEST_PREFIX } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('Kits', () => {
  it('should create a kit with code and name', async () => {
    const kit = await prisma.kit.findUnique({ where: { id: testKitId } });
    expect(kit).not.toBeNull();
    expect(kit!.code).toBe(`${TEST_PREFIX}KIT001`);
    expect(kit!.isActive).toBe(true);
  });

  it('should enforce unique kit code', async () => {
    await expect(
      prisma.kit.create({ data: { code: `${TEST_PREFIX}KIT001`, name: 'Duplicado' } })
    ).rejects.toThrow();
  });

  it('should add product to kit (KitProduct)', async () => {
    const kitProduct = await prisma.kitProduct.create({
      data: { kitId: testKitId, productId: testProductId, quantity: 2 }
    });
    expect(kitProduct.quantity).toBe(2);
    expect(kitProduct.kitId).toBe(testKitId);
  });

  it('should list kit products with relations', async () => {
    const kit = await prisma.kit.findUnique({
      where: { id: testKitId },
      include: { kitProducts: { include: { product: true } } }
    });
    expect(kit!.kitProducts.length).toBeGreaterThanOrEqual(1);
    expect(kit!.kitProducts[0].product).not.toBeNull();
  });

  it('should create kit inventory entry', async () => {
    const inventory = await prisma.kitInventory.create({
      data: { kitId: testKitId, quantity: 10 }
    });
    expect(inventory.quantity).toBe(10);
    expect(inventory.kitId).toBe(testKitId);
  });

  it('should update kit inventory quantity', async () => {
    const inventory = await prisma.kitInventory.findUnique({ where: { kitId: testKitId } });
    const updated = await prisma.kitInventory.update({
      where: { id: inventory!.id },
      data: { quantity: inventory!.quantity - 3 }
    });
    expect(updated.quantity).toBe(7);
  });

  it('should deactivate a kit (soft delete)', async () => {
    await prisma.kit.update({ where: { id: testKitId }, data: { isActive: false } });
    const kit = await prisma.kit.findUnique({ where: { id: testKitId } });
    expect(kit!.isActive).toBe(false);
    await prisma.kit.update({ where: { id: testKitId }, data: { isActive: true } });
  });
});
