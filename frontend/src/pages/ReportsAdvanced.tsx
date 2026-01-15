import { useState, useEffect } from 'react';
import { 
  FileText, Download, Filter, Eye, RefreshCw,
  Package, Users, ClipboardList, Truck, CheckSquare, RotateCcw,
  Boxes, ChevronDown, ChevronUp, Settings, Table, BarChart3,
  Printer, X
} from 'lucide-react';
import { reportApi } from '../services/api';

// Tipos de reportes
interface ReportSubtype {
  id: string;
  name: string;
  description: string;
}

interface ReportType {
  name: string;
  description: string;
  subtypes: ReportSubtype[];
}

interface ReportField {
  id: string;
  name: string;
  default: boolean;
}

const REPORT_ICONS: Record<string, any> = {
  inventory: Package,
  kits: Boxes,
  beneficiaries: Users,
  requests: ClipboardList,
  deliveries: Truck,
  authorizations: CheckSquare,
  returns: RotateCcw
};

const REPORT_COLORS: Record<string, string> = {
  inventory: 'bg-blue-100 text-blue-600 border-blue-200',
  kits: 'bg-purple-100 text-purple-600 border-purple-200',
  beneficiaries: 'bg-green-100 text-green-600 border-green-200',
  requests: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  deliveries: 'bg-cyan-100 text-cyan-600 border-cyan-200',
  authorizations: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  returns: 'bg-red-100 text-red-600 border-red-200'
};

export default function ReportsAdvanced() {
  const [reportTypes, setReportTypes] = useState<Record<string, ReportType>>({});
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('');
  const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filters] = useState<Record<string, any>>({});
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [quickStats, setQuickStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar tipos de reportes
  useEffect(() => {
    loadReportTypes();
  }, []);

  // Cargar campos cuando cambia el tipo
  useEffect(() => {
    if (selectedType) {
      loadQuickStats(selectedType);
      // Seleccionar primer subtipo por defecto
      const subtypes = reportTypes[selectedType]?.subtypes;
      if (subtypes && subtypes.length > 0) {
        setSelectedSubtype(subtypes[0].id);
      }
    }
  }, [selectedType, reportTypes]);

  // Recargar campos cuando cambia el subtipo
  useEffect(() => {
    if (selectedType && selectedSubtype) {
      loadFields(selectedType, selectedSubtype);
    }
  }, [selectedType, selectedSubtype]);

  const loadReportTypes = async () => {
    try {
      const response = await reportApi.getTypes();
      setReportTypes(response.data.data);
    } catch (error) {
      console.error('Error loading report types:', error);
    }
  };

  const loadFields = async (type: string, subtype?: string) => {
    try {
      const response = await reportApi.getFields(type, subtype);
      const fields = response.data.data;
      setAvailableFields(fields);
      // Seleccionar TODOS los campos por defecto para subtipos especiales que requieren más info
      const specialSubtypes = ['historico_eliminaciones', 'movimientos', 'trazabilidad', 'cancelaciones'];
      if (subtype && specialSubtypes.includes(subtype)) {
        // Para estos subtipos, seleccionar todos los campos
        setSelectedFields(fields.map((f: ReportField) => f.id));
      } else {
        // Para otros, seleccionar solo los marcados como default
        setSelectedFields(fields.filter((f: ReportField) => f.default).map((f: ReportField) => f.id));
      }
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  };

  const loadQuickStats = async (type: string) => {
    try {
      const response = await reportApi.getQuickStats(type);
      setQuickStats(response.data.data);
    } catch (error) {
      setQuickStats(null);
    }
  };

  const generateReport = async () => {
    if (!selectedType) {
      setError('Seleccione un tipo de reporte');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await reportApi.generate({
        reportType: selectedType,
        subtype: selectedSubtype,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        fields: selectedFields.length > 0 ? selectedFields : undefined,
        filters
      });
      setData(response.data.data || []);
      setSummary(response.data.summary);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al generar reporte. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'pdf') => {
    if (!selectedType) {
      setError('Seleccione un tipo de reporte');
      return;
    }

    setError(null);
    try {
      const response = await reportApi.export(format, {
        reportType: selectedType,
        subtype: selectedSubtype,
        startDate,
        endDate,
        filters,
        data: data.length > 0 ? data : undefined
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${selectedType}_${selectedSubtype}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al exportar el reporte. Intente nuevamente.');
    }
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(availableFields.map(f => f.id));
  };

  const selectDefaultFields = () => {
    setSelectedFields(availableFields.filter(f => f.default).map(f => f.id));
  };

  const setQuickDateRange = (range: string) => {
    const today = new Date();
    let start = new Date();
    
    switch (range) {
      case 'today':
        start = today;
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Obtener nombre del reporte actual
  const getReportTitle = () => {
    const type = reportTypes[selectedType];
    const subtype = type?.subtypes.find(s => s.id === selectedSubtype);
    return `${type?.name || 'Reporte'} - ${subtype?.name || ''}`;
  };

  // Generar PDF y mostrar en modal
  const handleViewPdf = async () => {
    if (data.length === 0) {
      setError('Primero genere un reporte');
      return;
    }

    setGeneratingPdf(true);
    try {
      const response = await reportApi.export('pdf', {
        reportType: selectedType,
        subtype: selectedSubtype,
        startDate,
        endDate,
        filters,
        data,
        title: getReportTitle()
      });
      
      // Crear URL del blob para el visor
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Limpiar URL anterior si existe
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
      
      setPdfUrl(url);
      setShowPdfModal(true);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al generar el PDF. Intente nuevamente.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Cerrar modal y limpiar URL
  const closePdfModal = () => {
    setShowPdfModal(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  // Imprimir PDF desde el iframe
  const handlePrintPdf = () => {
    const iframe = document.getElementById('pdf-viewer') as HTMLIFrameElement;
    if (iframe) {
      iframe.contentWindow?.print();
    }
  };

  // Descargar PDF
  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `reporte_${selectedType}_${selectedSubtype}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    }
  };

  return (
    <>
      {/* Modal de Vista Previa PDF */}
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{getReportTitle()}</h2>
                <p className="text-sm text-gray-500">
                  {data.length} registros | Generado: {new Date().toLocaleString('es-ES')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrintPdf}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button 
                  onClick={handleDownloadPdf}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> Descargar
                </button>
                <button 
                  onClick={closePdfModal}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" /> Cerrar
                </button>
              </div>
            </div>
            
            {/* Visor PDF */}
            <div className="flex-1 bg-gray-200 p-2">
              <iframe
                id="pdf-viewer"
                src={pdfUrl}
                className="w-full h-full rounded-lg border-0"
                title="Vista previa del reporte"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de Reportes</h1>
            <p className="text-gray-500">Reportes parametrizables con vista previa e impresión</p>
          </div>
          {data.length > 0 && (
            <div className="flex gap-2">
              <button 
                onClick={handleViewPdf} 
                disabled={generatingPdf}
                className="btn-primary"
              >
                {generatingPdf ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generando...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" /> Ver / Imprimir PDF
                  </>
                )}
              </button>
              <button onClick={() => exportReport('excel')} className="btn-secondary">
                <Download className="w-4 h-4 mr-2" /> Excel
              </button>
            </div>
          )}
        </div>

      {/* Banner de Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-medium text-red-800">Error al procesar</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Selector de Tipo de Reporte */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(reportTypes).map(([key, type]) => {
          const Icon = REPORT_ICONS[key] || FileText;
          const isSelected = selectedType === key;
          return (
            <button
              key={key}
              onClick={() => {
                setSelectedType(key);
                setData([]);
                setSummary(null);
                setError(null);
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected 
                  ? `${REPORT_COLORS[key]} border-current ring-2 ring-offset-2` 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${isSelected ? '' : 'text-gray-700'}`}>{type.name}</p>
            </button>
          );
        })}
      </div>

      {selectedType && (
        <>
          {/* Quick Stats */}
          {quickStats && (
            <div className="card p-4 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Vista Rápida - {reportTypes[selectedType]?.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(quickStats).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof value === 'object' ? Object.keys(value as object).length : String(value)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuración del Reporte */}
          <div className="card">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => setShowFilters(!showFilters)}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold">Configuración del Reporte</h3>
              </div>
              {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {showFilters && (
              <div className="p-4 pt-0 space-y-4">
                {/* Subtipo */}
                <div>
                  <label className="label">Tipo de Vista</label>
                  <div className="flex flex-wrap gap-2">
                    {reportTypes[selectedType]?.subtypes.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubtype(sub.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedSubtype === sub.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                        }`}
                        title={sub.description}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Fecha Inicio</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className="input" 
                    />
                  </div>
                  <div>
                    <label className="label">Fecha Fin</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className="input" 
                    />
                  </div>
                  <div>
                    <label className="label">Rangos Rápidos</label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'today', label: 'Hoy' },
                        { id: 'week', label: '7 días' },
                        { id: 'month', label: '30 días' },
                        { id: 'quarter', label: '3 meses' },
                        { id: 'year', label: '1 año' }
                      ].map(r => (
                        <button
                          key={r.id}
                          onClick={() => setQuickDateRange(r.id)}
                          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded transition-colors"
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selector de Campos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Campos a Mostrar</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={selectAllFields}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Todos
                      </button>
                      <button 
                        onClick={selectDefaultFields}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Por defecto
                      </button>
                      <button 
                        onClick={() => setShowFieldSelector(!showFieldSelector)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {showFieldSelector && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      {availableFields.map(field => (
                        <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.id)}
                            onChange={() => toggleField(field.id)}
                            className="rounded text-primary-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{field.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedFields.map(fieldId => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return field ? (
                        <span key={fieldId} className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {field.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Botón Generar */}
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setData([]);
                      setSummary(null);
                      setStartDate('');
                      setEndDate('');
                      selectDefaultFields();
                    }}
                    className="btn-secondary"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Limpiar
                  </button>
                  <button 
                    onClick={generateReport}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generando...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" /> Generar Reporte
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resultados */}
          {data.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="font-semibold">Resultados</h3>
                  <p className="text-sm text-gray-500">
                    {summary?.totalRecords} registros encontrados
                    {summary?.filters?.startDate && ` | ${summary.filters.startDate} - ${summary.filters.endDate}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded ${viewMode === 'table' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                  >
                    <Table className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded ${viewMode === 'cards' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {data[0] && Object.keys(data[0]).map(key => (
                          <th key={key} className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-200 whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {data.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {Object.entries(row).map(([key, val]: [string, any], j) => {
                            // Campos que necesitan wrap para textos largos
                            const wrapFields = ['motivoCancelacion', 'motivo', 'notas', 'productos', 'reason', 'notes', 'description', 'notasAutorizacion'];
                            const needsWrap = wrapFields.some(f => key.toLowerCase().includes(f.toLowerCase()));
                            
                            return (
                              <td 
                                key={j} 
                                className={`py-3 px-4 text-gray-900 dark:text-gray-100 ${
                                  needsWrap 
                                    ? 'whitespace-normal min-w-[200px] max-w-[400px]' 
                                    : 'whitespace-nowrap'
                                }`}
                              >
                                {typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val ?? '-')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 100 && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                      Mostrando 100 de {data.length} registros. Exporte para ver todos.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.slice(0, 12).map((row, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      {Object.entries(row).slice(0, 5).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">{key}:</span>
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{String(val ?? '-')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estado vacío después de generar */}
          {data.length === 0 && !loading && summary && (
            <div className="card p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No se encontraron datos</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                No hay registros que coincidan con los filtros seleccionados.
                Intente con un rango de fechas diferente o menos filtros.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => exportReport('excel')}
                  className="btn-secondary text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar Excel (vacío)
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  className="btn-secondary text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar PDF (vacío)
                </button>
              </div>
            </div>
          )}

          {/* Estado inicial - sin generar */}
          {data.length === 0 && !loading && !summary && selectedType && (
            <div className="card p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Configure y genere su reporte</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Seleccione el tipo de vista, rango de fechas y campos que desea incluir, 
                luego haga clic en "Generar Reporte"
              </p>
            </div>
          )}
        </>
      )}

      {/* Estado inicial */}
      {!selectedType && (
        <div className="card p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Seleccione un tipo de reporte</h3>
          <p className="text-gray-500">
            Elija una de las categorías de arriba para comenzar a configurar su reporte
          </p>
        </div>
      )}
      </div>
    </>
  );
}
