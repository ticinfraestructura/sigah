import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Clock } from 'lucide-react';
import { requestApi } from '../services/api';
import { Request } from '../types';

const statusLabels: Record<string, string> = {
  REGISTERED: 'Registrada', IN_REVIEW: 'En Revisión', APPROVED: 'Aprobada',
  REJECTED: 'Rechazada', DELIVERED: 'Entregada', PARTIALLY_DELIVERED: 'Parcial', CANCELLED: 'Cancelada'
};
const statusColors: Record<string, string> = {
  REGISTERED: 'badge-gray', IN_REVIEW: 'badge-yellow', APPROVED: 'badge-blue',
  REJECTED: 'badge-red', DELIVERED: 'badge-green', PARTIALLY_DELIVERED: 'badge-yellow', CANCELLED: 'badge-red'
};

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) fetchRequest(); }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await requestApi.getById(id!);
      setRequest(response.data.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const updateStatus = async (status: string) => {
    if (!confirm(`¿Cambiar estado a ${statusLabels[status]}?`)) return;
    try {
      await requestApi.updateStatus(id!, status);
      fetchRequest();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!request) return <div className="text-center py-12">Solicitud no encontrada</div>;

  const canDeliver = ['APPROVED', 'PARTIALLY_DELIVERED'].includes(request.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/requests" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Solicitud {request.code}</h1>
          <p className="text-gray-500">{new Date(request.requestDate).toLocaleDateString()}</p>
        </div>
        {canDeliver && (
          <Link to={`/deliveries/new/${request.id}`} className="btn-success">
            <Truck className="w-4 h-4 mr-2" /> Registrar Entrega
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Beneficiario</h3>
          <p className="font-medium">{request.beneficiary?.firstName} {request.beneficiary?.lastName}</p>
          <p className="text-sm text-gray-500">{request.beneficiary?.documentType}-{request.beneficiary?.documentNumber}</p>
          <p className="text-sm text-gray-500 mt-2">{request.beneficiary?.phone}</p>
          <p className="text-sm text-gray-500">{request.beneficiary?.address}, {request.beneficiary?.city}</p>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Estado</h3>
          <span className={`badge ${request.status === 'DELIVERED' ? 'badge-green' : request.status === 'APPROVED' ? 'badge-blue' : 'badge-yellow'}`}>
            {statusLabels[request.status]}
          </span>
          <div className="flex flex-wrap gap-2 mt-4">
            {request.status === 'REGISTERED' && <button onClick={() => updateStatus('IN_REVIEW')} className="btn-secondary text-sm">En Revisión</button>}
            {request.status === 'IN_REVIEW' && (
              <>
                <button onClick={() => updateStatus('APPROVED')} className="btn-success text-sm">Aprobar</button>
                <button onClick={() => updateStatus('REJECTED')} className="btn-danger text-sm">Rechazar</button>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Resumen</h3>
          <p className="text-sm">Kits: <span className="font-semibold">{request.requestKits?.length || 0}</span></p>
          <p className="text-sm">Productos: <span className="font-semibold">{request.requestProducts?.length || 0}</span></p>
          <p className="text-sm">Entregas: <span className="font-semibold">{request.deliveries?.length || 0}</span></p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Items Solicitados</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2">Tipo</th><th className="text-left py-2">Item</th><th className="text-right py-2">Solicitado</th><th className="text-right py-2">Entregado</th></tr></thead>
          <tbody>
            {request.requestKits?.map(rk => (
              <tr key={rk.id} className="border-b"><td>Kit</td><td className="font-medium">{rk.kit?.name}</td><td className="text-right">{rk.quantityRequested}</td><td className="text-right">{rk.quantityDelivered}</td></tr>
            ))}
            {request.requestProducts?.map(rp => (
              <tr key={rp.id} className="border-b"><td>Producto</td><td className="font-medium">{rp.product?.name}</td><td className="text-right">{rp.quantityRequested}</td><td className="text-right">{rp.quantityDelivered}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {request.histories && request.histories.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4 dark:text-white">Historial de Cambios</h3>
          <div className="space-y-3">
            {request.histories.map(h => (
              <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm dark:text-white">
                      <span className={`badge ${statusColors[h.toStatus]} mr-2`}>{statusLabels[h.toStatus]}</span>
                      {h.fromStatus && (
                        <>
                          <span className="text-gray-500 dark:text-gray-400">←</span>
                          <span className="ml-2 text-gray-500">{statusLabels[h.fromStatus]}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Por <span className="font-medium">{h.user?.firstName} {h.user?.lastName}</span> • {new Date(h.createdAt).toLocaleString()}
                  </p>
                  {h.notes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">"{h.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
