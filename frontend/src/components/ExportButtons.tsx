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
      
      // Si no hay datos locales, obtenerlos del backend
      let exportData = data;
      if (data.length === 0) {
        console.log('ExportButtons: No local data, fetching from backend...');
        // Para auditoría, obtener datos del endpoint de auditoría
        if (reportType === 'audit') {
          const auditResponse = await api.get('/api/audit/search', { 
            params: { 
              entity: 'Product,Category,ProductLot,INVENTORY_ADJUSTMENT,INVENTORY_ENTRY,StockMovement,Kit,KitInventoryMovement',
              page: 1,
              limit: 5000
            }
          });
          exportData = auditResponse.data.data || [];
        }
      }
      
      const requestBody = {
        reportType,
        subtype,
        data: exportData
      };
      console.log('ExportButtons: Sending request to /api/reports/export/excel with body:', requestBody);
      
      const token = localStorage.getItem('token');
      console.log('ExportButtons: Token from localStorage:', token ? 'exists' : 'missing');
      
      const response = await api.post('/reports/export/excel', {
        reportType,
        subtype,
        data: exportData
      }, {
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
      
      // Si no hay datos locales, obtenerlos del backend
      let exportData = data;
      if (data.length === 0) {
        console.log('ExportButtons: No local data for PDF, fetching from backend...');
        // Para auditoría, obtener datos del endpoint de auditoría
        if (reportType === 'audit') {
          const auditResponse = await api.get('/api/audit/search', { 
            params: { 
              entity: 'Product,Category,ProductLot,INVENTORY_ADJUSTMENT,INVENTORY_ENTRY,StockMovement,Kit,KitInventoryMovement',
              page: 1,
              limit: 5000
            }
          });
          exportData = auditResponse.data.data || [];
        }
      }
      
      const token = localStorage.getItem('token');
      console.log('ExportButtons: Token from localStorage for PDF:', token ? 'exists' : 'missing');
      
      const response = await api.post('/reports/export/pdf', {
        reportType,
        subtype,
        data: exportData,
        title: title || `Reporte de ${reportType}`
      }, {
        responseType: 'blob'
      });

      console.log('ExportButtons: API PDF response received');
      
      const blob = response.data;
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
