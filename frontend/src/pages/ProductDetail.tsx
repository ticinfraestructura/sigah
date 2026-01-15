import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Edit2, Trash2, Package, TrendingUp, TrendingDown, RotateCcw, Filter, Download, History, AlertTriangle } from 'lucide-react';
import { productApi } from '../services/api';
import { Product, ProductLot, StockMovement } from '../types';

const movementTypeLabels: Record<string, { label: string; color: string; icon: any }> = {
  ENTRY: { label: 'Entrada', color: 'text-green-600 bg-green-100', icon: TrendingUp },
  EXIT: { label: 'Salida', color: 'text-red-600 bg-red-100', icon: TrendingDown },
  ADJUSTMENT: { label: 'Ajuste', color: 'text-yellow-600 bg-yellow-100', icon: RotateCcw },
  TRANSFER: { label: 'Transferencia', color: 'text-blue-600 bg-blue-100', icon: Package },
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLot, setShowAddLot] = useState(false);
  const [showEditLot, setShowEditLot] = useState(false);
  const [editingLot, setEditingLot] = useState<ProductLot | null>(null);
  const [newLot, setNewLot] = useState({ quantity: 0, lotNumber: '', expiryDate: '' });
  const [editLotForm, setEditLotForm] = useState({ quantity: 0, lotNumber: '', expiryDate: '' });
  
  // Estado para modal de eliminación con motivo
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLotId, setDeletingLotId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  // Filtros del histórico
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [movements, dateFrom, dateTo, typeFilter]);

  const fetchProduct = async () => {
    try {
      const [prodRes, movRes] = await Promise.all([
        productApi.getById(id!),
        productApi.getMovements(id!)
      ]);
      setProduct(prodRes.data.data);
      setMovements(movRes.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];
    
    if (dateFrom) {
      filtered = filtered.filter(m => new Date(m.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(m => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59'));
    }
    if (typeFilter) {
      filtered = filtered.filter(m => m.type === typeFilter);
    }
    
    setFilteredMovements(filtered);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('');
  };

  const getMovementStats = () => {
    const entries = movements.filter(m => m.type === 'ENTRY').reduce((sum, m) => sum + m.quantity, 0);
    const exits = movements.filter(m => m.type === 'EXIT').reduce((sum, m) => sum + m.quantity, 0);
    const adjustments = movements.filter(m => m.type === 'ADJUSTMENT').length;
    return { entries, exits, adjustments, total: movements.length };
  };

  const exportHistory = () => {
    const csv = [
      ['Fecha', 'Hora', 'Tipo', 'Cantidad', 'Lote', 'Motivo', 'Usuario'].join(','),
      ...filteredMovements.map(m => [
        new Date(m.createdAt).toLocaleDateString(),
        new Date(m.createdAt).toLocaleTimeString(),
        movementTypeLabels[m.type]?.label || m.type,
        m.quantity,
        m.lot?.lotNumber || '-',
        `"${m.reason || '-'}"`,
        `${m.user?.firstName || ''} ${m.user?.lastName || ''}`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-${product?.code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productApi.addLot(id!, {
        quantity: newLot.quantity,
        lotNumber: newLot.lotNumber || undefined,
        expiryDate: newLot.expiryDate || undefined
      });
      setShowAddLot(false);
      setNewLot({ quantity: 0, lotNumber: '', expiryDate: '' });
      fetchProduct();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al agregar lote');
    }
  };

  const handleEditLot = (lot: ProductLot) => {
    setEditingLot(lot);
    setEditLotForm({
      quantity: lot.quantity,
      lotNumber: lot.lotNumber,
      expiryDate: lot.expiryDate ? new Date(lot.expiryDate).toISOString().split('T')[0] : ''
    });
    setShowEditLot(true);
  };

  const handleUpdateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLot) return;
    try {
      await productApi.updateLot(id!, editingLot.id, {
        quantity: editLotForm.quantity,
        lotNumber: editLotForm.lotNumber || undefined,
        expiryDate: editLotForm.expiryDate || undefined
      });
      setShowEditLot(false);
      setEditingLot(null);
      fetchProduct();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar lote');
    }
  };

  const openDeleteModal = (lotId: string) => {
    setDeletingLotId(lotId);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteLot = async () => {
    if (!deletingLotId || !deleteReason.trim()) {
      alert('Debe ingresar un motivo para la eliminación');
      return;
    }
    try {
      await productApi.deleteLot(id!, deletingLotId, deleteReason.trim());
      setShowDeleteModal(false);
      setDeletingLotId(null);
      setDeleteReason('');
      fetchProduct();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar lote');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-12">Producto no encontrado</div>;
  }

  const stats = getMovementStats();
  const isLowStock = (product.totalStock || 0) < product.minStock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/inventory" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
              {isLowStock && (
                <span className="badge-red flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Stock bajo
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400">Código: <span className="font-mono">{product.code}</span></p>
          </div>
        </div>
        <button onClick={() => setShowAddLot(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Lote
        </button>
      </div>

      {/* Main Layout: Two Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Product Details & Lots */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Product Summary Card */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Información del Producto</h3>
                <p className="text-sm text-gray-500">{product.category?.name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{product.totalStock || 0}</p>
                <p className="text-xs text-green-600">Stock Actual</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{product.minStock}</p>
                <p className="text-xs text-gray-500">Stock Mínimo</p>
              </div>
            </div>
            
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500">Unidad de Medida</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{product.unit}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500">Tipo</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {product.isPerishable ? (
                    <span className="flex items-center gap-1 text-orange-600">
                      <Clock className="w-4 h-4" /> Perecedero
                    </span>
                  ) : 'No perecedero'}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <span className={product.isActive ? 'badge-green' : 'badge-gray'}>
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Lots Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                Lotes Activos ({product.lots?.length || 0})
              </h3>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {product.lots?.map((lot: ProductLot) => {
                const isExpiringSoon = lot.expiryDate && 
                  new Date(lot.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                const isExpired = lot.expiryDate && new Date(lot.expiryDate) < new Date();
                
                return (
                  <div 
                    key={lot.id} 
                    className={`p-3 rounded-lg border ${
                      isExpired ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' :
                      isExpiringSoon ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800' :
                      'border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          {lot.lotNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ingreso: {new Date(lot.entryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">{lot.quantity}</p>
                        {lot.expiryDate && (
                          <p className={`text-xs flex items-center gap-1 ${
                            isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {isExpired ? 'Vencido' : `Vence: ${new Date(lot.expiryDate).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 mt-2">
                      <button
                        onClick={() => handleEditLot(lot)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Editar lote"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(lot.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Eliminar lote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {(!product.lots || product.lots.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Sin lotes registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Movement History */}
        <div className="xl:col-span-7">
          <div className="card h-full">
            {/* History Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Histórico de Movimientos</h3>
                <span className="text-sm text-gray-500">({filteredMovements.length} registros)</span>
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

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-600">+{stats.entries}</p>
                <p className="text-xs text-green-600">Entradas</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-red-600">-{stats.exits}</p>
                <p className="text-xs text-red-600">Salidas</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-yellow-600">{stats.adjustments}</p>
                <p className="text-xs text-yellow-600">Ajustes</p>
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
                    <label className="label text-xs">Tipo</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="input text-sm"
                    >
                      <option value="">Todos</option>
                      <option value="ENTRY">Entrada</option>
                      <option value="EXIT">Salida</option>
                      <option value="ADJUSTMENT">Ajuste</option>
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

            {/* Movements Timeline */}
            <div className="overflow-y-auto max-h-[500px] space-y-2">
              {filteredMovements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No hay movimientos registrados</p>
                </div>
              ) : (
                filteredMovements.map((mov) => {
                  const isDeletedLot = mov.reference?.startsWith('ELIMINACION') || (mov.lot && mov.lot.isActive === false);
                  const typeInfo = movementTypeLabels[mov.type] || { label: mov.type, color: 'text-gray-600 bg-gray-100', icon: Package };
                  const IconComponent = isDeletedLot ? Trash2 : typeInfo.icon;
                  const colorClass = isDeletedLot ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : typeInfo.color;
                  
                  return (
                    <div key={mov.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      isDeletedLot 
                        ? 'bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {isDeletedLot ? 'Lote Eliminado' : typeInfo.label}: <span className="font-bold">{Math.abs(mov.quantity)}</span> unidades
                            </p>
                            {isDeletedLot && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full">
                                ELIMINADO
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(mov.createdAt).toLocaleDateString()} {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {mov.reason || 'Sin motivo especificado'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>Usuario: {mov.user?.firstName} {mov.user?.lastName}</span>
                          {mov.lot?.lotNumber && (
                            <span className={`font-mono ${mov.lot.isActive === false ? 'line-through text-red-400' : ''}`}>
                              Lote: {mov.lot.lotNumber}
                            </span>
                          )}
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

      {/* Add Lot Modal */}
      {showAddLot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Agregar Lote</h2>
            <form onSubmit={handleAddLot} className="space-y-4">
              <div>
                <label className="label">Cantidad</label>
                <input
                  type="number"
                  value={newLot.quantity}
                  onChange={(e) => setNewLot({ ...newLot, quantity: parseInt(e.target.value) || 0 })}
                  className="input"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="label">Número de Lote (opcional)</label>
                <input
                  type="text"
                  value={newLot.lotNumber}
                  onChange={(e) => setNewLot({ ...newLot, lotNumber: e.target.value })}
                  className="input"
                />
              </div>
              {product.isPerishable && (
                <div>
                  <label className="label">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={newLot.expiryDate}
                    onChange={(e) => setNewLot({ ...newLot, expiryDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddLot(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lot Modal */}
      {showEditLot && editingLot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Editar Lote</h2>
            <form onSubmit={handleUpdateLot} className="space-y-4">
              <div>
                <label className="label">Cantidad</label>
                <input
                  type="number"
                  value={editLotForm.quantity}
                  onChange={(e) => setEditLotForm({ ...editLotForm, quantity: parseInt(e.target.value) || 0 })}
                  className="input"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="label">Número de Lote</label>
                <input
                  type="text"
                  value={editLotForm.lotNumber}
                  onChange={(e) => setEditLotForm({ ...editLotForm, lotNumber: e.target.value })}
                  className="input"
                />
              </div>
              {product?.isPerishable && (
                <div>
                  <label className="label">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={editLotForm.expiryDate}
                    onChange={(e) => setEditLotForm({ ...editLotForm, expiryDate: e.target.value })}
                    className="input"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditLot(false); setEditingLot(null); }} 
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lot Modal - Con motivo obligatorio */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Eliminar Lote</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Esta acción desactivará el lote y quedará registrada en el historial de movimientos.
              Por favor, ingrese el motivo de la eliminación:
            </p>
            <div className="mb-4">
              <label className="label">Motivo de eliminación *</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="input min-h-[100px]"
                placeholder="Ej: Producto vencido, error de registro, dañado en bodega..."
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => { setShowDeleteModal(false); setDeletingLotId(null); setDeleteReason(''); }} 
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteLot}
                disabled={!deleteReason.trim()}
                className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Eliminar Lote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
