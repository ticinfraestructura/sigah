import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Boxes, Package, Users, Truck, CheckCircle, Clock, XCircle, Filter, Download, History } from 'lucide-react';
import { kitApi } from '../services/api';

interface KitProduct {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    code: string;
    unit: string;
    category?: { name: string };
  };
}

interface Kit {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  kitProducts: KitProduct[];
}

interface DeliveryDetail {
  id: string;
  quantity: number;
}

interface Delivery {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  deliveryDate?: string;
  deliveryDetails: DeliveryDetail[];
  request?: {
    code: string;
    beneficiary?: {
      firstName: string;
      lastName: string;
      documentNumber: string;
    };
  };
  createdBy?: { firstName: string; lastName: string };
  authorizedBy?: { firstName: string; lastName: string };
  preparedBy?: { firstName: string; lastName: string };
  deliveredBy?: { firstName: string; lastName: string };
}

interface Stats {
  totalDeliveries: number;
  totalKitsDelivered: number;
  byStatus: Record<string, number>;
  lastDelivery: string | null;
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_AUTHORIZATION: { label: 'Pendiente Autorización', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  AUTHORIZED: { label: 'Autorizada', color: 'text-blue-600 bg-blue-100', icon: CheckCircle },
  RECEIVED_WAREHOUSE: { label: 'Recibida en Bodega', color: 'text-indigo-600 bg-indigo-100', icon: Package },
  IN_PREPARATION: { label: 'En Preparación', color: 'text-purple-600 bg-purple-100', icon: Boxes },
  READY: { label: 'Lista', color: 'text-cyan-600 bg-cyan-100', icon: CheckCircle },
  DELIVERED: { label: 'Entregada', color: 'text-green-600 bg-green-100', icon: Truck },
  CANCELLED: { label: 'Cancelada', color: 'text-red-600 bg-red-100', icon: XCircle },
};

export default function KitDetail() {
  const { id } = useParams<{ id: string }>();
  const [kit, setKit] = useState<Kit | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [deliveries, dateFrom, dateTo, statusFilter]);

  const fetchData = async () => {
    try {
      const response = await kitApi.getHistory(id!);
      setKit(response.data.data.kit);
      setDeliveries(response.data.data.deliveries || []);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...deliveries];
    
    if (dateFrom) {
      filtered = filtered.filter(d => new Date(d.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(d => new Date(d.createdAt) <= new Date(dateTo + 'T23:59:59'));
    }
    if (statusFilter) {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    setFilteredDeliveries(filtered);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
  };

  const exportHistory = () => {
    if (!kit) return;
    const csv = [
      ['Código Entrega', 'Fecha', 'Estado', 'Cantidad Kits', 'Beneficiario', 'Documento', 'Creado por', 'Entregado por'].join(','),
      ...filteredDeliveries.map(d => [
        d.code,
        new Date(d.createdAt).toLocaleDateString(),
        statusLabels[d.status]?.label || d.status,
        d.deliveryDetails?.reduce((sum, dd) => sum + dd.quantity, 0) || 0,
        d.request?.beneficiary ? `${d.request.beneficiary.firstName} ${d.request.beneficiary.lastName}` : '-',
        d.request?.beneficiary?.documentNumber || '-',
        d.createdBy ? `${d.createdBy.firstName} ${d.createdBy.lastName}` : '-',
        d.deliveredBy ? `${d.deliveredBy.firstName} ${d.deliveredBy.lastName}` : '-',
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-kit-${kit.code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!kit) {
    return <div className="text-center py-12">Kit no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/kits" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{kit.name}</h1>
              <span className={kit.isActive ? 'badge-green' : 'badge-gray'}>
                {kit.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Código: <span className="font-mono">{kit.code}</span></p>
          </div>
        </div>
      </div>

      {/* Main Layout: Two Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Kit Details */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Kit Summary Card */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Boxes className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Información del Kit</h3>
                <p className="text-sm text-gray-500">{kit.kitProducts?.length || 0} productos</p>
              </div>
            </div>
            
            {kit.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {kit.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats?.totalDeliveries || 0}</p>
                <p className="text-xs text-blue-600">Entregas</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats?.totalKitsDelivered || 0}</p>
                <p className="text-xs text-green-600">Kits Entregados</p>
              </div>
            </div>

            {stats?.lastDelivery && (
              <p className="text-xs text-gray-500 text-center">
                Última entrega: {new Date(stats.lastDelivery).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Kit Products */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                Composición del Kit
              </h3>
            </div>
            
            <div className="space-y-3">
              {kit.kitProducts?.map((kp) => (
                <div 
                  key={kp.id} 
                  className="p-3 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {kp.product?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kp.product?.category?.name} • {kp.product?.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary-600">{kp.quantity}</p>
                      <p className="text-xs text-gray-500">unidades</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!kit.kitProducts || kit.kitProducts.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Sin productos configurados</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Distribution */}
          {stats && Object.keys(stats.byStatus).length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Distribución por Estado</h3>
              <div className="space-y-2">
                {Object.entries(stats.byStatus).map(([status, count]) => {
                  const info = statusLabels[status] || { label: status, color: 'text-gray-600 bg-gray-100' };
                  const percentage = stats.totalDeliveries > 0 ? (count / stats.totalDeliveries) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{info.label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${info.color.includes('green') ? 'bg-green-500' : info.color.includes('red') ? 'bg-red-500' : info.color.includes('yellow') ? 'bg-yellow-500' : 'bg-blue-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Delivery History */}
        <div className="xl:col-span-7">
          <div className="card h-full">
            {/* History Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Histórico de Entregas</h3>
                <span className="text-sm text-gray-500">({filteredDeliveries.length} registros)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary text-sm ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-1" /> Filtros
                </button>
                <button onClick={exportHistory} className="btn-secondary text-sm">
                  <Download className="w-4 h-4 mr-1" /> Exportar
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="label text-xs">Desde</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Hasta</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="input text-sm"
                    >
                      <option value="">Todos</option>
                      {Object.entries(statusLabels).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={clearFilters} className="btn-secondary text-sm w-full">
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Deliveries Timeline */}
            <div className="overflow-y-auto max-h-[600px] space-y-3">
              {filteredDeliveries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No hay entregas registradas para este kit</p>
                </div>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const statusInfo = statusLabels[delivery.status] || { label: delivery.status, color: 'text-gray-600 bg-gray-100', icon: Package };
                  const IconComponent = statusInfo.icon;
                  const kitsInDelivery = delivery.deliveryDetails?.reduce((sum, dd) => sum + dd.quantity, 0) || 0;
                  
                  return (
                    <div key={delivery.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusInfo.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                {delivery.code}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(delivery.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="flex items-center gap-1">
                              <Boxes className="w-4 h-4" />
                              <strong>{kitsInDelivery}</strong> kit(s)
                            </span>
                            {delivery.request?.beneficiary && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {delivery.request.beneficiary.firstName} {delivery.request.beneficiary.lastName}
                              </span>
                            )}
                          </div>

                          {/* Workflow trail */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                            {delivery.createdBy && (
                              <span>Creado: {delivery.createdBy.firstName} {delivery.createdBy.lastName}</span>
                            )}
                            {delivery.authorizedBy && (
                              <span>Autorizado: {delivery.authorizedBy.firstName} {delivery.authorizedBy.lastName}</span>
                            )}
                            {delivery.preparedBy && (
                              <span>Preparado: {delivery.preparedBy.firstName} {delivery.preparedBy.lastName}</span>
                            )}
                            {delivery.deliveredBy && (
                              <span>Entregado: {delivery.deliveredBy.firstName} {delivery.deliveredBy.lastName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
