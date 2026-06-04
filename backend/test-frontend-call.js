// Simular llamada del frontend para depurar
const axios = require('axios');

async function testFrontendCall() {
  try {
    console.log('🔍 Probando llamada como el frontend...');
    
    // Simular llamada sin autenticación (como el frontend ahora)
    const response = await axios.get('http://localhost:3001/api/inventory/stock', {
      headers: {
        'Content-Type': 'application/json'
        // Sin Authorization header
      }
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data length: ${response.data.data?.length || 0}`);
    console.log(`   Primer producto: ${response.data.data?.[0]?.name || 'N/A'}`);
    console.log(`   Stock total: ${response.data.data?.reduce((sum, p) => sum + p.totalStock, 0) || 0}`);
    
  } catch (error) {
    console.error('❌ Error en la llamada:', error.response?.data || error.message);
  }
}

testFrontendCall();
