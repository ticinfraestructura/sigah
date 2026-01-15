import { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';
import { deliveryApi } from '../services/api';
import { Delivery } from '../types';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const response = await deliveryApi.getAll();
      setDeliveries(response.data.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entregas</h1>
        <p className="text-gray-500 dark:text-gray-400">Historial de entregas realizadas</p>
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
                <th>Solicitud</th><th>Fecha Entrega</th><th>Beneficiario</th><th>Entregado Por</th><th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td className="font-mono text-sm">{d.request?.code}</td>
                  <td>{new Date(d.deliveryDate).toLocaleDateString()}</td>
                  <td>
                    <p className="font-medium">{d.request?.beneficiary?.firstName} {d.request?.beneficiary?.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recibido: {d.receivedBy || '-'}</p>
                  </td>
                  <td>{d.deliveredBy?.firstName} {d.deliveredBy?.lastName}</td>
                  <td><span className={`badge ${d.isPartial ? 'badge-yellow' : 'badge-green'}`}>{d.isPartial ? 'Parcial' : 'Completa'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
