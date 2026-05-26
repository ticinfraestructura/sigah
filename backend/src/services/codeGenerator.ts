import { PrismaClient } from '@prisma/client';

/**
 * Servicio de generación de códigos alfanuméricos únicos
 * Genera códigos que no son autoincrementales pero garantizan unicidad
 */
export class CodeGenerator {
  private prisma: PrismaClient;
  private readonly MAX_RETRIES = 10;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Genera un código alfanumérico aleatorio de longitud específica
   * @param length Longitud del código (default: 8)
   * @returns Código alfanumérico en mayúsculas
   */
  private generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluye I, O, 0, 1 para evitar confusión
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Genera un código único para un producto
   * Formato: PROD-[CATEGORÍA]-[ALFANUMÉRICO]
   * Ejemplo: PROD-ALI-A3B4C5D6
   * @param categoryCode Código de la categoría (ej: ALI, EME, ASE)
   * @returns Código único de producto
   */
  async generateProductCode(categoryCode: string = 'GEN'): Promise<string> {
    const prefix = `PROD-${categoryCode}`;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const randomPart = this.generateRandomCode(8);
      const code = `${prefix}-${randomPart}`;
      
      // Verificar unicidad
      const existing = await this.prisma.product.findUnique({
        where: { code }
      });
      
      if (!existing) {
        return code;
      }
    }
    
    throw new Error('No se pudo generar un código único después de múltiples intentos');
  }

  /**
   * Genera un código único para un kit
   * Formato: KIT-[TIPO]-[ALFANUMÉRICO]
   * Ejemplo: KIT-EME-X7Y8Z9W0
   * @param kitType Tipo de kit (ej: ALIMENTOS, EMERGENCIA, HIGIENE)
   * @returns Código único de kit
   */
  async generateKitCode(kitType: string = 'GENERAL'): Promise<string> {
    // Mapear tipo a código corto
    const typeMap: Record<string, string> = {
      'ALIMENTOS': 'ALI',
      'EMERGENCIA': 'EME',
      'HIGIENE': 'HIG',
      'GENERAL': 'GEN'
    };
    
    const typeCode = typeMap[kitType] || 'GEN';
    const prefix = `KIT-${typeCode}`;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const randomPart = this.generateRandomCode(8);
      const code = `${prefix}-${randomPart}`;
      
      // Verificar unicidad
      const existing = await this.prisma.kit.findUnique({
        where: { code }
      });
      
      if (!existing) {
        return code;
      }
    }
    
    throw new Error('No se pudo generar un código único después de múltiples intentos');
  }

  /**
   * Genera un código único para un lote de producto
   * Formato: LOT-[AÑO]-[ALFANUMÉRICO]
   * Ejemplo: LOT-2026-A3B4C5D6
   * @returns Código único de lote
   */
  async generateLotCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LOT-${year}`;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const randomPart = this.generateRandomCode(6);
      const code = `${prefix}-${randomPart}`;
      
      // Verificar unicidad
      const existing = await this.prisma.productLot.findFirst({
        where: { lotNumber: code }
      });
      
      if (!existing) {
        return code;
      }
    }
    
    throw new Error('No se pudo generar un código único después de múltiples intentos');
  }

  /**
   * Genera un código único para una referencia de movimiento
   * Formato: REF-[TIPO]-[ALFANUMÉRICO]
   * Ejemplo: REF-ENTRY-X7Y8Z9W0
   * @param type Tipo de movimiento (ENTRY, EXIT, ADJUSTMENT)
   * @returns Código único de referencia
   */
  async generateReferenceCode(type: string = 'ENTRY'): Promise<string> {
    const prefix = `REF-${type}`;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const randomPart = this.generateRandomCode(8);
      const code = `${prefix}-${randomPart}`;
      
      // Verificar unicidad en movimientos de stock
      const existing = await this.prisma.stockMovement.findFirst({
        where: { reference: code }
      });
      
      if (!existing) {
        return code;
      }
    }
    
    throw new Error('No se pudo generar un código único después de múltiples intentos');
  }

  /**
   * Valida si un código sigue el formato esperado
   * @param code Código a validar
   * @param type Tipo de código (PRODUCT, KIT, LOT, REFERENCE)
   * @returns true si el código es válido
   */
  validateCodeFormat(code: string, type: string): boolean {
    const patterns: Record<string, RegExp> = {
      'PRODUCT': /^PROD-[A-Z]{3}-[A-Z0-9]{8}$/,
      'KIT': /^KIT-[A-Z]{3}-[A-Z0-9]{8}$/,
      'LOT': /^LOT-\d{4}-[A-Z0-9]{6}$/,
      'REFERENCE': /^REF-[A-Z]+-[A-Z0-9]{8}$/
    };
    
    const pattern = patterns[type];
    return pattern ? pattern.test(code) : false;
  }
}

export default CodeGenerator;
