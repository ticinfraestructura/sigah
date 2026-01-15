import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { kitApi, productApi } from '../services/api';
import { Kit, Product } from '../types';

export default function Kits() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);

  const handleDelete = async (kit: Kit) => {
    if (!confirm(`¿Desactivar el kit "${kit.name}"? Podrá reactivarlo después.`)) return;
    try {
      await kitApi.delete(kit.id);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al desactivar');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [kitsRes, productsRes] = await Promise.all([
        kitApi.getAll(),
        productApi.getAll()
      ]);
      setKits(kitsRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kits de Ayuda</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de kits humanitarios</p>
        </div>
        <button onClick={() => { setSelectedKit(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Kit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kits.map((kit) => (
          <div key={kit.id} className={`card hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 ${!kit.isActive ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Boxes className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${kit.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'}`}>
                  {kit.isActive ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <Link
                  to={`/kits/${kit.id}`}
                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                  title="Ver historial"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedKit(kit); setShowModal(true); }}
                  className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(kit); }}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  title="Desactivar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs font-mono text-primary-600 dark:text-primary-400 mb-1">{kit.code}</p>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{kit.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{kit.description || 'Sin descripción'}</p>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wide">Composición del Kit:</p>
              <div className="space-y-2">
                {kit.kitProducts && kit.kitProducts.length > 0 ? (
                  <>
                    {kit.kitProducts.slice(0, 4).map((kp) => (
                      <div key={kp.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                        <span className="text-gray-800 dark:text-gray-100 font-medium">{kp.product?.name || 'Producto'}</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">{kp.quantity} uds</span>
                      </div>
                    ))}
                    {kit.kitProducts.length > 4 && (
                      <p className="text-xs text-primary-600 dark:text-primary-400 font-medium text-center">+{kit.kitProducts.length - 4} productos más...</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">Sin productos asignados</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {kits.length === 0 && (
        <div className="text-center py-12">
          <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay kits configurados</p>
        </div>
      )}

      {showModal && (
        <KitModal
          kit={selectedKit}
          products={products}
          onClose={() => setShowModal(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
}

function KitModal({ kit, products, onClose, onSave }: { kit: Kit | null; products: Product[]; onClose: () => void; onSave: () => void }) {
  const isEditing = !!kit;
  const [form, setForm] = useState({
    code: kit?.code || '',
    name: kit?.name || '',
    description: kit?.description || '',
    isActive: kit?.isActive ?? true,
    products: kit?.kitProducts?.map(kp => ({ productId: kp.productId, quantity: kp.quantity })) || []
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.products.length === 0) {
      alert('Debe agregar al menos un producto al kit');
      return;
    }
    if (form.products.some(p => !p.productId)) {
      alert('Todos los productos deben estar seleccionados');
      return;
    }
    setSaving(true);
    try {
      if (kit) {
        await kitApi.update(kit.id, form);
      } else {
        await kitApi.create(form);
      }
      onSave();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const addProduct = () => {
    setForm({ ...form, products: [...form.products, { productId: '', quantity: 1 }] });
  };

  const removeProduct = (index: number) => {
    setForm({ ...form, products: form.products.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Editar Kit' : 'Crear Nuevo Kit'}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure los detalles y productos del kit</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Código *</label>
              <input 
                type="text" 
                value={form.code} 
                onChange={(e) => setForm({ ...form, code: e.target.value })} 
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                placeholder="Ej: KIT-001"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Nombre *</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                placeholder="Ej: Kit Familiar Básico"
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Descripción</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              rows={2}
              placeholder="Descripción opcional del kit..."
            />
          </div>
          
          {/* Productos del Kit */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-white">Productos del Kit *</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Agregue los productos que componen este kit</p>
              </div>
              <button 
                type="button" 
                onClick={addProduct} 
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Agregar Producto
              </button>
            </div>
            
            {form.products.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <Boxes className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No hay productos agregados</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Haga clic en "Agregar Producto" para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.products.map((p, i) => (
                  <div key={i} className="flex gap-3 items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 w-6">{i + 1}.</span>
                    <select 
                      value={p.productId} 
                      onChange={(e) => {
                        const newProducts = [...form.products];
                        newProducts[i].productId = e.target.value;
                        setForm({ ...form, products: newProducts });
                      }} 
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">-- Seleccionar producto --</option>
                      {products.map(prod => (
                        <option key={prod.id} value={prod.id}>
                          {prod.code} - {prod.name} (Stock: {prod.totalStock || 0})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-300">Cant:</label>
                      <input 
                        type="number" 
                        value={p.quantity} 
                        onChange={(e) => {
                          const newProducts = [...form.products];
                          newProducts[i].quantity = parseInt(e.target.value) || 1;
                          setForm({ ...form, products: newProducts });
                        }} 
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-bold focus:ring-2 focus:ring-primary-500" 
                        min="1" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeProduct(i)} 
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {isEditing && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <input 
                type="checkbox" 
                id="kitActive" 
                checked={form.isActive} 
                onChange={(e) => setForm({...form, isActive: e.target.checked})} 
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
              />
              <label htmlFor="kitActive" className="text-sm font-medium text-gray-700 dark:text-gray-200">Kit activo (visible para entregas)</label>
            </div>
          )}
        </form>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors" disabled={saving}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50" disabled={saving}>
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar Kit' : 'Crear Kit')}
          </button>
        </div>
      </div>
    </div>
  );
}
