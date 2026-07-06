import { useState, useEffect } from 'react';
import { Boxes, FileSpreadsheet, FileText } from 'lucide-react';
import { kitApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface KitEntry {
  'Fecha': string;
  'Hora': string;
  'Codigo Kit': string;
  'Nombre Kit': string;
  'Lote': string;
  'Cantidad': number;
  'Motivo': string;
  'Referencia': string;
  'Usuario': string;
}

interface Kit {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export default function KitEntriesTab() {
  const toast = useToast();
  const [kitEntries, setKitEntries] = useState<KitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedKit, setSelectedKit] = useState('');
  const [kits, setKits] = useState<Kit[]>([]);

  useEffect(() => {
    fetchKits();
    fetchKitEntries();
  }, []);

  useEffect(() => {
    fetchKitEntries();
  }, [startDate, endDate, selectedKit]);

  const fetchKits = async () => {
    try {
      const response = await kitApi.getAll();
      setKits(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar kits');
    }
  };

  const fetchKitEntries = async () => {
    setLoading(true);
    try {
      const response = await kitApi.getEntries({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        kitCode: selectedKit || undefined
      });
      const data = response.data.data || [];
      console.log('Kit entries loaded:', data.length, data);
      setKitEntries(data);
    } catch (error) {
      console.error('Error loading kit entries:', error);
      toast.error('Error al cargar ingresos de kits');
    } finally {
      setLoading(false);
    }
  };

  const filterByKit = (kitCode: string) => {
    setSelectedKit(kitCode);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedKit('');
  };

  const exportToExcel = async () => {
    try {
      const params: any = {
        reportType: 'kits',
        subtype: 'ingresos',
        data: kitEntries
      };
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedKit) params.filters = { kitCode: selectedKit };

      const response = await fetch('/api/reports/export/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ingresos_kits_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Reporte exportado a Excel exitosamente');
    } catch (error) {
      toast.error('Error al exportar a Excel');
    }
  };

  const exportToPDF = async () => {
    try {
      const params: any = {
        reportType: 'kits',
        subtype: 'ingresos',
        data: kitEntries,
        title: 'Reporte de Ingresos de Kits'
      };
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedKit) params.filters = { kitCode: selectedKit };

      const response = await fetch('/api/reports/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ingresos_kits_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Reporte exportado a PDF exitosamente');
    } catch (error) {
      toast.error('Error al exportar a PDF');
    }
  };

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Kit</label>
            <select value={selectedKit} onChange={(e) => setSelectedKit(e.target.value)} className="input">
              <option value="">Todos los kits</option>
              {kits.map(kit => (
                <option key={kit.id} value={kit.code}>{kit.code} - {kit.name}</option>
              ))}
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
          <div className="flex items-end space-x-2">
            <button onClick={fetchKitEntries} disabled={loading} className="btn-primary">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button onClick={clearFilters} className="btn-secondary">Limpiar</button>
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
          <button 
            onClick={exportToExcel} 
            disabled={loading || kitEntries.length === 0}
            className="btn-success flex items-center space-x-2"
          >
            <FileSpreadsheet size={16} />
            <span>Exportar Excel</span>
          </button>
          <button 
            onClick={exportToPDF} 
            disabled={loading || kitEntries.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            <FileText size={16} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Kit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kits.map(kit => {
          const kitEntryCount = kitEntries.filter(entry => entry['Codigo Kit'] === kit.code).length;
          return (
            <div key={kit.id} className={`card cursor-pointer hover:shadow-md transition-shadow ${selectedKit === kit.code ? 'ring-2 ring-primary-500' : ''}`} onClick={() => filterByKit(kit.code)}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{kit.code}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{kit.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">{kitEntryCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Entries Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ingresos de Kits ({kitEntries.length})</h3>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando ingresos...</p>
          </div>
        ) : kitEntries.length === 0 ? (
          <div className="text-center py-8">
            <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron ingresos de kits</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Fecha</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Hora</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Código Kit</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Nombre Kit</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Cantidad</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Usuario</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {kitEntries.map((entry, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{entry['Fecha']}</td>
                    <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{entry['Hora']}</td>
                    <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">{entry['Codigo Kit']}</td>
                    <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{entry['Nombre Kit']}</td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        +{entry['Cantidad']}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{entry['Usuario']}</td>
                    <td className="py-2 px-2 text-gray-500 dark:text-gray-400 text-xs">{entry['Referencia']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
