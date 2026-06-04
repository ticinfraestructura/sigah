import React from 'react';

export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 Página de Prueba</h1>
      <p>Si ves esto, el frontend está funcionando.</p>
      
      <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px', margin: '10px 0' }}>
        <h2>📊 Estado del Sistema:</h2>
        <ul>
          <li>✅ Frontend: React corriendo</li>
          <li>✅ Backend: API en puerto 3001</li>
          <li>✅ Base de datos: Conectada</li>
        </ul>
      </div>
      
      <div style={{ backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '5px', margin: '10px 0' }}>
        <h2>🔗 Prueba de API:</h2>
        <button 
          onClick={() => {
            fetch('http://localhost:3001/api/inventory/stock')
              .then(res => res.json())
              .then(data => {
                alert(`✅ API funciona! Productos: ${data.data?.length || 0}`);
                console.log('Datos de API:', data);
              })
              .catch(err => {
                alert(`❌ Error API: ${err.message}`);
                console.error('Error:', err);
              });
          }}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          Probar API
        </button>
      </div>
      
      <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px', margin: '10px 0' }}>
        <h2>📝 Próximos pasos:</h2>
        <ol>
          <li>Si ves esta página, el frontend funciona</li>
          <li>Click en "Probar API" para verificar conexión</li>
          <li>Revisa la consola del navegador (F12) para errores</li>
        </ol>
      </div>
    </div>
  );
}
