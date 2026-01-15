import { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  Search, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Package,
  FileText,
  Settings,
  Clock,
  Phone,
  X
} from 'lucide-react';
import api from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleName: string;
  hasPhone: boolean;
}

interface NotificationType {
  value: string;
  label: string;
  icon: string;
}

interface Criticality {
  value: string;
  label: string;
  icon: string;
}

interface Notification {
  id: string;
  code: string;
  type: string;
  title: string;
  message: string;
  criticality: string;
  channel: string;
  whatsappSent: boolean;
  whatsappSentAt: string | null;
  isRead: boolean;
  createdAt: string;
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

// Iconos de tipo
const TYPE_ICONS: Record<string, React.ReactNode> = {
  INFO: <Info className="w-5 h-5 text-blue-500" />,
  ALERT: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  DELIVERY: <Package className="w-5 h-5 text-green-500" />,
  REQUEST: <FileText className="w-5 h-5 text-purple-500" />,
  SYSTEM: <Settings className="w-5 h-5 text-gray-500" />,
  REMINDER: <Clock className="w-5 h-5 text-orange-500" />
};

// Colores de criticidad
const CRITICALITY_COLORS: Record<string, string> = {
  INFORMATIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  NORMAL: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export default function NotificationsManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [criticalities, setCriticalities] = useState<Criticality[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCriticality, setFilterCriticality] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    receiverId: '',
    type: 'INFO',
    criticality: 'NORMAL',
    title: '',
    message: '',
    sendWhatsApp: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, configRes, notificationsRes] = await Promise.all([
        api.get('/whatsapp-notifications/users'),
        api.get('/whatsapp-notifications/config'),
        api.get('/whatsapp-notifications')
      ]);

      setUsers(usersRes.data.data);
      setTypes(configRes.data.data.types);
      setCriticalities(configRes.data.data.criticalities);
      setNotifications(notificationsRes.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);

    try {
      const response = await api.post('/whatsapp-notifications/send', formData);
      
      if (response.data.success) {
        const waStatus = response.data.data.whatsapp;
        if (waStatus.sent) {
          setSuccess(`✅ Notificación enviada exitosamente por WhatsApp. ID: ${waStatus.messageId}`);
        } else if (formData.sendWhatsApp) {
          setSuccess(`⚠️ Notificación guardada. WhatsApp: ${waStatus.error || 'Usuario sin teléfono registrado'}`);
        } else {
          setSuccess('✅ Notificación guardada correctamente');
        }

        fetchData();
        setTimeout(() => {
          setShowModal(false);
          resetForm();
          setSuccess('');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar notificación');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setFormData({
      receiverId: '',
      type: 'INFO',
      criticality: 'NORMAL',
      title: '',
      message: '',
      sendWhatsApp: true
    });
    setError('');
  };

  const selectedUser = users.find(u => u.id === formData.receiverId);

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.receiver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.receiver.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || n.type === filterType;
    const matchesCriticality = !filterCriticality || n.criticality === filterCriticality;
    return matchesSearch && matchesType && matchesCriticality;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-7 h-7" />
            Sistema de Notificaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Envía notificaciones por WhatsApp a usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          Nueva Notificación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total enviadas</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {notifications.filter(n => n.whatsappSent).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Por WhatsApp</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {notifications.filter(n => n.criticality === 'CRITICAL' || n.criticality === 'HIGH').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Críticas/Altas</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.hasPhone).length}/{users.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Con WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input w-40"
            >
              <option value="">Todos los tipos</option>
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
            <select
              value={filterCriticality}
              onChange={(e) => setFilterCriticality(e.target.value)}
              className="input w-40"
            >
              <option value="">Todas las criticidades</option>
              {criticalities.map(c => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Título / Mensaje
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Destinatario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Criticidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Canal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {TYPE_ICONS[notification.type] || <Bell className="w-5 h-5" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{notification.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Código: {notification.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-white">
                      {notification.receiver.firstName} {notification.receiver.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {notification.receiver.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${CRITICALITY_COLORS[notification.criticality]}`}>
                      {criticalities.find(c => c.value === notification.criticality)?.label || notification.criticality}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {notification.whatsappSent ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                          <Phone className="w-4 h-4" />
                          WhatsApp
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          Interno
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(notification.createdAt).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay notificaciones</p>
            </div>
          )}
        </div>
      </div>

      {/* Send Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5" />
                Enviar Notificación
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg">
                  {success}
                </div>
              )}

              {/* Destinatario */}
              <div>
                <label className="label">Destinatario *</label>
                <select
                  value={formData.receiverId}
                  onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar usuario...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} - {user.roleName}
                      {user.hasPhone ? ' 📱' : ' (sin teléfono)'}
                    </option>
                  ))}
                </select>
                {selectedUser && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {selectedUser.email}
                    {selectedUser.phone && ` • ${selectedUser.phone}`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <label className="label">Tipo de mensaje *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                    required
                  >
                    {types.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Criticidad */}
                <div>
                  <label className="label">Criticidad *</label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                    className="input"
                    required
                  >
                    {criticalities.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="label">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Título del mensaje"
                  required
                  maxLength={100}
                />
              </div>

              {/* Mensaje */}
              <div>
                <label className="label">Mensaje *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Contenido del mensaje..."
                  required
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.message.length}/1000 caracteres</p>
              </div>

              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Enviar por WhatsApp</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedUser?.hasPhone 
                        ? 'El usuario tiene teléfono registrado' 
                        : 'El usuario no tiene teléfono registrado'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendWhatsApp}
                    onChange={(e) => setFormData({ ...formData, sendWhatsApp: e.target.checked })}
                    className="sr-only peer"
                    disabled={!selectedUser?.hasPhone}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600 peer-disabled:opacity-50"></div>
                </label>
              </div>

              {/* Preview */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
                  📱 Vista previa del mensaje WhatsApp:
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm">
                  <p className="font-bold">
                    {types.find(t => t.value === formData.type)?.icon} SIGAH - Notificación
                  </p>
                  <p className="font-semibold mt-2">{formData.title || 'Título del mensaje'}</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {formData.message || 'Contenido del mensaje...'}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {criticalities.find(c => c.value === formData.criticality)?.icon} Criticidad: {criticalities.find(c => c.value === formData.criticality)?.label}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary"
                  disabled={sending}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex items-center gap-2"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Notificación
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
