import { useState, useEffect } from 'react';
import { 
  Send, MessageSquare, Users, Phone, Check, AlertCircle,
  Bell, Info, Truck, FileText, Settings, Clock, CheckCircle,
  Search, RefreshCw
} from 'lucide-react';
import api from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleName: string | null;
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
  criticality: string;
  title: string;
  message: string;
  channel: string;
  whatsappSent: boolean;
  createdAt: string;
  receiver: { firstName: string; lastName: string; phone: string | null };
  sender: { firstName: string; lastName: string };
}

const typeIcons: Record<string, any> = {
  INFO: Info,
  ALERT: AlertCircle,
  DELIVERY: Truck,
  REQUEST: FileText,
  SYSTEM: Settings,
  REMINDER: Bell,
};

const criticalityColors: Record<string, string> = {
  INFORMATIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  NORMAL: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function SendNotifications() {
  const [users, setUsers] = useState<User[]>([]);
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [criticalities, setCriticalities] = useState<Criticality[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
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
      setLoading(true);
      const [usersRes, configRes, notifRes] = await Promise.all([
        api.get('/whatsapp-notifications/users'),
        api.get('/whatsapp-notifications/config'),
        api.get('/whatsapp-notifications', { params: { limit: 20 } })
      ]);
      setUsers(usersRes.data.data);
      setTypes(configRes.data.data.types);
      setCriticalities(configRes.data.data.criticalities);
      setNotifications(notifRes.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      setError('Selecciona al menos un destinatario');
      return;
    }
    if (!form.title.trim() || !form.message.trim()) {
      setError('Título y mensaje son requeridos');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      if (selectedUsers.length === 1) {
        // Envío individual
        await api.post('/whatsapp-notifications/send', {
          receiverId: selectedUsers[0],
          ...form
        });
        setSuccess('Notificación enviada correctamente');
      } else {
        // Envío masivo
        const response = await api.post('/whatsapp-notifications/send-bulk', {
          receiverIds: selectedUsers,
          ...form
        });
        const data = response.data.data;
        setSuccess(`Enviadas: ${data.sent}/${data.total} | WhatsApp: ${data.whatsappSent}`);
      }

      // Limpiar formulario
      setForm({ ...form, title: '', message: '' });
      setSelectedUsers([]);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar notificación');
    } finally {
      setSending(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllWithPhone = () => {
    const usersWithPhone = users.filter(u => u.hasPhone).map(u => u.id);
    setSelectedUsers(usersWithPhone);
  };

  const filteredUsers = users.filter(u =>
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  const inputStyle = "w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
  const selectStyle = "w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7" />
            Enviar Notificaciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Envía notificaciones por WhatsApp a los usuarios del sistema
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Usuarios */}
        <div className="lg:col-span-1 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Destinatarios ({selectedUsers.length})
            </h3>
            <button
              onClick={selectAllWithPhone}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Seleccionar con celular
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => toggleUserSelection(user.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                  selectedUsers.includes(user.id)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedUsers.includes(user.id)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.roleName || 'Sin rol'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.hasPhone ? (
                      <Phone className="w-4 h-4 text-green-500" />
                    ) : (
                      <Phone className="w-4 h-4 text-gray-300" />
                    )}
                    {selectedUsers.includes(user.id) && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                </div>
                {user.phone && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-11">
                    {user.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Composición */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulario */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Componer Mensaje
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Tipo de Notificación
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={selectStyle}
                  >
                    {types.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Criticidad
                  </label>
                  <select
                    value={form.criticality}
                    onChange={(e) => setForm({ ...form, criticality: e.target.value })}
                    className={selectStyle}
                  >
                    {criticalities.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputStyle}
                  placeholder="Ej: Su entrega está lista"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Mensaje *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={inputStyle}
                  rows={4}
                  placeholder="Escriba el contenido del mensaje..."
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sendWhatsApp}
                    onChange={(e) => setForm({ ...form, sendWhatsApp: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    Enviar por WhatsApp
                  </span>
                </label>

                <button
                  onClick={handleSend}
                  disabled={sending || selectedUsers.length === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar ({selectedUsers.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Vista previa */}
          {(form.title || form.message) && (
            <div className="card bg-gray-900 text-white">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Vista Previa WhatsApp</h4>
              <div className="bg-[#075E54] rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                <div className="text-gray-200">
                  ━━━━━━━━━━━━━━━━━━━━━━{'\n'}
                  {types.find(t => t.value === form.type)?.icon || 'ℹ️'} *SIGAH - Notificación*{'\n'}
                  ━━━━━━━━━━━━━━━━━━━━━━{'\n\n'}
                  *{form.title || 'Título del mensaje'}*{'\n\n'}
                  {form.message || 'Contenido del mensaje...'}{'\n\n'}
                  ━━━━━━━━━━━━━━━━━━━━━━{'\n'}
                  {criticalities.find(c => c.value === form.criticality)?.icon || '🟢'} Criticidad: *{criticalities.find(c => c.value === form.criticality)?.label || 'Normal'}*{'\n'}
                  ━━━━━━━━━━━━━━━━━━━━━━
                </div>
              </div>
            </div>
          )}

          {/* Historial reciente */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Notificaciones Recientes
            </h3>

            {notifications.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No hay notificaciones enviadas
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 10).map((notif) => {
                  const TypeIcon = typeIcons[notif.type] || Bell;
                  return (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                        <TypeIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {notif.title}
                          </p>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${criticalityColors[notif.criticality]}`}>
                            {notif.criticality}
                          </span>
                          {notif.whatsappSent && (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Para: {notif.receiver.firstName} {notif.receiver.lastName} • 
                          {new Date(notif.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
