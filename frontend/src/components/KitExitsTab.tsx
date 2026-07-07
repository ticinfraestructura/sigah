import { useState, useEffect } from 'react';
import { Boxes, FileText } from 'lucide-react';
import ExportButtons from './ExportButtons';
import { kitApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import KitExits from '../pages/KitExits';

interface KitExit {
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

export default function KitExitsTab() {
  const toast = useToast();
  const [kitExits, setKitExits] = useState<KitExit[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedKit, setSelectedKit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [kits, setKits] = useState<Kit[]>([]);

  useEffect(() => {
    fetchKits();
    fetchKitExits();
  }, []);

  useEffect(() => {
    fetchKitExits();
  }, [startDate, endDate, selectedKit, searchTerm]);

  const fetchKits = async () => {
    try {
      const response = await kitApi.getAll();
      setKits(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar kits');
    }
  };

  const fetchKitExits = async () => {
    try {
      setLoading(true);
      
      // Construir parámetros de consulta
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedKit) params.kitId = selectedKit;
      if (searchTerm) params.search = searchTerm;
      
      const response = await kitApi.getExits(params);
      setKitExits(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar el historial de egresos');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const csvContent = [
      ['Fecha', 'Hora', 'Kit', 'Lote', 'Cantidad', 'Motivo', 'Referencia', 'Usuario'],
      ...kitExits.map(exit => [
        exit['Fecha'],
        exit['Hora'],
        exit['Nombre Kit'],
        exit['Lote'] || 'N/A',
        exit['Cantidad'],
        exit['Motivo'] || 'N/A',
        exit['Referencia'] || 'N/A',
        exit['Usuario']
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `egresos_kits_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  const filteredExits = kitExits.filter(exit => {
    const matchesSearch = !searchTerm || 
      exit['Nombre Kit']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit['Codigo Kit']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit['Motivo']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit['Referencia']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit['Usuario']?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <KitExits />

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
          <Boxes className="w-5 h-5 mr-2" />
          Filtros de Búsqueda
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda general */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Búsqueda
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por kit, motivo, referencia..."
              className="input"
            />
          </div>

          {/* Kit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Kit
            </label>
            <select
              value={selectedKit}
              onChange={(e) => setSelectedKit(e.target.value)}
              className="input"
            >
              <option value="">Todos los kits</option>
              {kits.map(kit => (
                <option key={kit.id} value={kit.id}>
                  {kit.code} - {kit.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Fecha inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Fecha fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Fecha fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={fetchKitExits}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          
          <ExportButtons
            data={filteredExits}
            reportType="kits"
            subtype="egresos"
            title="Reporte de Egresos de Kits"
          />
        </div>
      </div>

      {/* Tabla de egresos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de Egresos ({filteredExits.length} registros)
          </h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando egresos...</p>
          </div>
        ) : filteredExits.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Boxes className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No se encontraron egresos con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código/Nombre Kit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lote</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Referencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExits.map((exit, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div>
                        <div className="font-medium">{exit['Fecha']}</div>
                        <div className="text-gray-500 dark:text-gray-400">{exit['Hora']}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div>
                        <div className="font-medium">{exit['Codigo Kit']}</div>
                        <div className="text-gray-500 dark:text-gray-400">{exit['Nombre Kit']}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{exit['Lote'] || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                        -{exit['Cantidad']}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{exit['Motivo'] || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{exit['Referencia'] || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{exit['Usuario']}</td>
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
