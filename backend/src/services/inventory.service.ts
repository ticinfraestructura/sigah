import { PrismaClient, Product, ProductLot } from '@prisma/client';

// Movement types (SQLite doesn't support enums)
const MovementType = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN'
} as const;
import { AppError } from '../middleware/error.middleware';

interface LotAllocation {
  lotId: string;
  quantity: number;
  expiryDate: Date | null;
}

export class InventoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Obtiene el stock total de un producto (sumando todos sus lotes)
   */
  async getProductStock(productId: string): Promise<number> {
    const result = await this.prisma.productLot.aggregate({
      where: { productId, isActive: true },
      _sum: { quantity: true }
    });
    return result._sum.quantity || 0;
  }

  /**
   * Obtiene los lotes disponibles de un producto ordenados por FEFO
   */
  async getAvailableLots(productId: string): Promise<ProductLot[]> {
    return this.prisma.productLot.findMany({
      where: { 
        productId, 
        isActive: true,
        quantity: { gt: 0 }
      },
      orderBy: [
        { expiryDate: 'asc' }, // Primero los que vencen antes (FEFO)
        { entryDate: 'asc' }   // Si no tienen fecha, los más antiguos primero (FIFO)
      ]
    });
  }

  /**
   * Asigna lotes siguiendo la estrategia FEFO (First Expired First Out)
   * Retorna los lotes y cantidades a descontar
   */
  async allocateStockFEFO(productId: string, quantityNeeded: number): Promise<LotAllocation[]> {
    const availableLots = await this.getAvailableLots(productId);
    const allocations: LotAllocation[] = [];
    let remaining = quantityNeeded;

    for (const lot of availableLots) {
      if (remaining <= 0) break;

      const toTake = Math.min(lot.quantity, remaining);
      allocations.push({
        lotId: lot.id,
        quantity: toTake,
        expiryDate: lot.expiryDate
      });
      remaining -= toTake;
    }

    if (remaining > 0) {
      throw new AppError(`Stock insuficiente. Faltan ${remaining} unidades del producto`, 400);
    }

    return allocations;
  }

  /**
   * Registra una entrada de inventario
   */
  async registerEntry(
    productId: string,
    quantity: number,
    userId: string,
    lotNumber?: string,
    expiryDate?: Date,
    reason?: string
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    // Si es perecedero, debe tener lote y fecha de vencimiento
    if (product.isPerishable && (!lotNumber || !expiryDate)) {
      throw new AppError('Productos perecederos requieren número de lote y fecha de vencimiento', 400);
    }

    // Crear o actualizar lote
    const actualLotNumber = lotNumber || `LOT-${Date.now()}`;
    const lot = await this.prisma.productLot.upsert({
      where: { productId_lotNumber: { productId, lotNumber: actualLotNumber } },
      create: {
        productId,
        lotNumber: actualLotNumber,
        quantity,
        expiryDate: expiryDate || null
      },
      update: {
        quantity: { increment: quantity }
      }
    });

    // Registrar movimiento
    await this.prisma.stockMovement.create({
      data: {
        productId,
        lotId: lot.id,
        type: MovementType.ENTRY,
        quantity,
        reason: reason || 'Entrada de inventario',
        userId
      }
    });

    return lot;
  }

  /**
   * Registra una salida de inventario usando FEFO
   */
  async registerExit(
    productId: string,
    quantity: number,
    userId: string,
    reason?: string,
    reference?: string
  ) {
    // Obtener asignación FEFO
    const allocations = await this.allocateStockFEFO(productId, quantity);

    // Descontar de cada lote
    for (const allocation of allocations) {
      await this.prisma.productLot.update({
        where: { id: allocation.lotId },
        data: { quantity: { decrement: allocation.quantity } }
      });

      await this.prisma.stockMovement.create({
        data: {
          productId,
          lotId: allocation.lotId,
          type: MovementType.EXIT,
          quantity: -allocation.quantity,
          reason: reason || 'Salida de inventario',
          reference,
          userId
        }
      });
    }

    return allocations;
  }

  /**
   * Registra un ajuste de inventario (positivo o negativo)
   */
  async registerAdjustment(
    productId: string,
    lotId: string,
    quantity: number,
    userId: string,
    reason: string
  ) {
    const lot = await this.prisma.productLot.findUnique({ where: { id: lotId } });
    if (!lot) {
      throw new AppError('Lote no encontrado', 404);
    }

    const newQuantity = lot.quantity + quantity;
    if (newQuantity < 0) {
      throw new AppError('El ajuste resultaría en stock negativo', 400);
    }

    await this.prisma.productLot.update({
      where: { id: lotId },
      data: { quantity: newQuantity }
    });

    await this.prisma.stockMovement.create({
      data: {
        productId,
        lotId,
        type: MovementType.ADJUSTMENT,
        quantity,
        reason,
        userId
      }
    });

    return { lotId, newQuantity };
  }

  /**
   * Registra una devolución al inventario
   */
  async registerReturn(
    productId: string,
    quantity: number,
    userId: string,
    lotId?: string,
    reason?: string,
    reference?: string
  ) {
    let lot: ProductLot;

    if (lotId) {
      // Devolver al lote original
      lot = await this.prisma.productLot.update({
        where: { id: lotId },
        data: { quantity: { increment: quantity } }
      });
    } else {
      // Crear nuevo lote para la devolución
      const lotNumber = `RET-${Date.now()}`;
      lot = await this.prisma.productLot.create({
        data: {
          productId,
          lotNumber,
          quantity
        }
      });
    }

    await this.prisma.stockMovement.create({
      data: {
        productId,
        lotId: lot.id,
        type: MovementType.RETURN,
        quantity,
        reason: reason || 'Devolución',
        reference,
        userId
      }
    });

    return lot;
  }

  /**
   * Obtiene productos próximos a vencer
   */
  async getExpiringProducts(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.productLot.findMany({
      where: {
        isActive: true,
        quantity: { gt: 0 },
        expiryDate: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { expiryDate: 'asc' }
    });
  }

  /**
   * Obtiene productos con stock bajo
   */
  async getLowStockProducts() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, minStock: { gt: 0 } },
      include: { 
        category: true,
        lots: { where: { isActive: true } }
      }
    });

    return products.filter(product => {
      const totalStock = product.lots.reduce((sum, lot) => sum + lot.quantity, 0);
      return totalStock < product.minStock;
    }).map(product => ({
      ...product,
      currentStock: product.lots.reduce((sum, lot) => sum + lot.quantity, 0)
    }));
  }

  /**
   * Obtiene el stock actual agrupado por categoría
   */
  async getStockByCategory() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: {
            lots: { where: { isActive: true } }
          }
        }
      }
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      totalProducts: category.products.length,
      totalStock: category.products.reduce(
        (sum, product) => sum + product.lots.reduce((lotSum, lot) => lotSum + lot.quantity, 0),
        0
      )
    }));
  }
}
