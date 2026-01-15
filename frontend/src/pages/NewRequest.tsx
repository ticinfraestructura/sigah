import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { requestApi, beneficiaryApi, kitApi, productApi } from '../services/api';
import { Beneficiary, Kit, Product } from '../types';

export default function NewRequest() {
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ beneficiaryId: '', kits: [] as {kitId: string; quantity: number}[], products: [] as {productId: string; quantity: number}[], notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([beneficiaryApi.getAll(), kitApi.getAll(), productApi.getAll()])
      .then(([b, k, p]) => { setBeneficiaries(b.data.data); setKits(k.data.data); setProducts(p.data.data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.beneficiaryId) return alert('Seleccione un beneficiario');
    if (form.kits.length === 0 && form.products.length === 0) return alert('Agregue al menos un kit o producto');
    setLoading(true);
    try {
      const response = await requestApi.create(form);
      navigate(`/requests/${response.data.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  const addKit = () => setForm({...form, kits: [...form.kits, {kitId: '', quantity: 1}]});
  const removeKit = (i: number) => setForm({...form, kits: form.kits.filter((_, idx) => idx !== i)});
  const addProduct = () => setForm({...form, products: [...form.products, {productId: '', quantity: 1}]});
  const removeProduct = (i: number) => setForm({...form, products: form.products.filter((_, idx) => idx !== i)});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Solicitud</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-3xl space-y-6">
        <div>
          <label className="label">Beneficiario</label>
          <select value={form.beneficiaryId} onChange={(e) => setForm({...form, beneficiaryId: e.target.value})} className="input" required>
            <option value="">Seleccionar beneficiario...</option>
            {beneficiaries.map(b => <option key={b.id} value={b.id}>{b.firstName} {b.lastName} - {b.documentType}{b.documentNumber}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Kits</label>
            <button type="button" onClick={addKit} className="text-sm text-primary-600 hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar Kit</button>
          </div>
          {form.kits.map((k, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <select value={k.kitId} onChange={(e) => { const newKits = [...form.kits]; newKits[i].kitId = e.target.value; setForm({...form, kits: newKits}); }} className="input flex-1">
                <option value="">Seleccionar kit...</option>
                {kits.map(kit => <option key={kit.id} value={kit.id}>{kit.name}</option>)}
              </select>
              <input type="number" value={k.quantity} onChange={(e) => { const newKits = [...form.kits]; newKits[i].quantity = parseInt(e.target.value)||1; setForm({...form, kits: newKits}); }} className="input w-24" min="1" />
              <button type="button" onClick={() => removeKit(i)} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Productos Individuales</label>
            <button type="button" onClick={addProduct} className="text-sm text-primary-600 hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar Producto</button>
          </div>
          {form.products.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <select value={p.productId} onChange={(e) => { const newProds = [...form.products]; newProds[i].productId = e.target.value; setForm({...form, products: newProds}); }} className="input flex-1">
                <option value="">Seleccionar producto...</option>
                {products.map(prod => <option key={prod.id} value={prod.id}>{prod.name} ({prod.totalStock || 0} disp.)</option>)}
              </select>
              <input type="number" value={p.quantity} onChange={(e) => { const newProds = [...form.products]; newProds[i].quantity = parseInt(e.target.value)||1; setForm({...form, products: newProds}); }} className="input w-24" min="1" />
              <button type="button" onClick={() => removeProduct(i)} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="input" rows={2} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Guardando...' : 'Crear Solicitud'}</button>
        </div>
      </form>
    </div>
  );
}
