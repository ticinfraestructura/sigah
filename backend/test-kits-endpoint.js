const axios = require('axios');

async function testKitsEndpoint() {
  try {
    console.log('🔍 Probando endpoint /kits directamente...');
    
    // Probar el endpoint de kits
    const response = await axios.get('http://localhost:3001/api/kits', {
      headers: {
        'Authorization': 'Bearer fake-token-for-test'
      }
    });
    
    console.log('✅ Respuesta del endpoint:');
    console.log('===========================================');
    
    const kits = response.data.data;
    kits.forEach((kit, index) => {
      console.log(`${index + 1}. ${kit.code} - ${kit.name}`);
      console.log(`   Inventario:`, kit.inventory);
      console.log(`   TotalAvailable: ${kit.totalAvailable || 'No definido'}`);
      console.log('');
    });
    
    // Verificar específicamente KIT-ALI-001
    const kitAli001 = kits.find(k => k.code === 'KIT-ALI-001');
    if (kitAli001) {
      console.log('🎯 KIT-ALI-001 encontrado:');
      console.log(`   Código: ${kitAli001.code}`);
      console.log(`   Nombre: ${kitAli001.name}`);
      console.log(`   Inventario: ${JSON.stringify(kitAli001.inventory)}`);
      console.log(`   Cantidad en inventario: ${kitAli001.inventory?.[0]?.quantity || 0}`);
    } else {
      console.log('❌ KIT-ALI-001 NO encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error al probar endpoint:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testKitsEndpoint();
