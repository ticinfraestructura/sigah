import { FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from './ui/Toast';
import api from '../services/api';

interface ExportButtonsProps {
  data: any[];
  reportType: string;
  subtype: string;
  title?: string;
  disabled?: boolean;
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
}

export default function ExportButtons({
  data,
  reportType,
  subtype,
  title,
  disabled = false,
  className = '',
  onExportStart,
  onExportComplete
}: ExportButtonsProps) {
  const toast = useToast();

  // Validar que los datos existan antes de renderizar
  if (!data || !Array.isArray(data)) {
    console.warn('ExportButtons: data is not an array or is undefined');
    return null;
  }

  const exportToExcel = async () => {
    if (disabled) return;
    
    try {
      console.log('ExportButtons: Starting Excel export with params:', { reportType, subtype, dataLength: data.length });
      onExportStart?.();
      
      // Usar datos locales si están disponibles, si no dejar que backend los genere
      const requestBody: any = {
        reportType,
        subtype
      };
      
      // Solo enviar datos si hay datos locales disponibles
      if (data && data.length > 0) {
        requestBody.data = data;
      }
      
      console.log('ExportButtons: Sending request to /api/reports/export/excel with body:', requestBody);
      
      const token = localStorage.getItem('token');
      console.log('ExportButtons: Token from localStorage:', token ? 'exists' : 'missing');
      
      const response = await api.post('/reports/export/excel', requestBody, {
        responseType: 'blob'
      });

      console.log('ExportButtons: API response received');
      
      const blob = response.data;
      console.log('ExportButtons: Blob created, size:', blob.size);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${subtype}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('ExportButtons: Excel export completed successfully');
      toast.success('Reporte exportado a Excel exitosamente');
      onExportComplete?.();
    } catch (error) {
      console.error('ExportButtons: Export error:', error);
      toast.error('Error al exportar a Excel');
      onExportComplete?.();
    }
  };

  const exportToPDF = async () => {
    if (disabled) return;
    
    try {
      onExportStart?.();
      
      // Usar datos locales si están disponibles, si no dejar que backend los genere
      const token = localStorage.getItem('token');
      console.log('ExportButtons: Token from localStorage for PDF:', token ? 'exists' : 'missing');
      
      const requestBody: any = {
        reportType,
        subtype,
        title: title || `Reporte de ${reportType}`
      };
      
      // Solo enviar datos si hay datos locales disponibles
      if (data && data.length > 0) {
        requestBody.data = data;
      }
      
      console.log('ExportButtons: Sending PDF request with body:', requestBody);
      
      const response = await api.post('/reports/export/pdf', requestBody, {
        responseType: 'blob'
      });

      console.log('ExportButtons: API PDF response received, status:', response.status);
      console.log('ExportButtons: Response data type:', typeof response.data);
      console.log('ExportButtons: Response data size:', response.data?.size || 'unknown');
      
      const blob = response.data;
      if (!blob || blob.size === 0) {
        throw new Error('El archivo PDF está vacío o no se generó correctamente');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${subtype}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Reporte exportado a PDF exitosamente');
      onExportComplete?.();
    } catch (error) {
      toast.error('Error al exportar a PDF');
      onExportComplete?.();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={exportToExcel}
        disabled={disabled}
        className="btn-success flex items-center gap-2"
        title={`Exportar ${data.length > 0 ? data.length : 'todos los'} registros a Excel`}
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar Excel</span>
        <span className="sm:hidden">Excel</span>
      </button>
      
      <button
        onClick={exportToPDF}
        disabled={disabled}
        className="btn-primary flex items-center gap-2"
        title={`Exportar ${data.length > 0 ? data.length : 'todos los'} registros a PDF`}
      >
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar PDF</span>
        <span className="sm:hidden">PDF</span>
      </button>
    </div>
  );
}
