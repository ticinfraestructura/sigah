import { useState, useEffect } from 'react';
import { Boxes, FileSpreadsheet, FileText } from 'lucide-react';
import { kitApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import KitExits from '../pages/KitExits';

interface KitExit {
  fecha: string;
  hora: string;
  productCode: string;
  productName: string;
  lotNumber: string;
  quantity: number;
  reason: string;
  reference: string;
  user: string;
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
        exit.fecha,
        exit.hora,
        exit.productName,
        exit.lotNumber || 'N/A',
        exit.quantity,
        exit.reason || 'N/A',
        exit.reference || 'N/A',
        exit.user
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
      exit.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <KitExits />

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Boxes className="w-5 h-5 mr-2" />
          Filtros de Búsqueda
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda general */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por kit, motivo, referencia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Kit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kit
            </label>
            <select
              value={selectedKit}
              onChange={(e) => setSelectedKit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            disabled={filteredExits.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabla de egresos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código/Nombre Kit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExits.map((exit, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{exit.fecha}</div>
                        <div className="text-gray-500">{exit.hora}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{exit.productCode}</div>
                        <div className="text-gray-500">{exit.productName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exit.lotNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        -{exit.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exit.reason || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exit.reference || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exit.user}
                    </td>
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
