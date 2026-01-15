import { useState, useEffect } from 'react';
import { 
  FileText, Download, User, Clock, ChevronDown, ChevronUp, Filter,
  CheckCircle, XCircle, Edit2, Plus, Trash2, RefreshCw
} from 'lucide-react';
import { auditApi } from '../services/api';

interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  userId: string;
  userName: string;
  createdAt: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
}

interface AuditStats {
  total: number;
  byAction: { action: string; count: number }[];
  byEntity: { entity: string; count: number }[];
  byUser: { userId: string; userName: string; count: number }[];
}

const entityLabels: Record<string, string> = {
  'Product': 'Producto',
  'Category': 'Categoría',
  'ProductLot': 'Lote',
  'INVENTORY_ADJUSTMENT': 'Ajuste de Inventario',
  'INVENTORY_ENTRY': 'Entrada de Inventario',
  'StockMovement': 'Movimiento de Stock',
};

const actionLabels: Record<string, string> = {
  'CREATE': 'Creación',
  'UPDATE': 'Actualización',
  'DELETE': 'Eliminación',
  'ADJUSTMENT': 'Ajuste',
};

const actionIcons: Record<string, any> = {
  'CREATE': Plus,
  'UPDATE': Edit2,
  'DELETE': Trash2,
  'ADJUSTMENT': RefreshCw,
};

const actionColors: Record<string, string> = {
  'CREATE': 'text-green-600 bg-green-100 dark:bg-green-900/30',
  'UPDATE': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  'DELETE': 'text-red-600 bg-red-100 dark:bg-red-900/30',
  'ADJUSTMENT': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
};

export default function InventoryAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    entity: '',
    action: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 25
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [filters.startDate, filters.endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { ...filters };
      
      // Solo incluir entidades relacionadas con inventario
      if (!params.entity) {
        params.entity = 'Product,Category,ProductLot,INVENTORY_ADJUSTMENT,INVENTORY_ENTRY,StockMovement';
      }
      
      const response = await auditApi.search(params);
      setLogs(response.data.data);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await auditApi.getStats(params);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (filters.entity) params.entity = filters.entity;
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await auditApi.export(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `auditoria-inventario-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Auditoría de Inventario
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Trazabilidad y seguimiento de todas las operaciones de inventario
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Registros</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-xl">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Creaciones</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {stats.byAction.find(a => a.action === 'CREATE')?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-xl">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Ajustes</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {stats.byAction.find(a => a.action === 'ADJUSTMENT')?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Usuarios Activos</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {stats.byUser.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tipo de Entidad</label>
            <select
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value, page: 1 })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas las entidades</option>
              <option value="Product">Productos</option>
              <option value="Category">Categorías</option>
              <option value="ProductLot">Lotes</option>
              <option value="INVENTORY_ADJUSTMENT">Ajustes de Inventario</option>
              <option value="INVENTORY_ENTRY">Entradas de Inventario</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tipo de Acción</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Actualización</option>
              <option value="DELETE">Eliminación</option>
              <option value="ADJUSTMENT">Ajuste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Registros de Auditoría ({total.toLocaleString()})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No hay registros de auditoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const ActionIcon = actionIcons[log.action] || FileText;
              const isExpanded = expandedLog === log.id;
              
              return (
                <div 
                  key={log.id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Header Row */}
                  <div 
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <div className={`p-2 rounded-lg ${actionColors[log.action] || 'bg-gray-100'}`}>
                      <ActionIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {actionLabels[log.action] || log.action}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">en</span>
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-sm font-medium">
                          {entityLabels[log.entity] || log.entity}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {log.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Valores Anteriores */}
                        {log.oldValues && Object.keys(log.oldValues).length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Valores Anteriores
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(log.oldValues).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                                  <span className="text-gray-600 dark:text-gray-400">{formatValue(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Valores Nuevos */}
                        {log.newValues && Object.keys(log.newValues).length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Valores Nuevos
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(log.newValues).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                                  <span className="text-gray-600 dark:text-gray-400">{formatValue(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ID de Entidad */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          <strong>ID de Entidad:</strong> {log.entityId}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((filters.page - 1) * filters.limit) + 1} a {Math.min(filters.page * filters.limit, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Página {filters.page} de {totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === totalPages}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Users */}
      {stats && stats.byUser.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Usuarios con más Actividad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.byUser.slice(0, 6).map((user, index) => (
              <div 
                key={user.userId}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-primary-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{user.userName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.count} acciones</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
