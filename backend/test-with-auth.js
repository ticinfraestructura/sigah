const axios = require('axios');

async function testWithAuth() {
  try {
    console.log('🔍 Probando con autenticación real...');
    
    // Primero obtener token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@sigah.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Token obtenido');
    
    // Ahora probar el endpoint de kits
    const kitsResponse = await axios.get('http://localhost:3001/api/kits', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Respuesta del endpoint /kits:');
    console.log('===========================================');
    
    const kits = kitsResponse.data.data;
    kits.forEach((kit, index) => {
      console.log(`${index + 1}. ${kit.code} - ${kit.name}`);
      console.log(`   Inventario: ${JSON.stringify(kit.inventory)}`);
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
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testWithAuth();
