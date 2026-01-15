import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, XCircle, RotateCcw } from 'lucide-react';
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

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const handleCancel = async (req: Request) => {
    if (req.status === 'CANCELLED' || req.status === 'DELIVERED') {
      alert('Esta solicitud no puede ser cancelada');
      return;
    }
    if (!confirm(`¿Cancelar la solicitud "${req.code}"?`)) return;
    try {
      await requestApi.updateStatus(req.id, 'CANCELLED');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cancelar');
    }
  };

  const handleReactivate = async (req: Request) => {
    if (req.status !== 'CANCELLED') {
      alert('Solo se pueden reactivar solicitudes canceladas');
      return;
    }
    if (!confirm(`¿Reactivar la solicitud "${req.code}"? Volverá al estado "Registrada".`)) return;
    try {
      await requestApi.updateStatus(req.id, 'REGISTERED');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al reactivar');
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter, search]);

  const fetchData = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const response = await requestApi.getAll(params);
      setRequests(response.data.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Solicitudes</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de solicitudes de ayuda</p>
        </div>
        <Link to="/requests/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nueva Solicitud
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar por código o beneficiario..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full md:w-48">
            <option value="">Todos los estados</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
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
                <th>Código</th><th>Fecha</th><th>Beneficiario</th><th>Items</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="font-mono text-sm font-medium">{req.code}</td>
                  <td className="text-sm">{new Date(req.requestDate).toLocaleDateString()}</td>
                  <td>
                    <p className="font-medium">{req.beneficiary?.firstName} {req.beneficiary?.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{req.beneficiary?.documentType}-{req.beneficiary?.documentNumber}</p>
                  </td>
                  <td className="text-sm">
                    {req.requestKits?.length || 0} kits, {req.requestProducts?.length || 0} productos
                  </td>
                  <td><span className={`badge ${statusColors[req.status]}`}>{statusLabels[req.status]}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link 
                        to={`/requests/${req.id}`} 
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {req.status !== 'CANCELLED' && req.status !== 'DELIVERED' && (
                        <button
                          onClick={() => handleCancel(req)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="Cancelar solicitud"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {req.status === 'CANCELLED' && (
                        <button
                          onClick={() => handleReactivate(req)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                          title="Reactivar solicitud"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
