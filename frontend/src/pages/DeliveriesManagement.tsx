import { useState, useEffect } from 'react';
import { 
  Truck, Clock, CheckCircle, Package, UserCheck, XCircle,
  ChevronRight, Filter, Eye, User, Search, X, Inbox
} from 'lucide-react';
import { deliveryApi } from '../services/api';
import { Delivery, DeliveryStatus } from '../types';
import { useAuth } from '../context/AuthContext';

// Nuevo flujo con segregación de funciones
const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; icon: any; step: number }> = {
  PENDING_AUTHORIZATION: { label: 'Pendiente Autorización', color: 'badge-yellow', icon: Clock, step: 1 },
  AUTHORIZED: { label: 'Autorizada', color: 'badge-blue', icon: CheckCircle, step: 2 },
  RECEIVED_WAREHOUSE: { label: 'Recibida en Bodega', color: 'badge-indigo', icon: Inbox, step: 3 },
  IN_PREPARATION: { label: 'En Preparación', color: 'badge-purple', icon: Package, step: 4 },
  READY: { label: 'Lista para Entrega', color: 'badge-cyan', icon: Truck, step: 5 },
  DELIVERED: { label: 'Entregada', color: 'badge-green', icon: UserCheck, step: 6 },
  CANCELLED: { label: 'Cancelada', color: 'badge-red', icon: XCircle, step: 0 },
};

export default function DeliveriesManagement() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({ receivedBy: '', receiverDocument: '', notes: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Delivery[]>([]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [statusFilter]);

  // Filtrar entregas por búsqueda de beneficiario
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(deliveries);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = deliveries.filter(d => {
      const beneficiary = d.request?.beneficiary;
      if (!beneficiary) return false;
      return (
        beneficiary.firstName?.toLowerCase().includes(term) ||
        beneficiary.lastName?.toLowerCase().includes(term) ||
        beneficiary.documentNumber?.toLowerCase().includes(term) ||
        `${beneficiary.firstName} ${beneficiary.lastName}`.toLowerCase().includes(term) ||
        d.code?.toLowerCase().includes(term) ||
        d.request?.code?.toLowerCase().includes(term)
      );
    });
    setSearchResults(filtered);
  }, [searchTerm, deliveries]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const response = await deliveryApi.getAll(params);
      setDeliveries(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await deliveryApi.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAction = async (action: string, deliveryId: string, notes?: string) => {
    try {
      setActionLoading(true);
      switch (action) {
        case 'authorize':
          await deliveryApi.authorize(deliveryId, { notes });
          break;
        case 'receive':
          await deliveryApi.receiveInWarehouse(deliveryId, notes);
          break;
        case 'prepare':
          await deliveryApi.startPreparation(deliveryId, notes);
          break;
        case 'ready':
          await deliveryApi.markReady(deliveryId, notes);
          break;
      }
      await fetchData();
      await fetchStats();
      if (selectedDelivery?.id === deliveryId) {
        const response = await deliveryApi.getById(deliveryId);
        setSelectedDelivery(response.data.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al procesar la acción');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedDelivery || !confirmData.receivedBy || !confirmData.receiverDocument) {
      alert('Complete los datos del receptor');
      return;
    }
    try {
      setActionLoading(true);
      await deliveryApi.confirmDelivery(selectedDelivery.id, confirmData);
      setShowConfirmModal(false);
      setConfirmData({ receivedBy: '', receiverDocument: '', notes: '' });
      await fetchData();
      await fetchStats();
      const response = await deliveryApi.getById(selectedDelivery.id);
      setSelectedDelivery(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al confirmar entrega');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedDelivery || !cancelReason) {
      alert('Ingrese el motivo de cancelación');
      return;
    }
    try {
      setActionLoading(true);
      await deliveryApi.cancel(selectedDelivery.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      await fetchData();
      await fetchStats();
      const response = await deliveryApi.getById(selectedDelivery.id);
      setSelectedDelivery(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cancelar');
    } finally {
      setActionLoading(false);
    }
  };

  const getNextAction = (delivery: Delivery) => {
    const roleName = user?.roleName?.toLowerCase() || '';
    const isAdmin = roleName.includes('admin');
    const isAuthorizer = roleName.includes('autoriz') || isAdmin;
    const isWarehouse = roleName.includes('bodeg') || isAdmin;
    const isDispatcher = roleName.includes('despach') || isAdmin;

    // Validar segregación: no puede hacer la acción si ya participó en un paso anterior
    const userId = user?.id;
    const canAuthorize = isAuthorizer && delivery.createdById !== userId;
    const canReceive = isWarehouse && delivery.authorizedById !== userId;
    const canPrepare = isWarehouse && delivery.authorizedById !== userId;
    const canDeliver = isDispatcher && delivery.authorizedById !== userId && delivery.preparedById !== userId;

    switch (delivery.status) {
      case 'PENDING_AUTHORIZATION':
        return canAuthorize ? { label: 'Autorizar', action: 'authorize', color: 'btn-primary', warning: delivery.createdById === userId ? 'No puede autorizar su propia solicitud' : null } : null;
      case 'AUTHORIZED':
        return canReceive ? { label: 'Recibir en Bodega', action: 'receive', color: 'btn-indigo' } : null;
      case 'RECEIVED_WAREHOUSE':
        return canPrepare ? { label: 'Iniciar Preparación', action: 'prepare', color: 'btn-blue' } : null;
      case 'IN_PREPARATION':
        return isWarehouse ? { label: 'Marcar Lista', action: 'ready', color: 'btn-purple' } : null;
      case 'READY':
        return canDeliver ? { label: 'Confirmar Entrega', action: 'deliver', color: 'btn-green' } : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Entregas</h1>
          <p className="text-gray-500">Flujo integral de autorización y entrega</p>
        </div>
      </div>

      {/* Stats Cards - Nuevo flujo con 7 estados */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="card p-3 text-center cursor-pointer hover:ring-2 ring-yellow-300" onClick={() => setStatusFilter('PENDING_AUTHORIZATION')}>
            <Clock className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-xl font-bold">{stats.pendingAuthorization}</p>
            <p className="text-xs text-gray-500">Pend. Autoriz.</p>
          </div>
          <div className="card p-3 text-center cursor-pointer hover:ring-2 ring-blue-300" onClick={() => setStatusFilter('AUTHORIZED')}>
            <CheckCircle className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xl font-bold">{stats.authorized}</p>
            <p className="text-xs text-gray-500">Autorizadas</p>
          </div>
          <div className="card p-3 text-center cursor-pointer hover:ring-2 ring-indigo-300" onClick={() => setStatusFilter('RECEIVED_WAREHOUSE')}>
            <Inbox className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
            <p className="text-xl font-bold">{stats.receivedWarehouse || 0}</p>
            <p className="text-xs text-gray-500">En Bodega</p>
          </div>
          <div className="card p-3 text-center cursor-pointer hover:ring-2 ring-purple-300" onClick={() => setStatusFilter('IN_PREPARATION')}>
            <Package className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <p className="text-xl font-bold">{stats.inPreparation}</p>
            <p className="text-xs text-gray-500">Preparando</p>
          </div>
          <div className="card p-3 text-center cursor-pointer hover:ring-2 ring-cyan-300" onClick={() => setStatusFilter('READY')}>
            <Truck className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
            <p className="text-xl font-bold">{stats.ready}</p>
            <p className="text-xs text-gray-500">Listas</p>
          </div>
          <div className="card p-3 text-center cursor-pointer hover:ring-2 ring-green-300" onClick={() => setStatusFilter('DELIVERED')}>
            <UserCheck className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-xl font-bold">{stats.delivered}</p>
            <p className="text-xs text-gray-500">Entregadas</p>
          </div>
          <div className="card p-3 text-center cursor-pointer hover:ring-2 ring-red-300" onClick={() => setStatusFilter('CANCELLED')}>
            <XCircle className="w-5 h-5 mx-auto text-red-500 mb-1" />
            <p className="text-xl font-bold">{stats.cancelled}</p>
            <p className="text-xs text-gray-500">Canceladas</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por beneficiario, documento o código..."
              className="input w-full pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Search Results Info */}
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-500">
            {searchResults.length === 0 ? (
              <span className="text-amber-600">No se encontraron entregas para "{searchTerm}"</span>
            ) : (
              <span>Mostrando {searchResults.length} resultado(s) para "{searchTerm}"</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliveries List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="card p-8 text-center">
              <Truck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay entregas</p>
            </div>
          ) : (
            searchResults.map((delivery) => {
              const statusConfig = STATUS_CONFIG[delivery.status];
              const StatusIcon = statusConfig.icon;
              const nextAction = getNextAction(delivery);
              
              return (
                <div
                  key={delivery.id}
                  className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedDelivery?.id === delivery.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-primary-600">{delivery.code}</span>
                        <span className={`badge ${statusConfig.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Solicitud</p>
                          <p className="font-medium">{delivery.request?.code}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Beneficiario</p>
                          <p className="font-medium">
                            {delivery.request?.beneficiary?.firstName} {delivery.request?.beneficiary?.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Responsable Bodega</p>
                          <p className="font-medium">
                            {delivery.warehouseUser ? 
                              `${delivery.warehouseUser.firstName} ${delivery.warehouseUser.lastName}` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Creada</p>
                          <p className="font-medium">{new Date(delivery.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {nextAction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (nextAction.action === 'deliver') {
                              setSelectedDelivery(delivery);
                              setShowConfirmModal(true);
                            } else {
                              handleAction(nextAction.action, delivery.id);
                            }
                          }}
                          disabled={actionLoading}
                          className={`btn ${nextAction.color} btn-sm`}
                        >
                          {nextAction.label}
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDelivery ? (
            <div className="card p-6 sticky top-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedDelivery.code}</h3>
                <span className={`badge ${STATUS_CONFIG[selectedDelivery.status].color}`}>
                  {STATUS_CONFIG[selectedDelivery.status].label}
                </span>
              </div>

              {/* Beneficiary Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Beneficiario</h4>
                <p className="font-bold text-gray-900 dark:text-white">
                  {selectedDelivery.request?.beneficiary?.firstName} {selectedDelivery.request?.beneficiary?.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedDelivery.request?.beneficiary?.documentType}: {selectedDelivery.request?.beneficiary?.documentNumber}
                </p>
                {selectedDelivery.request?.beneficiary?.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Tel: {selectedDelivery.request.beneficiary.phone}</p>
                )}
              </div>

              {/* Workflow Status */}
              <div>
                <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">Flujo de Entrega</h4>
                <div className="space-y-3">
                  {/* Creación */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedDelivery.warehouseUser ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Creada por Bodega</p>
                      {selectedDelivery.warehouseUser && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedDelivery.warehouseUser.firstName} {selectedDelivery.warehouseUser.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Autorización */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedDelivery.authorizedBy ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Autorización</p>
                      {selectedDelivery.authorizedBy ? (
                        <>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedDelivery.authorizedBy.firstName} {selectedDelivery.authorizedBy.lastName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {selectedDelivery.authorizationDate && new Date(selectedDelivery.authorizationDate).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Pendiente</p>
                      )}
                    </div>
                  </div>

                  {/* Preparación */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedDelivery.preparationDate ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                    }`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Preparación</p>
                      {selectedDelivery.preparationDate ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(selectedDelivery.preparationDate).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Pendiente</p>
                      )}
                    </div>
                  </div>

                  {/* Entrega */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedDelivery.deliveryDate ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                    }`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Entrega al Beneficiario</p>
                      {selectedDelivery.receivedBy ? (
                        <>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Recibido por: {selectedDelivery.receivedBy}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Doc: {selectedDelivery.receiverDocument}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {selectedDelivery.deliveryDate && new Date(selectedDelivery.deliveryDate).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Pendiente</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Items a Entregar</h4>
                <div className="space-y-2">
                  {selectedDelivery.deliveryDetails?.map((detail) => (
                    <div key={detail.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {detail.product?.name || detail.kit?.name || 'Item'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{detail.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedDelivery.status !== 'DELIVERED' && selectedDelivery.status !== 'CANCELLED' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
                  {getNextAction(selectedDelivery) ? (
                    <button
                      onClick={() => {
                        const action = getNextAction(selectedDelivery);
                        if (action?.action === 'deliver') {
                          setShowConfirmModal(true);
                        } else if (action) {
                          handleAction(action.action, selectedDelivery.id);
                        }
                      }}
                      disabled={actionLoading}
                      className={`btn ${getNextAction(selectedDelivery)?.color} w-full`}
                    >
                      {actionLoading ? 'Procesando...' : getNextAction(selectedDelivery)?.label}
                    </button>
                  ) : (
                    selectedDelivery.status === 'PENDING_AUTHORIZATION' && selectedDelivery.createdById === user?.id && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium">⚠️ Segregación de funciones</p>
                        <p className="text-xs mt-1">No puedes autorizar una entrega que tú mismo creaste. Otro usuario con rol Autorizador o Admin debe aprobarla.</p>
                      </div>
                    )
                  )}
                  {user?.roleName?.toLowerCase().includes('admin') && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="btn btn-outline w-full text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancelar Entrega
                    </button>
                  )}
                </div>
              )}

              {/* History */}
              {selectedDelivery.history && selectedDelivery.history.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Historial</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDelivery.history.map((h) => (
                      <div key={h.id} className="text-xs p-2 bg-gray-50 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{STATUS_CONFIG[h.toStatus]?.label}</span>
                          <span className="text-gray-400">{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-500">{h.user.firstName} {h.user.lastName}</p>
                        {h.notes && <p className="text-gray-600 mt-1">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Eye className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Seleccione una entrega para ver detalles</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delivery Modal */}
      {showConfirmModal && selectedDelivery && (
        <ConfirmDeliveryModal
          delivery={selectedDelivery}
          confirmData={confirmData}
          setConfirmData={setConfirmData}
          onConfirm={handleConfirmDelivery}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmData({ receivedBy: '', receiverDocument: '', notes: '' });
          }}
          loading={actionLoading}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-red-600">Cancelar Entrega</h3>
            
            <div className="p-4 bg-red-50 rounded-lg mb-4">
              <p className="text-sm text-red-800">
                Esta acción cancelará la entrega <strong>{selectedDelivery.code}</strong>.
                {selectedDelivery.status === 'READY' && (
                  <span className="block mt-2">El inventario descontado será devuelto.</span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de cancelación *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Ingrese el motivo de la cancelación"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="btn btn-outline flex-1"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading || !cancelReason}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
              >
                {actionLoading ? 'Procesando...' : 'Cancelar Entrega'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Modal de Confirmación de Entrega con búsqueda de beneficiarios
function ConfirmDeliveryModal({ 
  delivery, 
  confirmData, 
  setConfirmData, 
  onConfirm, 
  onCancel, 
  loading 
}: {
  delivery: Delivery;
  confirmData: { receivedBy: string; receiverDocument: string; notes: string };
  setConfirmData: (data: { receivedBy: string; receiverDocument: string; notes: string }) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const beneficiary = delivery.request?.beneficiary;

  // Función para usar los datos del beneficiario original
  const useBeneficiaryData = () => {
    if (beneficiary) {
      setConfirmData({
        ...confirmData,
        receivedBy: `${beneficiary.firstName} ${beneficiary.lastName}`,
        receiverDocument: beneficiary.documentNumber || ''
      });
    }
  };

  // Búsqueda de beneficiarios
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const response = await fetch(`/api/beneficiaries?search=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Error buscando beneficiarios:', error);
    } finally {
      setSearching(false);
    }
  };

  // Seleccionar un beneficiario de la búsqueda
  const selectBeneficiary = (ben: any) => {
    setConfirmData({
      ...confirmData,
      receivedBy: `${ben.firstName} ${ben.lastName}`,
      receiverDocument: ben.documentNumber || ''
    });
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
          Confirmar Entrega al Beneficiario
        </h3>
        
        {/* Info del beneficiario de la solicitud */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Beneficiario de la Solicitud:
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-200">
                {beneficiary?.firstName} {beneficiary?.lastName}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {beneficiary?.documentType}: {beneficiary?.documentNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={useBeneficiaryData}
              className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              Usar estos datos
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Campo de quien recibe */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre de quien recibe *
              </label>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="text-xs text-primary-600 hover:underline"
              >
                {showSearch ? 'Cerrar búsqueda' : 'Buscar otro beneficiario'}
              </button>
            </div>
            
            {/* Campo de búsqueda */}
            {showSearch && (
              <div className="mb-2 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input w-full"
                  placeholder="Buscar por nombre, apellido o documento..."
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 rounded-full border-t-transparent"></div>
                  </div>
                )}
                
                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((ben) => (
                      <button
                        key={ben.id}
                        type="button"
                        onClick={() => selectBeneficiary(ben)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {ben.firstName} {ben.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ben.documentType}: {ben.documentNumber}
                          </p>
                        </div>
                        <span className="text-xs text-primary-600">Seleccionar</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <input
              type="text"
              value={confirmData.receivedBy}
              onChange={(e) => setConfirmData({ ...confirmData, receivedBy: e.target.value })}
              className="input w-full"
              placeholder="Nombre completo de quien recibe"
            />
          </div>
          
          {/* Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Documento de quien recibe *
            </label>
            <input
              type="text"
              value={confirmData.receiverDocument}
              onChange={(e) => setConfirmData({ ...confirmData, receiverDocument: e.target.value })}
              className="input w-full"
              placeholder="Número de documento"
            />
          </div>
          
          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observaciones
            </label>
            <textarea
              value={confirmData.notes}
              onChange={(e) => setConfirmData({ ...confirmData, notes: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="Observaciones de la entrega (opcional)"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="btn btn-outline flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !confirmData.receivedBy || !confirmData.receiverDocument}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Procesando...' : 'Confirmar Entrega'}
          </button>
        </div>
      </div>
    </div>
  );
}
