import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, AlertTriangle, Clock, Edit2, Trash2 } from 'lucide-react';
import { productApi, categoryApi, inventoryApi } from '../services/api';
import { Product, Category, Unit } from '../types';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [perishableFilter, setPerishableFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Desactivar el producto "${product.name}"? Podrá reactivarlo después.`)) return;
    try {
      await productApi.delete(product.id);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al desactivar');
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
      
      const response = await productApi.getAll(params);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de productos y stock</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </button>
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

      {/* Products table */}
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
                        <Link
                          to={`/inventory/${product.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium ml-2"
                        >
                          Detalles
                        </Link>
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
      alert(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Estilos explícitos para inputs y selects
  const inputStyle = "w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
  const selectStyle = "w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer";
  const labelStyle = "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete los datos del producto</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
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
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Stock Inicial (Opcional)
              </h4>
              <div className="grid grid-cols-3 gap-3">
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
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
  );
}
