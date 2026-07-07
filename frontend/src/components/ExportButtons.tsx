import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
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
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  if (!data || !Array.isArray(data)) return null;

  const buildRequestBody = () => {
    const body: any = { reportType, subtype };
    if (data.length > 0) body.data = data;
    return body;
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const exportToExcel = async () => {
    if (disabled || loadingExcel || loadingPdf) return;
    setLoadingExcel(true);
    onExportStart?.();
    try {
      const response = await api.post('/reports/export/excel', buildRequestBody(), { responseType: 'blob' });
      triggerDownload(response.data, `${reportType}_${subtype}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Reporte exportado a Excel exitosamente');
    } catch (error) {
      console.error('ExportButtons Excel error:', error);
      toast.error('Error al exportar a Excel');
    } finally {
      setLoadingExcel(false);
      onExportComplete?.();
    }
  };

  const exportToPDF = async () => {
    if (disabled || loadingExcel || loadingPdf) return;
    setLoadingPdf(true);
    onExportStart?.();
    try {
      const body = { ...buildRequestBody(), title: title || `Reporte de ${reportType}` };
      const response = await api.post('/reports/export/pdf', body, { responseType: 'blob' });
      const blob = response.data;
      if (!blob || blob.size === 0) throw new Error('PDF vacío');
      triggerDownload(blob, `${reportType}_${subtype}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Reporte exportado a PDF exitosamente');
    } catch (error) {
      console.error('ExportButtons PDF error:', error);
      toast.error('Error al exportar a PDF');
    } finally {
      setLoadingPdf(false);
      onExportComplete?.();
    }
  };

  const isbusy = loadingExcel || loadingPdf;
  const count = data.length > 0 ? `${data.length} registros` : 'todos los registros';

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={exportToExcel}
        disabled={disabled || isbusy}
        className="btn-success flex items-center gap-2"
        title={`Exportar ${count} a Excel`}
      >
        {loadingExcel
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileSpreadsheet className="w-4 h-4" />}
        <span className="hidden sm:inline">{loadingExcel ? 'Exportando...' : 'Exportar Excel'}</span>
        <span className="sm:hidden">Excel</span>
      </button>

      <button
        onClick={exportToPDF}
        disabled={disabled || isbusy}
        className="btn-primary flex items-center gap-2"
        title={`Exportar ${count} a PDF`}
      >
        {loadingPdf
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileText className="w-4 h-4" />}
        <span className="hidden sm:inline">{loadingPdf ? 'Exportando...' : 'Exportar PDF'}</span>
        <span className="sm:hidden">PDF</span>
      </button>
    </div>
  );
}
