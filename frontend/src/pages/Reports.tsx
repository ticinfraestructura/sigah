import { useState } from 'react';
import { FileText, Download, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { reportApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

export default function Reports() {
  const [reportType, setReportType] = useState('requests');
  const [subtype, setSubtype] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const toast = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = { 
        startDate, 
        endDate, 
        subtype,
        search: searchTerm,
        categoryId: selectedCategory,
        status: selectedStatus
      };
      let response;
      switch (reportType) {
        case 'requests': response = await reportApi.getRequests(params); break;
        case 'deliveries': response = await reportApi.getDeliveries(params); break;
        case 'inventory': response = await reportApi.getInventory(params); break;
        case 'kits': response = await reportApi.getKits(params); break;
      }
      setData(response?.data.data || []);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  // Filtrar datos localmente para mejor rendimiento
  const filteredData = data.filter(item => {
    if (searchTerm && !item.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.Código?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory && item.Categoría !== selectedCategory) return false;
    if (selectedStatus && item.Estado !== selectedStatus) return false;
    return true;
  });

  // Obtener categorías únicas para filtros
  const categories = [...new Set(data.map(item => item.Categoría).filter(Boolean))];
  const statuses = [...new Set(data.map(item => item.Estado).filter(Boolean))];

  // Estadísticas para visualización
  const stats = {
    totalProducts: data.length,
    totalStock: data.reduce((sum, item) => sum + (item['Stock Actual'] || 0), 0),
    lowStock: data.filter(item => (item['Stock Actual'] || 0) < (item['Stock Mínimo'] || 10)).length,
    categories: categories.length,
    avgStock: data.length > 0 ? Math.round(data.reduce((sum, item) => sum + (item['Stock Actual'] || 0), 0) / data.length) : 0
  };

  const exportReport = async () => {
    try {
      // Preparar datos para exportación (solo filtrados)
      const exportData = filteredData.length > 0 ? filteredData : data;
      
      // Crear contenido CSV mejorado con metadata
      const timestamp = new Date().toISOString().split('T')[0];
      const filtersText = filteredData.length < data.length ? '_filtrado' : '';
      
      const csvContent = [
        `Reporte: ${reportType} - ${subtype || 'general'}`,
        `Generado: ${new Date().toLocaleString()}`,
        `Total Registros: ${exportData.length}`,
        `Filtros: ${searchTerm || 'Ninguno'}`,
        `Categoría: ${selectedCategory || 'Todas'}`,
        `Período: ${startDate || 'N/A'} - ${endDate || 'N/A'}`,
        '',
        `Estadísticas:`,
        `Total Productos: ${stats.totalProducts}`,
        `Stock Total: ${stats.totalStock}`,
        `Stock Bajo: ${stats.lowStock}`,
        `Categorías: ${stats.categories}`,
        '',
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).map(val => 
          typeof val === 'number' ? val.toLocaleString() : String(val)
        ).join(','))
      ].join('\n');
      
      const content = new TextEncoder().encode(csvContent);
      const url = window.URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${reportType}_${subtype || 'general'}_${timestamp}${filtersText}.csv`;
      link.click();
      
      toast.success(`Reporte exportado: ${exportData.length} registros`);
    } catch (error) { 
      console.error('Error:', error); 
      toast.error('Error al exportar'); 
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="text-gray-500 dark:text-gray-400">Generación de reportes del sistema</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="label">Tipo de Reporte</label>
            <select value={reportType} onChange={(e) => { setReportType(e.target.value); setSubtype(''); }} className="input">
              <option value="requests">Solicitudes</option>
              <option value="deliveries">Entregas</option>
              <option value="inventory">Inventario</option>
              <option value="kits">Kits</option>
            </select>
          </div>
          
          {/* Búsqueda mejorada */}
          <div>
            <label className="label">Buscar</label>
            <input
              type="text"
              placeholder="Código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          
          {/* Filtro por categoría */}
          {(reportType === 'inventory' || reportType === 'kits') && categories.length > 0 && (
            <div>
              <label className="label">Categoría</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input">
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
          {reportType === 'inventory' && (
            <div>
              <label className="label">Subtipo</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className="input">
                <option value="">Seleccionar...</option>
                <option value="stock_actual">Stock Actual</option>
                <option value="stock_kits">Stock de Kits</option>
                <option value="kits_desagregados">Kits Desagregados</option>
                <option value="movimientos">Movimientos</option>
                <option value="historico_eliminaciones">Histórico Eliminaciones</option>
                <option value="por_vencer">Por Vencer</option>
                <option value="bajo_stock">Bajo Stock</option>
              </select>
            </div>
          )}
          {reportType === 'kits' && (
            <div>
              <label className="label">Subtipo</label>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className="input">
                <option value="">Seleccionar...</option>
                <option value="listado">Listado de Kits</option>
                <option value="disponibilidad">Disponibilidad</option>
                <option value="composicion">Composición</option>
                <option value="ingresos">Ingresos de Kits</option>
              </select>
            </div>
          )}
          <div>
            <label className="label">Fecha Inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Fecha Fin</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={loading} className="btn-primary w-full">
              {loading ? 'Generando...' : 'Generar'}
            </button>
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <>
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Stock Total</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalStock.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                </div>
              </div>
            </div>
            
            <div className="card bg-purple-50 border-purple-200">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Categorías</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.categories}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de resultados */}
          {filteredData.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Resultados ({filteredData.length} de {data.length})</h3>
            <div className="text-sm text-gray-500">
              {searchTerm && `Buscando: "${searchTerm}"`}
              {selectedCategory && ` | Categoría: ${selectedCategory}`}
              {selectedStatus && ` | Estado: ${selectedStatus}`}
            </div>
            <div className="flex gap-2">
              <button onClick={exportReport} className="btn-secondary text-sm">
                <Download className="w-4 h-4 mr-1" />
                Exportar CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {filteredData[0] && Object.keys(filteredData[0]).map(key => (
                    <th key={key} className="text-left py-2 px-2 whitespace-nowrap font-medium text-gray-700">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="py-2 px-2 whitespace-nowrap">
                        {typeof val === 'number' ? val.toLocaleString() : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}
        </>
      )}

      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Seleccione los filtros y genere un reporte</p>
        </div>
      )}
    </div>
  );
}
