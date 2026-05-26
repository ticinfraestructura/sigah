import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { reportApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

export default function Reports() {
  const [reportType, setReportType] = useState('requests');
  const [subtype, setSubtype] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = { startDate, endDate, subtype };
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

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      const params = { startDate, endDate, subtype };
      const response = format === 'excel' 
        ? await reportApi.exportExcel(reportType, params)
        : await reportApi.exportPdf(reportType, params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
    } catch (error) { console.error('Error:', error); toast.error('Error al exportar'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="text-gray-500 dark:text-gray-400">Generación de reportes del sistema</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">Tipo de Reporte</label>
            <select value={reportType} onChange={(e) => { setReportType(e.target.value); setSubtype(''); }} className="input">
              <option value="requests">Solicitudes</option>
              <option value="deliveries">Entregas</option>
              <option value="inventory">Inventario</option>
              <option value="kits">Kits</option>
            </select>
          </div>
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
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Resultados ({data.length})</h3>
            <div className="flex gap-2">
              <button onClick={() => exportReport('excel')} className="btn-secondary text-sm">
                <Download className="w-4 h-4 mr-1" /> Excel
              </button>
              <button onClick={() => exportReport('pdf')} className="btn-secondary text-sm">
                <Download className="w-4 h-4 mr-1" /> PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {data[0] && Object.keys(data[0]).map(key => (
                    <th key={key} className="text-left py-2 px-2 whitespace-nowrap">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="py-2 px-2 whitespace-nowrap">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
