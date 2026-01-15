import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, User, Package, FileText, AlertCircle, Users } from 'lucide-react';
import { requestApi, deliveryApi, beneficiaryApi } from '../services/api';
import { Request, Beneficiary } from '../types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Aprobada', color: 'bg-green-100 text-green-800' },
  PARTIALLY_DELIVERED: { label: 'Parcialmente Entregada', color: 'bg-blue-100 text-blue-800' },
};

export default function NewDelivery() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [form, setForm] = useState({ 
    kits: [] as {kitId: string; quantity: number}[], 
    products: [] as {productId: string; quantity: number}[], 
    notes: '', 
    isPartial: false 
  });
  const [loading, setLoading] = useState(false);
  
  // Para selección de receptor
  const [receiverType, setReceiverType] = useState<'beneficiary' | 'other'>('beneficiary');
  const [searchBeneficiary, setSearchBeneficiary] = useState('');
  const [beneficiaryResults, setBeneficiaryResults] = useState<Beneficiary[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<Beneficiary | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (requestId) {
      requestApi.getById(requestId).then(res => {
        const req = res.data.data;
        setRequest(req);
        // Pre-seleccionar el beneficiario de la solicitud
        if (req.beneficiary) {
          setSelectedReceiver(req.beneficiary);
        }
        setForm({
          kits: req.requestKits?.filter((rk: any) => rk.quantityRequested > rk.quantityDelivered).map((rk: any) => ({ kitId: rk.kitId, quantity: rk.quantityRequested - rk.quantityDelivered })) || [],
          products: req.requestProducts?.filter((rp: any) => rp.quantityRequested > rp.quantityDelivered).map((rp: any) => ({ productId: rp.productId, quantity: rp.quantityRequested - rp.quantityDelivered })) || [],
          notes: '', 
          isPartial: false
        });
      });
    }
  }, [requestId]);

  // Buscar beneficiarios
  useEffect(() => {
    const searchBeneficiaries = async () => {
      if (searchBeneficiary.length < 2) {
        setBeneficiaryResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const response = await beneficiaryApi.getAll({ search: searchBeneficiary, limit: 10 });
        setBeneficiaryResults(response.data.data);
      } catch (error) {
        console.error('Error buscando beneficiarios:', error);
      } finally {
        setSearchLoading(false);
      }
    };
    
    const debounce = setTimeout(searchBeneficiaries, 300);
    return () => clearTimeout(debounce);
  }, [searchBeneficiary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await deliveryApi.create({ 
        requestId: requestId!, 
        ...form 
      });
      navigate('/deliveries');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear la entrega');
    } finally { 
      setLoading(false); 
    }
  };

  if (!request) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  const isApproved = ['APPROVED', 'PARTIALLY_DELIVERED'].includes(request.status);
  const statusConfig = STATUS_LABELS[request.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Entrega</h1>
          <p className="text-gray-500">Crear entrega para solicitud {request.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-6">
            
            {/* Estado de Aprobación */}
            <div className={`p-4 rounded-lg border-2 ${isApproved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {isApproved ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <p className="font-bold text-lg">
                    {isApproved ? 'Solicitud Aprobada' : 'Solicitud No Aprobada'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Estado actual: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                      {statusConfig?.label || request.status}
                    </span>
                  </p>
                </div>
              </div>
              {!isApproved && (
                <p className="mt-2 text-sm text-red-600">
                  La solicitud debe estar aprobada para crear una entrega.
                </p>
              )}
            </div>

            {/* Selección de Receptor */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold">Persona que Recibirá la Entrega</h3>
              </div>

              {/* Opciones de tipo de receptor */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="receiverType"
                    checked={receiverType === 'beneficiary'}
                    onChange={() => {
                      setReceiverType('beneficiary');
                      setSelectedReceiver(request.beneficiary);
                    }}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm">Beneficiario de la solicitud</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="receiverType"
                    checked={receiverType === 'other'}
                    onChange={() => {
                      setReceiverType('other');
                      setSelectedReceiver(null);
                      setSearchBeneficiary('');
                    }}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm">Otra persona (buscar)</span>
                </label>
              </div>

              {/* Mostrar beneficiario seleccionado o buscador */}
              {receiverType === 'beneficiary' ? (
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-primary-900">
                        {request.beneficiary?.firstName} {request.beneficiary?.lastName}
                      </p>
                      <p className="text-sm text-primary-700">
                        {request.beneficiary?.documentType}: {request.beneficiary?.documentNumber}
                      </p>
                      {request.beneficiary?.phone && (
                        <p className="text-sm text-primary-600">Tel: {request.beneficiary.phone}</p>
                      )}
                      {request.beneficiary?.address && (
                        <p className="text-sm text-primary-600">
                          {request.beneficiary.address}, {request.beneficiary.city}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-green">Beneficiario</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Buscador */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchBeneficiary}
                      onChange={(e) => setSearchBeneficiary(e.target.value)}
                      placeholder="Buscar por nombre o documento..."
                      className="input w-full"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Resultados de búsqueda */}
                  {beneficiaryResults.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {beneficiaryResults.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedReceiver(b);
                            setSearchBeneficiary('');
                            setBeneficiaryResults([]);
                          }}
                          className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                            selectedReceiver?.id === b.id ? 'bg-primary-50' : ''
                          }`}
                        >
                          <p className="font-medium">{b.firstName} {b.lastName}</p>
                          <p className="text-sm text-gray-500">{b.documentType}: {b.documentNumber}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Receptor seleccionado */}
                  {selectedReceiver && receiverType === 'other' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-blue-900">
                            {selectedReceiver.firstName} {selectedReceiver.lastName}
                          </p>
                          <p className="text-sm text-blue-700">
                            {selectedReceiver.documentType}: {selectedReceiver.documentNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReceiver(null)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items a Entregar */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold">Items a Entregar</h3>
              </div>

              {form.kits.length > 0 && (
                <div>
                  <label className="label text-sm font-medium text-gray-600">Kits</label>
                  {form.kits.map((k, i) => {
                    const kit = request.requestKits?.find(rk => rk.kitId === k.kitId);
                    const pending = (kit?.quantityRequested || 0) - (kit?.quantityDelivered || 0);
                    return (
                      <div key={i} className="flex items-center gap-4 mb-2 p-3 bg-gray-50 rounded-lg">
                        <span className="flex-1 font-medium">{kit?.kit?.name}</span>
                        <span className="text-sm text-gray-500">Pendiente: {pending}</span>
                        <input 
                          type="number" 
                          value={k.quantity} 
                          onChange={(e) => { 
                            const newKits = [...form.kits]; 
                            newKits[i].quantity = Math.min(parseInt(e.target.value)||0, pending); 
                            setForm({...form, kits: newKits}); 
                          }} 
                          className="input w-24 text-center" 
                          min="0" 
                          max={pending}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {form.products.length > 0 && (
                <div>
                  <label className="label text-sm font-medium text-gray-600">Productos</label>
                  {form.products.map((p, i) => {
                    const prod = request.requestProducts?.find(rp => rp.productId === p.productId);
                    const pending = (prod?.quantityRequested || 0) - (prod?.quantityDelivered || 0);
                    return (
                      <div key={i} className="flex items-center gap-4 mb-2 p-3 bg-gray-50 rounded-lg">
                        <span className="flex-1 font-medium">{prod?.product?.name}</span>
                        <span className="text-sm text-gray-500">Pendiente: {pending}</span>
                        <input 
                          type="number" 
                          value={p.quantity} 
                          onChange={(e) => { 
                            const newProds = [...form.products]; 
                            newProds[i].quantity = Math.min(parseInt(e.target.value)||0, pending); 
                            setForm({...form, products: newProds}); 
                          }} 
                          className="input w-24 text-center" 
                          min="0" 
                          max={pending}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {form.kits.length === 0 && form.products.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay items pendientes de entrega</p>
                </div>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="label flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notas de la entrega
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                className="input w-full"
                rows={3}
                placeholder="Observaciones adicionales..."
              />
            </div>

            {/* Entrega parcial */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input 
                type="checkbox" 
                id="isPartial" 
                checked={form.isPartial} 
                onChange={(e) => setForm({...form, isPartial: e.target.checked})} 
                className="w-4 h-4 text-primary-600" 
              />
              <label htmlFor="isPartial" className="text-sm">
                Marcar como entrega parcial (se entregarán más items después)
              </label>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading || !isApproved || (form.kits.length === 0 && form.products.length === 0)} 
                className="btn btn-primary"
              >
                {loading ? 'Creando...' : 'Crear Entrega'}
              </button>
            </div>
          </form>
        </div>

        {/* Panel Lateral - Resumen */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6 space-y-4">
            <h3 className="font-bold text-lg">Resumen de Solicitud</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Código</p>
                <p className="font-mono font-bold text-primary-600">{request.code}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Fecha de Solicitud</p>
                <p className="font-medium">{new Date(request.requestDate).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Prioridad</p>
                <p className="font-medium">
                  {request.priority === 0 ? 'Normal' : request.priority === 1 ? 'Alta' : 'Urgente'}
                </p>
              </div>

              {request.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="text-sm">{request.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Receptor seleccionado</p>
              {selectedReceiver ? (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedReceiver.firstName} {selectedReceiver.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedReceiver.documentType}: {selectedReceiver.documentNumber}</p>
                </div>
              ) : (
                <p className="text-sm text-amber-600">Seleccione un receptor</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
