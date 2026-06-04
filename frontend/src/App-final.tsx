import React, { useState, useEffect } from 'react';

export default function AppFinal() {
  const [mostrarLogin, setMostrarLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    // Verificar si ya hay token
    const token = localStorage.getItem('token');
    if (token) {
      setMostrarLogin(false);
      cargarProductos();
    }
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/inventory/stock', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProductos(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje('Iniciando sesión...');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setMostrarLogin(false);
        await cargarProductos();
        setMensaje('¡Sesión iniciada correctamente!');
      } else {
        setMensaje('Error: ' + (data.error || 'Credenciales incorrectas'));
      }
    } catch (error) {
      setMensaje('Error de conexión. Intenta de nuevo.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMostrarLogin(true);
    setProductos([]);
    setMensaje('');
  };

  if (mostrarLogin) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#2563eb', fontSize: '2rem', margin: '0 0 10px' }}>🚀 SIGAH</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Sistema de Ayudas Humanitarias</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: 'bold' }}>
                Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="admin@sigah.com"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: 'bold' }}>
                Contraseña:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="admin123"
                required
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              Ingresar al Sistema
            </button>
          </form>

          {mensaje && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: mensaje.includes('correctamente') ? '#dcfce7' : '#fee2e2',
              color: mensaje.includes('correctamente') ? '#166534' : '#dc2626',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {mensaje}
            </div>
          )}

          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#64748b'
          }}>
            <p style={{ margin: '0 0 10px', fontWeight: 'bold' }}>Credenciales de prueba:</p>
            <p style={{ margin: '5px 0' }}>📧 Email: <strong>admin@sigah.com</strong></p>
            <p style={{ margin: '5px 0' }}>🔑 Contraseña: <strong>admin123</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: '#2563eb', color: 'white', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🚀 SIGAH Dashboard</h1>
            <p style={{ margin: '5px 0 0', opacity: 0.9 }}>Sistema de Gestión de Ayudas Humanitarias</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              backgroundColor: '#dc2626', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px', color: '#64748b' }}>📦 Total Productos</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb', margin: '0' }}>{productos.length}</p>
            <p style={{ margin: '10px 0 0', color: '#64748b' }}>En inventario</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px', color: '#64748b' }}>📊 Stock Total</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
              {productos.reduce((sum, p) => sum + (p.totalStock || 0), 0)}
            </p>
            <p style={{ margin: '10px 0 0', color: '#64748b' }}>Unidades disponibles</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px', color: '#64748b' }}>🏷️ Categorías</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
              {[...new Set(productos.map(p => p.category))].length}
            </p>
            <p style={{ margin: '10px 0 0', color: '#64748b' }}>Tipos de productos</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px', color: '#64748b' }}>⚠️ Stock Bajo</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
              {productos.filter(p => p.isLowStock).length}
            </p>
            <p style={{ margin: '10px 0 0', color: '#64748b' }}>Productos críticos</p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '25px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem' }}>📦 Inventario de Productos</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Código</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Nombre</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Categoría</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Stock</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productos.slice(0, 10).map((product, index) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '15px', color: '#374151', fontWeight: '500' }}>{product.code}</td>
                    <td style={{ padding: '15px', color: '#374151' }}>{product.name}</td>
                    <td style={{ padding: '15px', color: '#374151' }}>{product.category}</td>
                    <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: product.isLowStock ? '#dc2626' : '#16a34a', fontSize: '1.1rem' }}>
                      {product.totalStock}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.9rem', 
                        fontWeight: 'bold',
                        backgroundColor: product.isLowStock ? '#fee2e2' : '#dcfce7',
                        color: product.isLowStock ? '#dc2626' : '#16a34a'
                      }}>
                        {product.isLowStock ? '⚠️ BAJO' : '✅ OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {productos.length > 10 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', borderTop: '1px solid #e5e7eb', fontWeight: 'bold' }}>
              Mostrando 10 de {productos.length} productos
            </div>
          )}
        </div>

        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <button style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '18px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            📦 Ver Inventario Completo
          </button>
          <button style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '18px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            👥 Gestionar Beneficiarios
          </button>
          <button style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '18px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            📋 Crear Solicitud
          </button>
          <button style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '18px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            📊 Ver Reportes
          </button>
        </div>
      </main>

      <footer style={{ backgroundColor: '#1f2937', color: 'white', padding: '25px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ margin: 0, fontSize: '16px' }}>🚀 SIGAH v1.0.0 · Sistema de Gestión de Ayudas Humanitarias · 100% Gratuito</p>
        <p style={{ margin: '10px 0 0', opacity: 0.8 }}>¡Funcionando perfectamente para ti! 💙</p>
      </footer>
    </div>
  );
}
