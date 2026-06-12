import { useState, useEffect } from 'react';
import { inventoryApi } from '../services/api';

export default function InventoryDebug() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Iniciando fetch de datos...');
        setLoading(true);
        
        const response = await inventoryApi.getStock({});
        console.log('📦 Respuesta de API:', response);
        
        if (response.data && response.data.success) {
          console.log('✅ Datos recibidos:', response.data.data);
          setData(response.data.data);
          setError('');
        } else {
          console.error('❌ Respuesta inválida:', response);
          setError('Respuesta inválida');
        }
      } catch (err: any) {
        console.error('❌ Error en fetch:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug de Inventario</h1>
      
      {loading && <p>Cargando...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <strong>Estado:</strong> {data.length} productos cargados
      </div>
      
      {data.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Primeros 5 productos:</h2>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Código</th>
                <th className="border px-4 py-2">Nombre</th>
                <th className="border px-4 py-2">Categoría</th>
                <th className="border px-4 py-2">Stock</th>
                <th className="border px-4 py-2">Unidad</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((product) => (
                <tr key={product.id}>
                  <td className="border px-4 py-2">{product.code}</td>
                  <td className="border px-4 py-2">{product.name}</td>
                  <td className="border px-4 py-2">{product.category}</td>
                  <td className="border px-4 py-2 font-bold">{product.totalStock}</td>
                  <td className="border px-4 py-2">{product.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Resumen:</h3>
            <p>Total productos: {data.length}</p>
            <p>Stock total: {data.reduce((sum, p) => sum + p.totalStock, 0)} unidades</p>
            <p>Productos con stock bajo: {data.filter(p => p.isLowStock).length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
