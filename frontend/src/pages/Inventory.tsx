import { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, Clock, Edit2, Trash2, Box } from 'lucide-react';
import { productApi, categoryApi, inventoryApi, kitApi } from '../services/api';
import { Product, Category, Unit } from '../types';
import { useToast } from '../components/ui/Toast';

const unitLabels: Record<string, string> = {
  UNIT: 'Unidad',
  KG: 'Kilogramo',
  LB: 'Libra',
  LITER: 'Litro',
  ML: 'Mililitro',
  PACK: 'Paquete',
  BOX: 'Caja'
};

export default function Inventory() {
  console.log('🚀 Componente Inventory montado');

  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'kits'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [perishableFilter, setPerishableFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState<any>(null);
  const [historyDataLoaded, setHistoryDataLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    console.log('🎨 showHistoryModal cambió a:', showHistoryModal);
    console.log('🎨 selectedItemHistory:', selectedItemHistory);
  }, [showHistoryModal, selectedItemHistory]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleViewHistory = async (item: any) => {
    console.log('🔍 handleViewHistory llamado con:', item);
    setSelectedItemHistory(item);
    setHistoryDataLoaded(false);
    setShowHistoryModal(true);
    console.log('✅ showHistoryModal establecido en true');
    try {
      const token = localStorage.getItem('auth_token');
      const isKit = item.__type === 'kit' || item.kitProducts;
      const entity = isKit ? 'kit' : 'product';

      // Si es kit, cargar detalles completos primero
      let kitWithProducts = item;
      if (isKit && !item.kitProducts) {
        const kitRes = await fetch(`http://localhost:3001/api/kits/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const kitData = await kitRes.json();
        kitWithProducts = kitData.data;
      }

      // Cargar datos en paralelo
      const [movementsRes, auditRes] = await Promise.all([
        fetch(`http://localhost:3001/api/inventory/movements?${isKit ? '' : `productId=${item.id}`}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/api/audit/entity/${entity}/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false, json: async () => ({ data: [] }) }))
      ]);

      const movementsData = await movementsRes.json();
      const auditData = await auditRes.json();

      // Si es kit, también cargar movimientos de kit
      let kitMovementsData: any = { data: [] };
      let kitEvents: any[] = [];
      let productsHistory: any[] = [];
      let kitReportEntries: any[] = [];
      if (isKit) {
        // 0) Llamar endpoint de reportes de ingresos de kits (traer TODOS y filtrar client-side)
        try {
          const kitCode = item.code || kitWithProducts?.code;
          console.log('📡 Buscando ingresos para kit con code:', kitCode);
          const reportRes = await fetch('http://localhost:3001/api/reports/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              reportType: 'kits',
              subtype: 'ingresos'
            })
          });
          const reportJson = await reportRes.json();
          const allEntries = reportJson?.data || [];
          console.log('📊 Total ingresos de kits:', allEntries.length, 'registros');
          // Filtrar client-side por código del kit
          if (kitCode) {
            kitReportEntries = allEntries.filter((e: any) =>
              (e.reference && e.reference.includes(kitCode)) ||
              (e.productCode && e.productCode === kitCode)
            );
          } else {
            kitReportEntries = allEntries;
          }
          console.log('📊 Ingresos filtrados para', kitCode, ':', kitReportEntries.length, 'registros', kitReportEntries);
        } catch (e) {
          console.warn('No se pudo cargar reporte de ingresos de kits', e);
        }
        // 1) Movimientos formales de KitInventoryMovement (si existen)
        const kitMovUrl = `http://localhost:3001/api/inventory/kit-inventory/movements/${item.id}`;
        console.log('📡 Llamando kit-inventory endpoint:', kitMovUrl);
        const kitMovRes = await fetch(kitMovUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        kitMovementsData = await kitMovRes.json();
        console.log('📦 kitMovementsData respuesta:', kitMovementsData);
        console.log('📦 kitMovementsData.data.length:', kitMovementsData?.data?.length || 0);
        console.log('📦 kitMovementsData.debug:', kitMovementsData?.debug);

        // 2) Fallback: reconstruir eventos del kit desde StockMovements (vía /api/kits/:id/history)
        try {
          const kitHistUrl = `http://localhost:3001/api/kits/${item.id}/history`;
          console.log('📡 Llamando kits/history endpoint:', kitHistUrl);
          const kitHistRes = await fetch(kitHistUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const kitHistJson = await kitHistRes.json();
          console.log('📦 kits/:id/history respuesta:', kitHistJson);
          const stockEntries: any[] = kitHistJson?.data?.stockEntries || [];
          console.log('📦 stockEntries encontrados:', stockEntries.length);
          const map = new Map<string, any>();
          for (const m of stockEntries) {
            const dateKey = new Date(m.createdAt).toISOString().slice(0, 16);
            const key = m.reference || `${m.reason ?? ''}|${dateKey}`;
            if (!map.has(key)) {
              const qtyMatch = (m.reason || '').match(/x(\d+)/);
              map.set(key, {
                key,
                reason: m.reason,
                reference: m.reference,
                kitQty: qtyMatch ? parseInt(qtyMatch[1]) : null,
                date: m.createdAt,
                type: m.type,
                user: m.user,
                products: []
              });
            }
            map.get(key).products.push({
              name: m.product?.name,
              code: m.product?.code,
              quantity: m.quantity,
              unit: m.product?.unit
            });
          }
          kitEvents = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        } catch (e) {
          console.warn('No se pudo cargar /api/kits/:id/history', e);
        }

        // Cargar historial de cada producto del kit
        if (kitWithProducts.kitProducts && kitWithProducts.kitProducts.length > 0) {
          productsHistory = await Promise.all(
            kitWithProducts.kitProducts.map(async (kitProduct: any) => {
              const [prodMovRes, prodAuditRes] = await Promise.all([
                fetch(`http://localhost:3001/api/inventory/movements?productId=${kitProduct.product.id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`http://localhost:3001/api/audit/entity/product/${kitProduct.product.id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ ok: false, json: async () => ({ data: [] }) }))
              ]);
              
              const prodMovData = await prodMovRes.json();
              const prodAuditData = await prodAuditRes.json();
              
              return {
                product: kitProduct.product,
                quantity: kitProduct.quantity,
                movements: prodMovData.data || [],
                audit: prodAuditData.data || []
              };
            })
          );
        }

        // Fallback 2: si kitEvents sigue vacío, reconstruirlo desde productsHistory
        // agrupando los movimientos de los productos por reference o (reason+minuto)
        if (kitEvents.length === 0 && productsHistory.length > 0) {
          console.log('🔧 Fallback 2: reconstruyendo kitEvents desde productsHistory', productsHistory);
          const map = new Map<string, any>();
          for (const ph of productsHistory) {
            console.log(`📦 Producto ${ph.product?.name}:`, ph.movements?.length || 0, 'movimientos');
            for (const m of (ph.movements || [])) {
              console.log('  ➤ Movimiento:', m);
              const dateKey = new Date(m.createdAt).toISOString().slice(0, 16);
              const key = m.reference || `${m.reason ?? 'sin-razon'}|${dateKey}|${m.type}`;
              if (!map.has(key)) {
                const qtyMatch = (m.reason || '').match(/x(\d+)/);
                map.set(key, {
                  key,
                  reason: m.reason,
                  reference: m.reference,
                  kitQty: qtyMatch ? parseInt(qtyMatch[1]) : null,
                  date: m.createdAt,
                  type: m.type,
                  user: m.user,
                  products: []
                });
              }
              map.get(key).products.push({
                name: ph.product?.name,
                code: ph.product?.code,
                quantity: m.quantity,
                unit: ph.product?.unit,
                lot: m.lot?.lotNumber
              });
            }
          }
          kitEvents = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          console.log('✅ kitEvents reconstruidos:', kitEvents);
        }
      }

      // Guardar datos de depuración
      (window as any).debugData = {
        movements: movementsData,
        audit: auditData,
        kitMovements: kitMovementsData,
        kitEvents,
        productsHistory,
        kitReportEntries,
        isKit,
        movementsCount: (movementsData.data || []).length,
        auditCount: (auditData.data || []).length,
        kitMovementsCount: (kitMovementsData.data || []).length,
        kitEventsCount: kitEvents.length,
        kitMovementsDebug: kitMovementsData.debug
      };
      console.log('📊 debugData guardado:', (window as any).debugData);
      console.log('📦 productsHistory:', productsHistory);
      console.log('📦 productsHistory.length:', productsHistory.length);
      setHistoryDataLoaded(true);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error al cargar historial');
      setHistoryDataLoaded(true);
    } finally {
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Desactivar el producto "${product.name}"? Podrá reactivarlo después.`)) return;
    try {
      await productApi.delete(product.id);
      toast.success('Producto desactivado');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al desactivar');
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter, perishableFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (perishableFilter) params.isPerishable = perishableFilter === 'true';
      
      const [productsRes, kitsRes] = await Promise.all([
        productApi.getAll(params),
        kitApi.getAll(false).catch(() => ({ data: { data: [] } }))
      ]);
      setProducts(productsRes.data.data);
      setKits(kitsRes.data.data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de productos y kits</p>
        </div>
        {activeTab === 'products' && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Todo ({products.length + kits.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Productos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('kits')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'kits'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Box className="w-4 h-4" />
            Kits ({kits.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={perishableFilter}
            onChange={(e) => setPerishableFilter(e.target.value)}
            className="input w-full md:w-40"
          >
            <option value="">Todos</option>
            <option value="true">Perecederos</option>
            <option value="false">No perecederos</option>
          </select>
        </div>
      </div>

      {/* Products / Kits table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : activeTab === 'all' ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría / Tipo</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...products.map((p: any) => ({
                  __type: 'product',
                  id: p.id,
                  code: p.code,
                  name: p.name,
                  category: p.category?.name || '-',
                  stock: p.totalStock || 0,
                  minStock: p.minStock,
                  isActive: p.isActive,
                  unit: p.unit,
                  isPerishable: p.isPerishable,
                })),
                ...kits.map((k: any) => ({
                  __type: 'kit',
                  id: k.id,
                  code: k.code,
                  name: k.name,
                  category: k.type || 'GENERAL',
                  stock: k.inventory?.[0]?.quantity ?? k.totalStock ?? 0,
                  minStock: 0,
                  isActive: k.isActive,
                  productsCount: k.kitProducts?.length || 0,
                })),
              ]
                .filter((item: any) =>
                  !search ||
                  item.code?.toLowerCase().includes(search.toLowerCase()) ||
                  item.name?.toLowerCase().includes(search.toLowerCase())
                )
                .sort((a: any, b: any) => (a.code || '').localeCompare(b.code || ''))
                .map((item: any) => {
                  const isProduct = item.__type === 'product';
                  const isLowStock = isProduct
                    ? item.stock < item.minStock
                    : item.stock > 0 && item.stock < 5;
                  const isOutOfStock = item.stock === 0;
                  return (
                    <tr key={`${item.__type}-${item.id}`} className={!item.isActive ? 'opacity-50' : ''}>
                      <td>
                        {isProduct ? (
                          <span className="badge-gray flex items-center gap-1 w-fit">
                            <Package className="w-3 h-3" /> Producto
                          </span>
                        ) : (
                          <span className="badge-blue flex items-center gap-1 w-fit">
                            <Box className="w-3 h-3" /> Kit
                          </span>
                        )}
                      </td>
                      <td className="font-mono text-sm">{item.code}</td>
                      <td>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        {!isProduct && (
                          <p className="text-xs text-gray-500">{item.productsCount} productos en kit</p>
                        )}
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                          {item.stock?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td>
                        {!item.isActive ? (
                          <span className="badge-gray">Inactivo</span>
                        ) : isOutOfStock ? (
                          <span className="badge-red flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Sin stock
                          </span>
                        ) : isLowStock ? (
                          <span className="badge-red flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Stock bajo
                          </span>
                        ) : (
                          <span className="badge-green">Normal</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewHistory(item)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Historial
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {products.length === 0 && kits.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No se encontraron items en el inventario
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'kits' ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Kit</th>
                <th>Tipo</th>
                <th>Productos</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {kits
                .filter((k: any) =>
                  !search ||
                  k.code?.toLowerCase().includes(search.toLowerCase()) ||
                  k.name?.toLowerCase().includes(search.toLowerCase())
                )
                .map((kit: any) => {
                  const stock = kit.inventory?.[0]?.quantity ?? kit.totalStock ?? 0;
                  const isOutOfStock = stock === 0;
                  const isLowStock = stock > 0 && stock < 5;
                  return (
                    <tr key={kit.id} className={!kit.isActive ? 'opacity-50' : ''}>
                      <td className="font-mono text-sm">{kit.code}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Box className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{kit.name}</p>
                            {kit.description && (
                              <p className="text-xs text-gray-500">{kit.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-gray">{kit.type || 'GENERAL'}</span>
                      </td>
                      <td className="text-gray-500">
                        {kit.kitProducts?.length || 0} productos
                      </td>
                      <td>
                        <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                          {stock.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        {!kit.isActive ? (
                          <span className="badge-gray">Inactivo</span>
                        ) : isOutOfStock ? (
                          <span className="badge-red flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Sin stock
                          </span>
                        ) : isLowStock ? (
                          <span className="badge-yellow flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Stock bajo
                          </span>
                        ) : (
                          <span className="badge-green">Normal</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleViewHistory({ ...kit, __type: 'kit' })}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Historial
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {kits.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No se encontraron kits
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Mín.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLowStock = (product.totalStock || 0) < product.minStock;
                return (
                  <tr key={product.id} className={!product.isActive ? 'opacity-50' : ''}>
                    <td className="font-mono text-sm">{product.code}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          {product.isPerishable && (
                            <span className="text-xs text-orange-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Perecedero
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{product.category?.name}</td>
                    <td>{unitLabels[product.unit] || product.unit}</td>
                    <td>
                      <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {product.totalStock?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="text-gray-500">{product.minStock}</td>
                    <td>
                      {!product.isActive ? (
                        <span className="badge-gray">Inactivo</span>
                      ) : isLowStock ? (
                        <span className="badge-red flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Stock bajo
                        </span>
                      ) : (
                        <span className="badge-green">Normal</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title={product.isActive ? 'Desactivar' : 'Activar'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewHistory({ ...product, __type: 'product' })}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium ml-2"
                        >
                          Historial
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={handleCloseModal}
          onSave={fetchData}
        />
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" style={{zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)'}}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary-600" />
                  Historial
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedItemHistory?.__type === 'kit' ? 'Kit' : 'Producto'}: <span className="font-semibold">{selectedItemHistory?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!historyDataLoaded && (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
                </div>
              )}

              {historyDataLoaded && (
                <>
                  {/* Debug info */}
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Debug: isKit={String((window as any).debugData?.isKit)}, movementsCount={(window as any).debugData?.movementsCount}, kitMovementsCount={(window as any).debugData?.kitMovementsCount}, kitEventsCount={(window as any).debugData?.kitEventsCount}, productsHistoryLength={(window as any).debugData?.productsHistory?.length}
                    </p>
                  </div>

                  {/* Eventos de kit reconstruidos desde stockEntries (fallback principal para kits) */}
                  {(window as any).debugData?.isKit && (window as any).debugData?.kitEvents?.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Historial del Kit</h3>
                      {(window as any).debugData.kitEvents.map((ev: any) => (
                        <div key={ev.key} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-purple-700 dark:text-purple-300">
                                {ev.type === 'ENTRY' ? 'Ingreso de Kit' : ev.type === 'EXIT' ? 'Salida de Kit' : ev.type}
                                {ev.kitQty ? ` · ${ev.kitQty} kit(s)` : ''}
                              </p>
                              {ev.reason && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ev.reason}</p>
                              )}
                              {ev.reference && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ref: {ev.reference}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(ev.date).toLocaleString()}
                              </p>
                              {ev.user && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {ev.user.firstName} {ev.user.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 border-t border-purple-200 dark:border-purple-800 pt-2">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Productos consumidos en este evento:</p>
                            <ul className="text-sm space-y-0.5">
                              {ev.products.map((p: any, idx: number) => (
                                <li key={idx} className="text-gray-700 dark:text-gray-300">
                                  • {p.name} {p.code ? `(${p.code})` : ''} — {p.quantity} {p.unit || ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mostrar ingresos de kits desde reporte (fuente más confiable) */}
                  {(window as any).debugData?.isKit && (window as any).debugData?.kitReportEntries?.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ingresos de Kits</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                              <th className="text-left py-2 px-2">Fecha</th>
                              <th className="text-left py-2 px-2">Hora</th>
                              <th className="text-left py-2 px-2">Cantidad</th>
                              <th className="text-left py-2 px-2">Usuario</th>
                              <th className="text-left py-2 px-2">Referencia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(window as any).debugData.kitReportEntries.map((entry: any, index: number) => (
                              <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="py-2 px-2">{entry.fecha}</td>
                                <td className="py-2 px-2">{entry.hora}</td>
                                <td className="py-2 px-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    +{entry.quantity}
                                  </span>
                                </td>
                                <td className="py-2 px-2">{entry.user}</td>
                                <td className="py-2 px-2 text-gray-500 text-xs">{entry.reference}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Mostrar movimientos del kit si es kit, o movimientos del producto si es producto */}
                  {(window as any).debugData?.isKit && (window as any).debugData?.kitMovements?.data?.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Movimientos del Kit</h3>
                  {(window as any).debugData.kitMovements.data.map((movement: any, index: number) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {movement.type === 'IN' || movement.type === 'ENTRY' ? 'Ingreso' : movement.type === 'OUT' || movement.type === 'EXIT' ? 'Salida' : movement.type === 'ADJUSTMENT' ? 'Ajuste' : movement.type}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Cantidad: {movement.quantity}
                          </p>
                          {movement.lotNumber && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Lote: {movement.lotNumber}
                            </p>
                          )}
                          {movement.expiryDate && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Vence: {new Date(movement.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                          {movement.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Razón: {movement.notes}
                            </p>
                          )}
                          {movement.reference && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Referencia: {movement.reference}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(movement.date || movement.createdAt).toLocaleString()}
                          </p>
                          {movement.user && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {typeof movement.user === 'string' ? movement.user : `${movement.user.firstName} ${movement.user.lastName}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !(window as any).debugData?.isKit && (window as any).debugData?.movements?.data?.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Movimientos del Producto</h3>
                  {(window as any).debugData.movements.data.map((movement: any, index: number) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {movement.type === 'ENTRY' ? 'Ingreso' : movement.type === 'EXIT' ? 'Salida' : 'Ajuste'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Cantidad: {movement.quantity}
                          </p>
                          {movement.lot && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Lote: {movement.lot.lotNumber}
                            </p>
                          )}
                          {movement.reason && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Razón: {movement.reason}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(movement.createdAt).toLocaleString()}
                          </p>
                          {movement.user && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {movement.user.firstName} {movement.user.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No hay movimientos de inventario registrados
                  </p>
                </div>
              )}
              
              {(window as any).debugData?.audit?.data?.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Auditoría de Cambios</h3>
                  {(window as any).debugData.audit.data.map((audit: any, index: number) => (
                    <div key={index} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {audit.action} - {audit.entityType}
                          </p>
                          {audit.before && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Antes: {JSON.stringify(audit.before)}
                            </p>
                          )}
                          {audit.after && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Después: {JSON.stringify(audit.after)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(audit.createdAt).toLocaleString()}
                          </p>
                          {audit.user && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {audit.user.firstName} {audit.user.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(window as any).debugData?.productsHistory && (window as any).debugData.productsHistory.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Historial de Productos del Kit</h3>
                  {(window as any).debugData.productsHistory.map((productHistory: any, index: number) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 border-b border-purple-200 dark:border-purple-800">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {productHistory.product.name} ({productHistory.product.code})
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cantidad en kit: {productHistory.quantity}
                        </p>
                      </div>
                      <div className="p-3 space-y-2">
                        {productHistory.movements.length > 0 ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Movimientos:</p>
                            {productHistory.movements.map((movement: any, mIndex: number) => (
                              <div key={mIndex} className="bg-gray-50 dark:bg-gray-700/30 rounded p-2 mb-2">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {movement.type === 'ENTRY' ? 'Ingreso' : movement.type === 'EXIT' ? 'Salida' : 'Ajuste'}: {movement.quantity}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(movement.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Sin movimientos</p>
                        )}
                        {productHistory.audit.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 mt-3">Auditoría:</p>
                            {productHistory.audit.map((audit: any, aIndex: number) => (
                              <div key={aIndex} className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 mb-2">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {audit.action}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(audit.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

function ProductModal({ product, categories, onClose, onSave }: ProductModalProps) {
  const toast = useToast();
  const isEditing = !!product;
  const [form, setForm] = useState({
    code: product?.code || '',
    name: product?.name || '',
    description: product?.description || '',
    categoryId: product?.categoryId || '',
    unit: product?.unit || 'UNIT',
    isPerishable: product?.isPerishable || false,
    minStock: product?.minStock || 0,
    isActive: product?.isActive ?? true
  });
  
  // Campos para stock inicial (solo al crear)
  const [initialStock, setInitialStock] = useState({
    quantity: 0,
    lotNumber: '',
    expiryDate: ''
  });
  
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && product) {
        await productApi.update(product.id, form);
      } else {
        // Crear producto
        const response = await productApi.create(form);
        const newProduct = response.data.data;
        
        // Si hay cantidad inicial, crear entrada de stock
        if (initialStock.quantity > 0) {
          await inventoryApi.createEntry({
            productId: newProduct.id,
            quantity: initialStock.quantity,
            lotNumber: initialStock.lotNumber || undefined,
            expiryDate: initialStock.expiryDate || undefined,
            reason: 'Stock inicial al crear producto'
          });
        }
      }
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Estilos explícitos para inputs y selects
  const inputStyle = "w-full px-3 py-2.5 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
  const selectStyle = "w-full px-3 py-2.5 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer";
  const labelStyle = "block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[95svh] sm:max-h-[90vh] border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete los datos del producto</p>
        </div>
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelStyle}>Código *</label>
              <input 
                type="text" 
                value={form.code} 
                onChange={(e) => setForm({ ...form, code: e.target.value })} 
                className={inputStyle}
                placeholder="Ej: PROD-001"
                required 
              />
            </div>
            <div>
              <label className={labelStyle}>Categoría *</label>
              <select 
                value={form.categoryId} 
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })} 
                className={selectStyle}
                required
              >
                <option value="">-- Seleccionar categoría --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelStyle}>Nombre *</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className={inputStyle}
              placeholder="Nombre del producto"
              required 
            />
          </div>
          <div>
            <label className={labelStyle}>Descripción</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              className={inputStyle}
              rows={2}
              placeholder="Descripción opcional..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelStyle}>Unidad de Medida</label>
              <select 
                value={form.unit} 
                onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })} 
                className={selectStyle}
              >
                {Object.entries(unitLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelStyle}>Stock Mínimo</label>
              <input 
                type="number" 
                value={form.minStock} 
                onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })} 
                className={inputStyle}
                min="0" 
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.isPerishable} 
                onChange={(e) => setForm({ ...form, isPerishable: e.target.checked })} 
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Producto Perecedero</span>
            </label>
            {isEditing && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.isActive} 
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Producto Activo</span>
              </label>
            )}
          </div>

          {/* Stock Inicial - Solo al crear nuevo producto */}
          {!isEditing && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Stock Inicial (Opcional)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-green-700 dark:text-green-400 mb-1">Cantidad *</label>
                  <input 
                    type="number" 
                    value={initialStock.quantity} 
                    onChange={(e) => setInitialStock({ ...initialStock, quantity: parseInt(e.target.value) || 0 })} 
                    className={inputStyle}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 dark:text-green-400 mb-1">Nº Lote</label>
                  <input 
                    type="text" 
                    value={initialStock.lotNumber} 
                    onChange={(e) => setInitialStock({ ...initialStock, lotNumber: e.target.value })} 
                    className={inputStyle}
                    placeholder="Opcional"
                  />
                </div>
                {form.isPerishable && (
                  <div>
                    <label className="block text-xs font-medium text-green-700 dark:text-green-400 mb-1">Vencimiento</label>
                    <input 
                      type="date" 
                      value={initialStock.expiryDate} 
                      onChange={(e) => setInitialStock({ ...initialStock, expiryDate: e.target.value })} 
                      className={inputStyle}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Si ingresa cantidad, se creará automáticamente un lote con el stock inicial.
              </p>
            </div>
          )}
          
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 flex justify-end gap-3 pt-3 pb-1 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors" 
              disabled={saving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50" 
              disabled={saving}
            >
              {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Producto')}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
