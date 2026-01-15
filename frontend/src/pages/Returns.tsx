import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { returnApi } from '../services/api';
import { Return } from '../types';

const reasonLabels: Record<string, string> = {
  DAMAGED: 'Dañado', WRONG_DELIVERY: 'Error Entrega', NOT_CLAIMED: 'No Reclamado',
  EXPIRED: 'Vencido', DUPLICATE: 'Duplicado', OTHER: 'Otro'
};

export default function Returns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    returnApi.getAll().then(res => setReturns(res.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devoluciones</h1>
        <p className="text-gray-500 dark:text-gray-400">Registro de devoluciones</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-12">
          <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay devoluciones registradas</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Entrega Orig.</th><th>Motivo</th><th>Items</th><th>Procesado Por</th></tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.returnDate).toLocaleDateString()}</td>
                  <td className="font-mono text-sm">{r.delivery?.request?.code}</td>
                  <td><span className="badge-yellow">{reasonLabels[r.reason]}</span></td>
                  <td>{r.returnDetails?.length || 0} items</td>
                  <td>{r.processedBy?.firstName} {r.processedBy?.lastName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
