import { useState, useEffect } from 'react';
import { Plus, Search, Edit2 } from 'lucide-react';
import { beneficiaryApi } from '../services/api';
import { Beneficiary, DocumentType } from '../types';

const populationLabels: Record<string, string> = {
  DISPLACED: 'Desplazado', REFUGEE: 'Refugiado', VULNERABLE: 'Vulnerable',
  ELDERLY: 'Adulto Mayor', DISABLED: 'Discapacidad', INDIGENOUS: 'Indígena',
  AFRO: 'Afrodescendiente', OTHER: 'Otro'
};

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);

  const handleEdit = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBeneficiary(null);
  };

  useEffect(() => { fetchData(); }, [search]);

  const fetchData = async () => {
    try {
      const response = await beneficiaryApi.getAll({ search });
      setBeneficiaries(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Beneficiarios</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de beneficiarios</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Beneficiario
        </button>
      </div>

      <div className="card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o documento..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Tipo Población</th>
                <th>Familia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-sm">{b.documentType}-{b.documentNumber}</td>
                  <td className="font-medium">{b.firstName} {b.lastName}</td>
                  <td className="text-sm text-gray-600 dark:text-gray-300">{b.phone || '-'}<br/>{b.city || ''}</td>
                  <td><span className="badge-blue">{populationLabels[b.populationType || ''] || '-'}</span></td>
                  <td className="text-center">{b.familySize}</td>
                  <td><span className={`badge ${b.isActive ? 'badge-green' : 'badge-gray'}`}>{b.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <button 
                      onClick={() => handleEdit(b)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar beneficiario"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <BeneficiaryModal 
          beneficiary={editingBeneficiary} 
          onClose={handleCloseModal} 
          onSave={fetchData} 
        />
      )}
    </div>
  );
}

interface BeneficiaryModalProps {
  beneficiary: Beneficiary | null;
  onClose: () => void;
  onSave: () => void;
}

function BeneficiaryModal({ beneficiary, onClose, onSave }: BeneficiaryModalProps) {
  const isEditing = !!beneficiary;
  const [form, setForm] = useState({
    documentType: beneficiary?.documentType || 'CC',
    documentNumber: beneficiary?.documentNumber || '',
    firstName: beneficiary?.firstName || '',
    lastName: beneficiary?.lastName || '',
    phone: beneficiary?.phone || '',
    address: beneficiary?.address || '',
    city: beneficiary?.city || '',
    populationType: beneficiary?.populationType || '',
    familySize: beneficiary?.familySize || 1,
    isActive: beneficiary?.isActive ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && beneficiary) {
        await beneficiaryApi.update(beneficiary.id, form);
      } else {
        await beneficiaryApi.create(form);
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            {isEditing ? 'Editar Beneficiario' : 'Nuevo Beneficiario'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Tipo Doc.</label>
              <select value={form.documentType} onChange={(e) => setForm({...form, documentType: e.target.value as DocumentType})} className="input">
                <option value="CC">CC</option><option value="TI">TI</option><option value="CE">CE</option><option value="PASSPORT">Pasaporte</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Número Documento</label>
              <input type="text" value={form.documentNumber} onChange={(e) => setForm({...form, documentNumber: e.target.value})} className="input" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nombres</label><input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="input" required /></div>
            <div><label className="label">Apellidos</label><input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="input" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Teléfono</label><input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input" /></div>
            <div><label className="label">Ciudad</label><input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="input" /></div>
          </div>
          <div><label className="label">Dirección</label><input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Tipo Población</label>
              <select value={form.populationType} onChange={(e) => setForm({...form, populationType: e.target.value})} className="input">
                <option value="">Seleccionar...</option>
                {Object.entries(populationLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label">Tamaño Familia</label><input type="number" value={form.familySize} onChange={(e) => setForm({...form, familySize: parseInt(e.target.value)||1})} className="input" min="1" /></div>
          </div>
          {isEditing && (
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isActive" 
                checked={form.isActive} 
                onChange={(e) => setForm({...form, isActive: e.target.checked})}
                className="w-4 h-4 text-primary-600 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="label mb-0">Beneficiario activo</label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
