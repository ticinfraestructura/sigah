import { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  HardDrive,
  Clock,
  Shield
} from 'lucide-react';
import { backupApi } from '../services/api';

interface Backup {
  name: string;
  size: number;
  sizeMB: string;
  createdAt: string;
  type: 'manual' | 'auto' | 'pre-restore' | 'unknown';
}

interface BackupStats {
  count: number;
  totalSizeMB: string;
  lastBackup: string | null;
  oldestBackup: string | null;
}

export default function BackupManagement() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await backupApi.getAll();
      setBackups(res.data.data.backups);
      setStats(res.data.data.stats);
    } catch (err: any) {
      showMessage('error', err.response?.data?.error || 'Error al cargar copias de seguridad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      await backupApi.create();
      showMessage('success', 'Copia de seguridad creada exitosamente');
      await fetchBackups();
    } catch (err: any) {
      showMessage('error', err.response?.data?.error || 'Error al crear copia de seguridad');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (name: string) => {
    try {
      setRestoring(name);
      setConfirmRestore(null);
      await backupApi.restore(name);
      showMessage('success', `Restauración de "${name}" completada. Reinicie el servidor para aplicar los cambios.`);
    } catch (err: any) {
      showMessage('error', err.response?.data?.error || 'Error al restaurar copia de seguridad');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      setDeleting(name);
      setConfirmDelete(null);
      await backupApi.delete(name);
      showMessage('success', `Copia "${name}" eliminada`);
      await fetchBackups();
    } catch (err: any) {
      showMessage('error', err.response?.data?.error || 'Error al eliminar copia de seguridad');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const typeLabel: Record<string, { label: string; className: string }> = {
    manual: { label: 'Manual', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    auto: { label: 'Automático', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    'pre-restore': { label: 'Pre-restauración', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    unknown: { label: 'Desconocido', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-7 h-7 text-primary-600" />
            Copias de Seguridad
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de respaldos de la base de datos PostgreSQL
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Creando...' : 'Crear backup manual'}
          </button>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`flex items-start gap-3 p-4 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
          {message.text}
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total backups', value: stats.count, icon: Database, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
            { label: 'Tamaño total', value: `${stats.totalSizeMB} MB`, icon: HardDrive, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
            { label: 'Último backup', value: stats.lastBackup ? formatDate(stats.lastBackup) : 'Ninguno', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
            { label: 'Retención', value: 'Últimos 30', icon: Shield, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aviso de restauración */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong>Atención:</strong> La restauración sobrescribe todos los datos actuales de la base de datos.
          Se crea automáticamente una copia de seguridad previa antes de restaurar. El servidor requiere reinicio para aplicar los cambios.
        </div>
      </div>

      {/* Tabla de backups */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Copias disponibles
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay copias de seguridad</p>
            <p className="text-sm mt-1">Crea el primer backup manual o espera el automático</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Tipo</th>
                  <th className="px-6 py-3 text-left">Tamaño</th>
                  <th className="px-6 py-3 text-left">Fecha</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {backups.map((backup) => {
                  const badge = typeLabel[backup.type] || typeLabel.unknown;
                  return (
                    <tr key={backup.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {backup.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {backup.sizeMB} MB
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setConfirmRestore(backup.name)}
                            disabled={!!restoring || !!deleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg disabled:opacity-40 transition-colors"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${restoring === backup.name ? 'animate-spin' : ''}`} />
                            {restoring === backup.name ? 'Restaurando...' : 'Restaurar'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(backup.name)}
                            disabled={!!restoring || !!deleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg disabled:opacity-40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleting === backup.name ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal confirmación restaurar */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar restauración</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Restaurar la base de datos desde <strong className="font-mono text-xs break-all">{confirmRestore}</strong>?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              Esta acción sobrescribirá todos los datos actuales. Se creará automáticamente una copia de seguridad previa.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmRestore(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRestore(confirmRestore)}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
              >
                Sí, restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar eliminación</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Eliminar la copia <strong className="font-mono text-xs break-all">{confirmDelete}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
