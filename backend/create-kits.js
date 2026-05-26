const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createKits() {
  try {
    // Kit de Alimentos
    const kitAlimentos = await prisma.kit.create({
      data: {
        code: 'KIT-ALI-001',
        name: 'Kit de Alimentos Básico',
        type: 'ALIMENTOS',
        description: 'Kit con alimentos básicos para emergencias',
        kitProducts: {
          create: [
            { productId: '6271248b-4f69-4eb6-9552-f771094a49d8', quantity: 2 }, // Arroz 1kg
            { productId: '69b30ace-d211-4381-a6a4-1917e48e51e6', quantity: 2 }, // Frijoles 500g
            { productId: '764528d1-55d0-44fe-bb63-a4ea3ed23859', quantity: 1 }, // Aceite 1L
            { productId: 'f5118178-3ab7-4b49-9de8-5aa07493971c', quantity: 2 }, // Leche en polvo 400g
            { productId: '68c62bda-bd32-4781-bb07-1a3fc209db25', quantity: 3 }  // Atún en lata 170g
          ]
        }
      }
    });
    console.log('✅ Kit de Alimentos creado:', kitAlimentos.code);

    // Kit de Emergencia
    const kitEmergencia = await prisma.kit.create({
      data: {
        code: 'KIT-EME-001',
        name: 'Kit de Emergencia',
        type: 'EMERGENCIA',
        description: 'Kit de emergencia con artículos esenciales',
        kitProducts: {
          create: [
            { productId: '52b32d3f-a6dc-4258-a64a-2c8b0afc0657', quantity: 1 }, // Manta térmica
            { productId: '38067122-8fbd-420a-8d05-09a63cd6d025', quantity: 1 }, // Linterna
            { productId: '04bf9173-184e-43ea-863c-27c92f58edc8', quantity: 1 }, // Botiquín básico
            { productId: '6271248b-4f69-4eb6-9552-f771094a49d8', quantity: 1 }, // Arroz 1kg
            { productId: '764528d1-55d0-44fe-bb63-a4ea3ed23859', quantity: 1 }  // Aceite 1L
          ]
        }
      }
    });
    console.log('✅ Kit de Emergencia creado:', kitEmergencia.code);

    // Kit de Aseo
    const kitAseo = await prisma.kit.create({
      data: {
        code: 'KIT-HIG-001',
        name: 'Kit de Aseo Personal',
        type: 'HIGIENE',
        description: 'Kit de aseo personal básico',
        kitProducts: {
          create: [
            { productId: 'a7b7d550-4665-4a8c-8f10-aeffcce03068', quantity: 2 }, // Jabón de baño
            { productId: '1524709e-946f-4956-ad68-8be6624c9cf8', quantity: 1 }, // Pasta dental
            { productId: '834a235f-7815-41e8-ac72-e5ea1035dd53', quantity: 1 }, // Cepillo dental
            { productId: '23e3655d-9948-4873-8cba-cb2d06d7c94b', quantity: 2 }, // Toallas sanitarias
            { productId: 'b8929206-0019-43a5-930e-084b9db353f5', quantity: 1 }  // Jabón en barra
          ]
        }
      }
    });
    console.log('✅ Kit de Aseo creado:', kitAseo.code);

    console.log('🎉 Todos los kits creados exitosamente');
  } catch (error) {
    console.error('❌ Error creando kits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createKits();
