import { useState, useEffect } from 'react';
import { 
  Send, MessageSquare, Users, Phone, Check, AlertCircle,
  Bell, Info, Truck, FileText, Settings, Clock, CheckCircle,
  Search, RefreshCw, Copy
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
  whatsappError?: string | null;
  createdAt: string;
  receiver: { firstName: string; lastName: string; phone: string | null };
  sender: { firstName: string; lastName: string };
}

interface WhatsAppStatus {
  officialApiConfigured: boolean;
  officialApiReady: boolean;
  officialApiReason?: string;
  mode: 'real' | 'simulated';
  runtimeMode?: 'auto' | 'simulated' | 'real';
}

interface TelegramStatus {
  botConfigured: boolean;
  mode: 'real' | 'simulated';
  reason?: string;
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
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
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
      const [usersRes, configRes, notifRes, statusRes] = await Promise.all([
        api.get('/whatsapp-notifications/users'),
        api.get('/whatsapp-notifications/config'),
        api.get('/whatsapp-notifications', { params: { limit: 20 } }),
        api.get('/whatsapp-notifications/status')
      ]);
      setUsers(usersRes.data.data);
      setTypes(configRes.data.data.types);
      setCriticalities(configRes.data.data.criticalities);
      setNotifications(notifRes.data.data);
      setWhatsAppStatus(statusRes.data.data.whatsapp);
      setTelegramStatus(statusRes.data.data.telegram || configRes.data.data.telegramStatus || null);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = async () => {
    if (!whatsAppStatus || changingMode) return;

    const nextMode = whatsAppStatus.mode === 'real' ? 'simulated' : 'real';

    try {
      setChangingMode(true);
      setError('');
      const response = await api.post('/whatsapp-notifications/mode', { mode: nextMode });
      const result = response.data?.data;

      setWhatsAppStatus(prev => prev
        ? {
            ...prev,
            mode: result?.mode || prev.mode,
            runtimeMode: result?.runtimeMode || prev.runtimeMode,
            officialApiReady: result?.officialApiReady ?? prev.officialApiReady,
            officialApiReason: result?.officialApiReason ?? prev.officialApiReason
          }
        : prev
      );

      setSuccess(response.data?.message || `Modo actualizado a ${nextMode}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo cambiar el modo de WhatsApp');
    } finally {
      setChangingMode(false);
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
        const response = await api.post('/whatsapp-notifications/send', {
          receiverId: selectedUsers[0],
          ...form
        });

        const waStatus = response.data?.data?.whatsapp;
        const tgStatus = response.data?.data?.telegram;
        const traceCode = response.data?.data?.notification?.code;

        if (waStatus?.sent) {
          setSuccess(`Notificación enviada por WhatsApp correctamente. Código: ${traceCode}`);
        } else if (tgStatus?.sent) {
          setSuccess(`Notificación enviada por Telegram (fallback). Código: ${traceCode}`);
        } else if (form.sendWhatsApp) {
          const modeLabel = waStatus?.simulated ? 'simulado' : 'interno';
          setSuccess(`Notificación registrada (Código: ${traceCode}). WhatsApp no enviado (${modeLabel}/${waStatus?.provider || 'N/A'}): ${waStatus?.error || 'Sin detalle'}`);
        } else {
          setSuccess(`Notificación interna registrada. Código: ${traceCode}`);
        }
      } else {
        // Envío masivo
        const response = await api.post('/whatsapp-notifications/send-bulk', {
          receiverIds: selectedUsers,
          ...form
        });
        const data = response.data.data;
        const failed = data.total - data.sent;
        const telegramSent = data.results?.filter((r: any) => r.telegramSent).length || 0;
        const fallbackUsed = data.results?.filter((r: any) => r.fallbackUsed).length || 0;
        const firstError = data.results?.find((r: any) => r.error)?.error;

        setSuccess(
          `Procesadas: ${data.sent}/${data.total} | WhatsApp real: ${data.whatsappSent} | Telegram fallback: ${telegramSent}${fallbackUsed ? ` (intentado en ${fallbackUsed})` : ''}`
        );

        if (failed > 0) {
          setError(`Algunas notificaciones no pudieron enviarse por WhatsApp. Revisa trazabilidad en historial. ${firstError ? `Detalle: ${firstError}` : ''}`);
        }
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

  const copyTraceCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setSuccess(`Código copiado: ${code}`);
      setTimeout(() => setSuccess(''), 2500);
    } catch {
      setError('No se pudo copiar el código de trazabilidad');
      setTimeout(() => setError(''), 2500);
    }
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

      {telegramStatus && (
        <div className={`p-4 border rounded-lg flex items-start gap-3 ${
          telegramStatus.mode === 'real'
            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        }`}>
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-semibold">
              Telegram {telegramStatus.mode === 'real' ? 'operativo' : 'en modo simulado'}
            </p>
            <p className="text-sm mt-1">
              {telegramStatus.mode === 'real'
                ? 'Fallback sin costo disponible si WhatsApp no se envía en modo real.'
                : (telegramStatus.reason || 'Configure TELEGRAM_BOT_TOKEN para habilitar fallback real.')}
            </p>
          </div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {whatsAppStatus && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Modo WhatsApp: {whatsAppStatus.mode === 'real' ? 'Real' : 'Simulado'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              Runtime: {whatsAppStatus.runtimeMode || 'auto'}
              {whatsAppStatus.mode !== 'real' && whatsAppStatus.officialApiReason ? ` · ${whatsAppStatus.officialApiReason}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleMode}
            disabled={changingMode}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
              whatsAppStatus.mode === 'real' ? 'bg-green-600' : 'bg-amber-500'
            } ${changingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
            title="Alternar modo WhatsApp"
          >
            <span className="sr-only">Alternar modo WhatsApp</span>
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                whatsAppStatus.mode === 'real' ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {whatsAppStatus?.mode === 'simulated' && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3 text-yellow-800 dark:text-yellow-300">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-semibold">WhatsApp en modo simulado</p>
            <p className="text-sm mt-1">
              Los mensajes no se están enviando de forma real. {whatsAppStatus.officialApiReason || 'Configure proveedor real para operación productiva.'}
            </p>
          </div>
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

                {selectedUsers.length === 0 && (
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    Selecciona al menos un destinatario
                  </span>
                )}

                <button
                  onClick={handleSend}
                  disabled={sending}
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
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Código: {notif.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyTraceCode(notif.code)}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copiar
                          </button>
                        </div>
                        {!notif.whatsappSent && notif.whatsappError && (
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            WhatsApp: {notif.whatsappError}
                          </p>
                        )}
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
