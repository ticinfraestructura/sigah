const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function createSampleData() {
  try {
    console.log('🔧 Creando datos de ejemplo basados en el backup...');
    
    // Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    
    // Crear categorías
    console.log('📂 Creando categorías...');
    const categories = [
      { id: 'cat-alimentos', name: 'Alimentos', description: 'Productos alimenticios básicos', isActive: true },
      { id: 'cat-higiene', name: 'Higiene', description: 'Productos de aseo personal', isActive: true },
      { id: 'cat-emergencia', name: 'Emergencia', description: 'Artículos de emergencia', isActive: true },
      { id: 'cat-medicina', name: 'Medicina', description: 'Productos médicos y de salud', isActive: true }
    ];
    
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: cat,
        create: cat
      });
    }
    
    // Crear productos
    console.log('📦 Creando productos...');
    const products = [
      { code: 'ALI-001', name: 'Arroz blanco', description: 'Arroz blanco grano largo', categoryId: 'cat-alimentos', unit: 'KG', isPerishable: false, minStock: 100 },
      { code: 'ALI-002', name: 'Frijoles rojos', description: 'Frijoles rojos secos', categoryId: 'cat-alimentos', unit: 'KG', isPerishable: false, minStock: 80 },
      { code: 'ALI-003', name: 'Aceite vegetal', description: 'Aceite vegetal comestible', categoryId: 'cat-alimentos', unit: 'L', isPerishable: false, minStock: 50 },
      { code: 'ALI-004', name: 'Leche en polvo', description: 'Leche en polvo entera', categoryId: 'cat-alimentos', unit: 'PACK', isPerishable: true, minStock: 60 },
      { code: 'HIG-001', name: 'Jabón de baño', description: 'Jabón de baño antibacterial', categoryId: 'cat-higiene', unit: 'UNIDAD', isPerishable: false, minStock: 200 },
      { code: 'HIG-002', name: 'Pasta dental', description: 'Pasta dental familiar', categoryId: 'cat-higiene', unit: 'UNIDAD', isPerishable: false, minStock: 150 },
      { code: 'HIG-003', name: 'Pañales', description: 'Pañales para bebés', categoryId: 'cat-higiene', unit: 'PACK', isPerishable: false, minStock: 100 },
      { code: 'EME-001', name: 'Linterna', description: 'Linterna LED con baterías', categoryId: 'cat-emergencia', unit: 'UNIDAD', isPerishable: false, minStock: 50 },
      { code: 'EME-002', name: 'Radio de baterías', description: 'Radio portátil a baterías', categoryId: 'cat-emergencia', unit: 'UNIDAD', isPerishable: false, minStock: 30 }
    ];
    
    for (const prod of products) {
      await prisma.product.upsert({
        where: { code: prod.code },
        update: prod,
        create: prod
      });
    }
    
    // Crear kits
    console.log('📦 Creando kits...');
    const kits = [
      { code: 'KIT-ALI-001', name: 'Kit Alimentario Básico', description: 'Kit con alimentos básicos para una familia' },
      { code: 'KIT-HIG-001', name: 'Kit de Higiene Personal', description: 'Kit con artículos de aseo personal' },
      { code: 'KIT-EME-001', name: 'Kit de Emergencia', description: 'Kit con artículos de emergencia' }
    ];
    
    for (const kit of kits) {
      await prisma.kit.upsert({
        where: { code: kit.code },
        update: kit,
        create: kit
      });
    }
    
    // Crear beneficiarios
    console.log('👥 Creando beneficiarios...');
    const beneficiaries = [
      { documentType: 'CC', documentNumber: '1122334455', firstName: 'Ana', lastName: 'Martínez Silva', phone: '3205551234', address: 'Avenida 8 #12-45', city: 'Cali', populationType: 'REFUGEE', familySize: 5 },
      { documentType: 'CC', documentNumber: '0987654321', firstName: 'María', lastName: 'López Rodríguez', phone: '3109876543', address: 'Carrera 5 #15-20', city: 'Medellín', populationType: 'VULNERABLE', familySize: 3 },
      { documentType: 'TI', documentNumber: '987654321', firstName: 'Carlos', lastName: 'Gómez Pérez', phone: '3151234567', address: 'Calle 10 #20-30', city: 'Bogotá', populationType: 'DISPLACED', familySize: 4 },
      { documentType: 'CC', documentNumber: '555666777', firstName: 'Laura', lastName: 'Díaz Torres', phone: '3009876543', address: 'Transversal 3 #45-60', city: 'Barranquilla', populationType: 'ELDERLY', familySize: 2 },
      { documentType: 'CE', documentNumber: '123456789', firstName: 'Pedro', lastName: 'Ramírez Castro', phone: '3215558888', address: 'Diagonal 7 #30-40', city: 'Bucaramanga', populationType: 'DISABLED', familySize: 6 }
    ];
    
    for (const ben of beneficiaries) {
      await prisma.beneficiary.upsert({
        where: { 
          documentType_documentNumber: {
            documentType: ben.documentType,
            documentNumber: ben.documentNumber
          }
        },
        update: ben,
        create: ben
      });
    }
    
    // Actualizar usuario admin
    console.log('👤 Actualizando usuario admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@sigah.com' },
      update: { 
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Sistema'
      },
      create: {
        email: 'admin@sigah.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Sistema',
        isActive: true
      }
    });
    
    // Omitir creación de solicitudes por ahora
    console.log('📋 Omitiendo creación de solicitudes (requiere relación compleja)...');
    
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    
    // Verificar datos creados
    const counts = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.kit.count(),
      prisma.beneficiary.count(),
      prisma.user.count()
    ]);
    
    console.log('✅ Datos de ejemplo creados exitosamente:');
    console.log(`   Categorías: ${counts[0]}`);
    console.log(`   Productos: ${counts[1]}`);
    console.log(`   Kits: ${counts[2]}`);
    console.log(`   Beneficiarios: ${counts[3]}`);
    console.log(`   Usuarios: ${counts[4]}`);
    
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Email: admin@sigah.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
