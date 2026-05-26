const { PrismaClient } = require('@prisma/client');
const CodeGenerator = require('./dist/services/codeGenerator').CodeGenerator;

const prisma = new PrismaClient();

async function testCodeGenerator() {
  try {
    console.log('🧪 Probando generador de códigos...\n');

    const codeGenerator = new CodeGenerator(prisma);

    // Probar generación de código de producto
    console.log('📦 Generando código de producto...');
    const productCode = await codeGenerator.generateProductCode('ALI');
    console.log(`✅ Código de producto: ${productCode}`);
    console.log(`   Formato válido: ${codeGenerator.validateCodeFormat(productCode, 'PRODUCT')}\n`);

    // Probar generación de código de kit
    console.log('🎁 Generando código de kit...');
    const kitCode = await codeGenerator.generateKitCode('EMERGENCIA');
    console.log(`✅ Código de kit: ${kitCode}`);
    console.log(`   Formato válido: ${codeGenerator.validateCodeFormat(kitCode, 'KIT')}\n`);

    // Probar generación de código de lote
    console.log('📋 Generando código de lote...');
    const lotCode = await codeGenerator.generateLotCode();
    console.log(`✅ Código de lote: ${lotCode}`);
    console.log(`   Formato válido: ${codeGenerator.validateCodeFormat(lotCode, 'LOT')}\n`);

    // Probar generación de código de referencia
    console.log('🔖 Generando código de referencia...');
    const refCode = await codeGenerator.generateReferenceCode('ENTRY');
    console.log(`✅ Código de referencia: ${refCode}`);
    console.log(`   Formato válido: ${codeGenerator.validateCodeFormat(refCode, 'REFERENCE')}\n`);

    console.log('🎉 Pruebas completadas exitosamente');

  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCodeGenerator();
