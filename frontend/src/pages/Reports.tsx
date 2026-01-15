import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { reportApi } from '../services/api';

export default function Reports() {
  const [reportType, setReportType] = useState('requests');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = { startDate, endDate };
      let response;
      switch (reportType) {
        case 'requests': response = await reportApi.getRequests(params); break;
        case 'deliveries': response = await reportApi.getDeliveries(params); break;
        case 'inventory': response = await reportApi.getInventory(params); break;
      }
      setData(response?.data.data || []);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      const response = format === 'excel' 
        ? await reportApi.exportExcel(reportType, { startDate, endDate })
        : await reportApi.exportPdf(reportType, { startDate, endDate });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
    } catch (error) { console.error('Error:', error); alert('Error al exportar'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="text-gray-500 dark:text-gray-400">Generación de reportes del sistema</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Tipo de Reporte</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="input">
              <option value="requests">Solicitudes</option>
              <option value="deliveries">Entregas</option>
              <option value="inventory">Movimientos Inventario</option>
            </select>
          </div>
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
