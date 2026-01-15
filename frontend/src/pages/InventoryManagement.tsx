import { useState, useEffect } from 'react';
import { 
  Package, FolderTree, Boxes, ArrowUpDown, Plus, Search, Edit2, Trash2, 
  RotateCcw, AlertTriangle, Clock, X, TrendingUp, TrendingDown, RefreshCw,
  History, Calendar, User
} from 'lucide-react';
import { productApi, categoryApi, inventoryApi } from '../services/api';
import { Product, Category, ProductLot, StockMovement, Unit } from '../types';

const unitLabels: Record<string, string> = {
  UNIT: 'Unidad',
  KG: 'Kilogramo',
  LB: 'Libra',
  LITER: 'Litro',
  ML: 'Mililitro',
  PACK: 'Paquete',
  BOX: 'Caja'
};

const movementTypeLabels: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT: 'Ajuste',
  RETURN: 'Devolución'
};

const movementTypeColors: Record<string, string> = {
  ENTRY: 'text-green-600 bg-green-50 dark:bg-green-900/30',
  EXIT: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  ADJUSTMENT: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  RETURN: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30'
};

type TabType = 'products' | 'categories' | 'lots' | 'movements' | 'adjustments';

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  const tabs = [
    { id: 'products' as TabType, label: 'Productos', icon: Package },
    { id: 'categories' as TabType, label: 'Categorías', icon: FolderTree },
    { id: 'lots' as TabType, label: 'Lotes', icon: Boxes },
    { id: 'movements' as TabType, label: 'Movimientos', icon: ArrowUpDown },
    { id: 'adjustments' as TabType, label: 'Ajustes/Entradas', icon: RefreshCw },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Inventario</h1>
        <p className="text-gray-500 dark:text-gray-400">Administración completa de productos, categorías y stock</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'lots' && <LotsTab />}
      {activeTab === 'movements' && <MovementsTab />}
      {activeTab === 'adjustments' && <AdjustmentsTab />}
    </div>
  );
}

// ==================== PRODUCTS TAB ====================
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter, includeInactive]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll(true);
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { includeInactive };
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      
      const response = await productApi.getAll(params);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (product: Product) => {
    const action = product.isActive ? 'desactivar' : 'reactivar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} el producto "${product.name}"?`)) return;
    try {
      await productApi.update(product.id, { isActive: !product.isActive });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || `Error al ${action}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-4">
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
            {categories.filter(c => c.isActive).map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Incluir inactivos
          </label>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                  <tr key={product.id} className={!product.isActive ? 'opacity-50 bg-gray-50 dark:bg-gray-800/50' : ''}>
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
                        <span className="badge-green">Activo</span>
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
                          className={`p-2 rounded-lg ${
                            product.isActive 
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30' 
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                          }`}
                          title={product.isActive ? 'Desactivar' : 'Reactivar'}
                        >
                          {product.isActive ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
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
          categories={categories.filter(c => c.isActive)}
          onClose={handleCloseModal}
          onSave={fetchData}
        />
      )}
    </div>
  );
}

// ==================== CATEGORIES TAB ====================
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchData();
  }, [includeInactive]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getAll(includeInactive);
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (category: Category) => {
    const action = category.isActive ? 'desactivar' : 'reactivar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} la categoría "${category.name}"?`)) return;
    try {
      if (category.isActive) {
        await categoryApi.delete(category.id);
      } else {
        await categoryApi.update(category.id, { isActive: true });
      }
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || `Error al ${action}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Incluir inactivas
          </label>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`card hover:shadow-md transition-shadow ${!category.isActive ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <FolderTree className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className={`p-2 rounded-lg ${
                      category.isActive 
                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30' 
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                    }`}
                    title={category.isActive ? 'Desactivar' : 'Reactivar'}
                  >
                    {category.isActive ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className={category.isActive ? 'badge-green' : 'badge-gray'}>
                  {category.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No se encontraron categorías
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={handleCloseModal}
          onSave={fetchData}
        />
      )}
    </div>
  );
}

// ==================== LOTS TAB ====================
function LotsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLot, setEditingLot] = useState<ProductLot | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchLots();
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll({ limit: 500 });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const fetchLots = async () => {
    if (!selectedProduct) return;
    try {
      setLoading(true);
      const response = await productApi.getLots(selectedProduct);
      setLots(response.data.data);
    } catch (error) {
      console.error('Error loading lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lot: ProductLot) => {
    setEditingLot(lot);
    setShowModal(true);
  };

  const handleDelete = async (lot: ProductLot) => {
    if (!confirm(`¿Eliminar el lote "${lot.lotNumber}"? Esta acción no se puede deshacer.`)) return;
    try {
      await productApi.deleteLot(selectedProduct, lot.id);
      fetchLots();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLot(null);
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="label">Seleccionar Producto</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="input"
            >
              <option value="">-- Seleccione un producto --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code} - {product.name} (Stock: {product.totalStock || 0})
                </option>
              ))}
            </select>
          </div>
          {selectedProduct && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Lote
            </button>
          )}
        </div>
      </div>

      {selectedProduct && (
        <>
          {selectedProductData && (
            <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-4">
                <Package className="w-8 h-8 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedProductData.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Código: {selectedProductData.code} | Stock Total: {selectedProductData.totalStock || 0} {unitLabels[selectedProductData.unit]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Número de Lote</th>
                    <th>Cantidad</th>
                    <th>Fecha Vencimiento</th>
                    <th>Fecha Entrada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => {
                    const isExpired = lot.expiryDate && new Date(lot.expiryDate) < new Date();
                    const isExpiringSoon = lot.expiryDate && !isExpired && 
                      new Date(lot.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    return (
                      <tr key={lot.id} className={isExpired ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                        <td className="font-mono">{lot.lotNumber}</td>
                        <td className="font-semibold">{lot.quantity.toLocaleString()}</td>
                        <td>
                          {lot.expiryDate ? (
                            <span className={`flex items-center gap-1 ${
                              isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : ''
                            }`}>
                              {isExpired && <AlertTriangle className="w-4 h-4" />}
                              {isExpiringSoon && <Clock className="w-4 h-4" />}
                              {new Date(lot.expiryDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td>{new Date(lot.entryDate).toLocaleDateString()}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(lot)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(lot)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {lots.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Este producto no tiene lotes registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!selectedProduct && (
        <div className="card text-center py-12 text-gray-500">
          <Boxes className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Seleccione un producto para ver y gestionar sus lotes</p>
        </div>
      )}

      {showModal && selectedProduct && (
        <LotModal
          productId={selectedProduct}
          lot={editingLot}
          onClose={handleCloseModal}
          onSave={fetchLots}
        />
      )}
    </div>
  );
}

// ==================== MOVEMENTS TAB ====================
function MovementsTab() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    productId: '',
    type: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchProducts();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll({ limit: 500 });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { page: pagination.page, limit: 50 };
      if (filters.productId) params.productId = filters.productId;
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await inventoryApi.getMovements(params);
      setMovements(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.productId}
            onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
            className="input"
          >
            <option value="">Todos los productos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.code} - {product.name}
              </option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="input"
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRY">Entrada</option>
            <option value="EXIT">Salida</option>
            <option value="ADJUSTMENT">Ajuste</option>
            <option value="RETURN">Devolución</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="input"
            placeholder="Fecha inicio"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="input"
            placeholder="Fecha fin"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Motivo</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{new Date(movement.createdAt).toLocaleString()}</td>
                    <td>
                      <div>
                        <p className="font-medium">{movement.product?.name}</p>
                        <p className="text-xs text-gray-500">{movement.product?.code}</p>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{movement.lot?.lotNumber || '-'}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${movementTypeColors[movement.type]}`}>
                        {movement.type === 'ENTRY' && <TrendingUp className="w-3 h-3" />}
                        {movement.type === 'EXIT' && <TrendingDown className="w-3 h-3" />}
                        {movementTypeLabels[movement.type]}
                      </span>
                    </td>
                    <td className={`font-semibold ${
                      movement.type === 'ENTRY' || movement.type === 'RETURN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'ENTRY' || movement.type === 'RETURN' ? '+' : '-'}{movement.quantity}
                    </td>
                    <td className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {movement.reason || movement.reference || '-'}
                    </td>
                    <td>{movement.user?.firstName} {movement.user?.lastName}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron movimientos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando página {pagination.page} de {pagination.pages} ({pagination.total} registros)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn-secondary"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="btn-secondary"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==================== ADJUSTMENTS TAB ====================
function AdjustmentsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'entry' | 'adjustment'>('entry');
  const [form, setForm] = useState({
    lotId: '',
    lotNumber: '',
    quantity: '',
    expiryDate: '',
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct && mode === 'adjustment') {
      fetchLots();
    }
  }, [selectedProduct, mode]);

  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll({ limit: 500 });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const fetchLots = async () => {
    try {
      setLoading(true);
      const response = await productApi.getLots(selectedProduct);
      setLots(response.data.data);
    } catch (error) {
      console.error('Error loading lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Seleccione un producto');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'entry') {
        await inventoryApi.createEntry({
          productId: selectedProduct,
          quantity: parseInt(form.quantity),
          lotNumber: form.lotNumber || undefined,
          expiryDate: form.expiryDate || undefined,
          reason: form.reason || undefined
        });
        alert('Entrada registrada exitosamente');
      } else {
        if (!form.lotId) {
          alert('Seleccione un lote');
          setSaving(false);
          return;
        }
        await inventoryApi.createAdjustment({
          productId: selectedProduct,
          lotId: form.lotId,
          quantity: parseInt(form.quantity),
          reason: form.reason
        });
        alert('Ajuste registrado exitosamente');
      }
      setForm({ lotId: '', lotNumber: '', quantity: '', expiryDate: '', reason: '' });
      setSelectedProduct('');
      fetchProducts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al procesar');
    } finally {
      setSaving(false);
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="card">
        <div className="flex gap-4">
          <button
            onClick={() => setMode('entry')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              mode === 'entry'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Nueva Entrada de Stock
          </button>
          <button
            onClick={() => setMode('adjustment')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              mode === 'adjustment'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            <RefreshCw className="w-5 h-5 inline mr-2" />
            Ajuste de Inventario
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          {mode === 'entry' ? 'Registrar Entrada de Stock' : 'Registrar Ajuste de Inventario'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Producto *</label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setForm({ ...form, lotId: '' });
              }}
              className="input"
              required
            >
              <option value="">-- Seleccione un producto --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code} - {product.name} (Stock actual: {product.totalStock || 0})
                </option>
              ))}
            </select>
          </div>

          {selectedProductData && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Stock actual:</strong> {selectedProductData.totalStock || 0} {unitLabels[selectedProductData.unit]}
                {selectedProductData.isPerishable && <span className="ml-2 text-orange-600">(Perecedero)</span>}
              </p>
            </div>
          )}

          {mode === 'entry' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Número de Lote</label>
                  <input
                    type="text"
                    value={form.lotNumber}
                    onChange={(e) => setForm({ ...form, lotNumber: e.target.value })}
                    className="input"
                    placeholder="Ej: LOT-2024-001"
                  />
                  <p className="text-xs text-gray-500 mt-1">Se generará automáticamente si se deja vacío</p>
                </div>
                <div>
                  <label className="label">Cantidad *</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="input"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="input"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Lote *</label>
                <select
                  value={form.lotId}
                  onChange={(e) => setForm({ ...form, lotId: e.target.value })}
                  className="input"
                  required
                  disabled={loading || !selectedProduct}
                >
                  <option value="">-- Seleccione un lote --</option>
                  {lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.lotNumber} (Cantidad: {lot.quantity})
                      {lot.expiryDate && ` - Vence: ${new Date(lot.expiryDate).toLocaleDateString()}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Nueva Cantidad *</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="input"
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingrese la cantidad correcta final del lote (puede ser mayor o menor que la actual)
                </p>
              </div>
            </>
          )}

          <div>
            <label className="label">Motivo {mode === 'adjustment' && '*'}</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input"
              rows={2}
              placeholder={mode === 'entry' ? 'Ej: Compra, Donación, etc.' : 'Ej: Corrección de conteo, Merma, etc.'}
              required={mode === 'adjustment'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setForm({ lotId: '', lotNumber: '', quantity: '', expiryDate: '', reason: '' });
                setSelectedProduct('');
              }}
              className="btn-secondary"
              disabled={saving}
            >
              Limpiar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Procesando...' : mode === 'entry' ? 'Registrar Entrada' : 'Registrar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MODALS ====================

interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

function ProductModal({ product, categories, onClose, onSave }: ProductModalProps) {
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
  const [saving, setSaving] = useState(false);
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [lotExpiryDates, setLotExpiryDates] = useState<Record<string, string>>({});

  // Cargar lotes si estamos editando un producto perecedero
  useEffect(() => {
    if (isEditing && product && form.isPerishable) {
      loadLots();
    }
  }, [isEditing, product?.id, form.isPerishable]);

  const loadLots = async () => {
    if (!product) return;
    setLoadingLots(true);
    try {
      const response = await productApi.getLots(product.id);
      const lotsData = response.data.data || [];
      setLots(lotsData);
      // Inicializar fechas de vencimiento
      const dates: Record<string, string> = {};
      lotsData.forEach((lot: ProductLot) => {
        dates[lot.id] = lot.expiryDate ? lot.expiryDate.split('T')[0] : '';
      });
      setLotExpiryDates(dates);
    } catch (error) {
      console.error('Error loading lots:', error);
    } finally {
      setLoadingLots(false);
    }
  };

  const handleUpdateLotExpiry = async (lotId: string) => {
    if (!product) return;
    try {
      await productApi.updateLot(product.id, lotId, {
        expiryDate: lotExpiryDates[lotId] || undefined
      });
      setEditingLotId(null);
      loadLots(); // Recargar para reflejar cambios
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar fecha');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && product) {
        await productApi.update(product.id, form);
      } else {
        await productApi.create(form);
      }
      onSave();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', text: 'VENCIDO', color: 'text-red-600 bg-red-100' };
    if (daysUntilExpiry <= 30) return { status: 'warning', text: `${daysUntilExpiry}d`, color: 'text-orange-600 bg-orange-100' };
    return { status: 'ok', text: `${daysUntilExpiry}d`, color: 'text-green-600 bg-green-100' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Código *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Categoría *</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input" required>
                  <option value="">Seleccionar...</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Unidad</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })} className="input">
                  {Object.entries(unitLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Stock mínimo</label>
                <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })} className="input" min="0" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isPerishable} onChange={(e) => setForm({ ...form, isPerishable: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Perecedero</span>
              </label>
              {isEditing && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
                </label>
              )}
            </div>

            {/* Sección de Fechas de Vencimiento - Solo si es perecedero y estamos editando */}
            {isEditing && form.isPerishable && (
              <div className="p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-700 dark:text-orange-400">Fechas de Vencimiento por Lote</h3>
                </div>
                
                {loadingLots ? (
                  <div className="text-center py-4 text-gray-500">Cargando lotes...</div>
                ) : lots.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hay lotes registrados. Agregue lotes desde la pestaña "Lotes".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lots.map((lot) => {
                      const expiry = getExpiryStatus(lot.expiryDate);
                      const isEditingThis = editingLotId === lot.id;
                      
                      return (
                        <div key={lot.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">{lot.lotNumber}</span>
                              <span className="text-xs text-gray-500">({lot.quantity} unid.)</span>
                            </div>
                          </div>
                          
                          {isEditingThis ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={lotExpiryDates[lot.id] || ''}
                                onChange={(e) => setLotExpiryDates({ ...lotExpiryDates, [lot.id]: e.target.value })}
                                className="input py-1 px-2 text-sm w-40"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateLotExpiry(lot.id)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLotId(null)}
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {lot.expiryDate ? (
                                <>
                                  <span className="text-sm">
                                    {new Date(lot.expiryDate).toLocaleDateString()}
                                  </span>
                                  {expiry && (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${expiry.color}`}>
                                      {expiry.status === 'expired' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                                      {expiry.text}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-gray-400">Sin fecha</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingLotId(lot.id)}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                title="Editar fecha"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Mensaje informativo si no es perecedero */}
            {isEditing && !form.isPerishable && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 inline mr-2" />
                Este producto no es perecedero. Marque "Perecedero" para gestionar fechas de vencimiento.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface CategoryModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

function CategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const isEditing = !!category;
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    isActive: category?.isActive ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && category) {
        await categoryApi.update(category.id, form);
      } else {
        await categoryApi.create(form);
      }
      onSave();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className="input" 
              required 
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              className="input" 
              rows={3} 
            />
          </div>
          {isEditing && (
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={form.isActive} 
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
                className="w-4 h-4 rounded" 
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Activa</span>
            </label>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AuditLogEntry {
  id: string;
  action: string;
  oldValues: string | null;
  newValues: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

interface LotModalProps {
  productId: string;
  lot: ProductLot | null;
  onClose: () => void;
  onSave: () => void;
}

function LotModal({ productId, lot, onClose, onSave }: LotModalProps) {
  const isEditing = !!lot;
  const [form, setForm] = useState({
    lotNumber: lot?.lotNumber || '',
    quantity: lot?.quantity?.toString() || '',
    expiryDate: lot?.expiryDate ? lot.expiryDate.split('T')[0] : ''
  });
  const [saving, setSaving] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditLogEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Cargar historial de auditoría si estamos editando
  useEffect(() => {
    if (isEditing && lot) {
      loadAuditHistory();
    }
  }, [isEditing, lot]);

  const loadAuditHistory = async () => {
    if (!lot) return;
    setLoadingHistory(true);
    try {
      const response = await productApi.getLotAuditHistory(productId, lot.id);
      setAuditHistory(response.data.data || []);
    } catch (error) {
      console.error('Error loading audit history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && lot) {
        await productApi.updateLot(productId, lot.id, {
          lotNumber: form.lotNumber,
          quantity: parseInt(form.quantity),
          expiryDate: form.expiryDate || undefined
        });
      } else {
        await productApi.addLot(productId, {
          lotNumber: form.lotNumber || undefined,
          quantity: parseInt(form.quantity),
          expiryDate: form.expiryDate || undefined
        });
      }
      onSave();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const formatAuditChanges = (oldValues: string | null, newValues: string | null) => {
    const changes: string[] = [];
    try {
      const oldObj = oldValues ? JSON.parse(oldValues) : {};
      const newObj = newValues ? JSON.parse(newValues) : {};
      
      if (oldObj.quantity !== undefined && newObj.quantity !== undefined && oldObj.quantity !== newObj.quantity) {
        changes.push(`Cantidad: ${oldObj.quantity} → ${newObj.quantity}`);
      }
      if (oldObj.expiryDate !== newObj.expiryDate) {
        const oldDate = oldObj.expiryDate ? new Date(oldObj.expiryDate).toLocaleDateString() : 'Sin fecha';
        const newDate = newObj.expiryDate ? new Date(newObj.expiryDate).toLocaleDateString() : 'Sin fecha';
        changes.push(`Vencimiento: ${oldDate} → ${newDate}`);
      }
      if (oldObj.lotNumber !== newObj.lotNumber) {
        changes.push(`Lote: ${oldObj.lotNumber || '-'} → ${newObj.lotNumber || '-'}`);
      }
    } catch (e) {
      return 'Cambios registrados';
    }
    return changes.length > 0 ? changes.join(' | ') : 'Cambios registrados';
  };

  // Calcular si está próximo a vencer o vencido
  const expiryStatus = () => {
    if (!form.expiryDate) return null;
    const expiry = new Date(form.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', text: 'VENCIDO', color: 'text-red-600 bg-red-100' };
    if (daysUntilExpiry <= 30) return { status: 'warning', text: `Vence en ${daysUntilExpiry} días`, color: 'text-orange-600 bg-orange-100' };
    return { status: 'ok', text: `Vence en ${daysUntilExpiry} días`, color: 'text-green-600 bg-green-100' };
  };

  const expiry = expiryStatus();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Lote' : 'Nuevo Lote'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="label">Número de Lote</label>
              <input 
                type="text" 
                value={form.lotNumber} 
                onChange={(e) => setForm({ ...form, lotNumber: e.target.value })} 
                className="input"
                placeholder="Se genera automáticamente si se deja vacío"
              />
            </div>
            
            <div>
              <label className="label">Cantidad *</label>
              <input 
                type="number" 
                value={form.quantity} 
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                className="input" 
                min={isEditing ? "0" : "1"}
                required 
              />
            </div>
            
            {/* Fecha de Vencimiento - Prominente */}
            <div className="p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <label className="label flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Calendar className="w-4 h-4" />
                Fecha de Vencimiento
              </label>
              <input 
                type="date" 
                value={form.expiryDate} 
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} 
                className="input mt-1" 
              />
              {expiry && (
                <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1 ${expiry.color}`}>
                  {expiry.status === 'expired' && <AlertTriangle className="w-4 h-4" />}
                  {expiry.status === 'warning' && <Clock className="w-4 h-4" />}
                  {expiry.text}
                </div>
              )}
            </div>

            {/* Historial de cambios - Solo en edición */}
            {isEditing && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                    <History className="w-4 h-4" />
                    Historial de Cambios ({auditHistory.length})
                  </span>
                  <span className="text-gray-400">{showHistory ? '▼' : '▶'}</span>
                </button>
                
                {showHistory && (
                  <div className="border-t border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                    {loadingHistory ? (
                      <div className="p-4 text-center text-gray-500">Cargando...</div>
                    ) : auditHistory.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">Sin cambios registrados</div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {auditHistory.map((entry) => (
                          <div key={entry.id} className="p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                entry.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                entry.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {entry.action === 'CREATE' ? 'Creado' : 
                                 entry.action === 'UPDATE' ? 'Modificado' : 'Eliminado'}
                              </span>
                              <span className="text-gray-400 text-xs">
                                {new Date(entry.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <User className="w-3 h-3" />
                              <span>{entry.user.firstName} {entry.user.lastName}</span>
                            </div>
                            {entry.action === 'UPDATE' && (
                              <div className="mt-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                {formatAuditChanges(entry.oldValues, entry.newValues)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
