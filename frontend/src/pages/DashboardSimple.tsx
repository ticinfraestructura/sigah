import { useState, useEffect } from 'react';

type DashboardProduct = {
  id: string;
  code: string;
  name: string;
  category: string;
  totalStock: number;
  isLowStock: boolean;
};

export default function DashboardSimple() {
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos del inventario
    fetch('http://localhost:3001/api/inventory/stock', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setProducts(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando datos:', err);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #2563eb', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#2563eb', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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
              padding: '8px 16px', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#64748b' }}>Total Productos</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>{products.length}</p>
            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>En inventario</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#64748b' }}>Stock Total</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
              {products.reduce((sum, p) => sum + p.totalStock, 0)}
            </p>
            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Unidades disponibles</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#64748b' }}>Categorías</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
              {[...new Set(products.map(p => p.category))].length}
            </p>
            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Tipos de productos</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#64748b' }}>Stock Bajo</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
              {products.filter(p => p.isLowStock).length}
            </p>
            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Productos críticos</p>
          </div>
        </div>

        {/* Products Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, color: '#1f2937' }}>📦 Inventario de Productos</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#64748b' }}>Código</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#64748b' }}>Nombre</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#64748b' }}>Categoría</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#64748b' }}>Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#64748b' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 10).map((product, index) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '12px', color: '#374151' }}>{product.code}</td>
                    <td style={{ padding: '12px', color: '#374151' }}>{product.name}</td>
                    <td style={{ padding: '12px', color: '#374151' }}>{product.category}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: product.isLowStock ? '#dc2626' : '#16a34a' }}>
                      {product.totalStock}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        backgroundColor: product.isLowStock ? '#fee2e2' : '#dcfce7',
                        color: product.isLowStock ? '#dc2626' : '#16a34a'
                      }}>
                        {product.isLowStock ? 'BAJO' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {products.length > 10 && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', borderTop: '1px solid #e5e7eb' }}>
              Mostrando 10 de {products.length} productos
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            border: 'none', 
            padding: '1rem', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '1rem'
          }}>
            📦 Ver Inventario Completo
          </button>
          <button style={{ 
            backgroundColor: '#16a34a', 
            color: 'white', 
            border: 'none', 
            padding: '1rem', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '1rem'
          }}>
            👥 Gestionar Beneficiarios
          </button>
          <button style={{ 
            backgroundColor: '#f59e0b', 
            color: 'white', 
            border: 'none', 
            padding: '1rem', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '1rem'
          }}>
            📋 Crear Solicitud
          </button>
          <button style={{ 
            backgroundColor: '#8b5cf6', 
            color: 'white', 
            border: 'none', 
            padding: '1rem', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '1rem'
          }}>
            📊 Ver Reportes
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1f2937', color: 'white', padding: '1rem', textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ margin: 0 }}>SIGAH v1.0.0 · Sistema de Gestión de Ayudas Humanitarias · 100% Gratuito</p>
      </footer>
    </div>
  );
}
