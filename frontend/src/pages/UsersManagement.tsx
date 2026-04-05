import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserCheck, 
  UserX,
  Key,
  X,
  AlertCircle,
  CheckCircle,
  Phone,
  MessageCircle,
  HelpCircle,
  Send
} from 'lucide-react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  whatsappApiKey: string | null;
  telegramChatId: string | null;
  isActive: boolean;
  roleId: string | null;
  roleName: string | null;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedTelegramUser, setSelectedTelegramUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    whatsappApiKey: '',
    telegramChatId: '',
    roleId: ''
  });
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [telegramChatIdInput, setTelegramChatIdInput] = useState('');
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramError, setTelegramError] = useState('');
  const [telegramSuccess, setTelegramSuccess] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          whatsappApiKey: formData.whatsappApiKey || null,
          telegramChatId: formData.telegramChatId || null,
          roleId: formData.roleId || null,
          ...(formData.password && { password: formData.password })
        });
        setSuccess('Usuario actualizado correctamente');
      } else {
        await api.post('/users', formData);
        setSuccess('Usuario creado correctamente');
      }
      
      fetchUsers();
      setTimeout(() => {
        setShowModal(false);
        resetForm();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    try {
      await api.delete(`/users/${id}`);
      setSuccess('Usuario eliminado correctamente');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar usuario');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}/toggle-active`);
      setSuccess(user.isActive ? 'Usuario desactivado' : 'Usuario activado');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar estado');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newPassword) return;

    try {
      await api.post(`/users/${selectedUserId}/reset-password`, { newPassword });
      setSuccess('Contraseña actualizada correctamente');
      setTimeout(() => {
        setShowPasswordModal(false);
        setSelectedUserId(null);
        setNewPassword('');
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      whatsappApiKey: user.whatsappApiKey || '',
      telegramChatId: user.telegramChatId || '',
      roleId: user.roleId || ''
    });
    setShowModal(true);
  };

  const openPasswordModal = (userId: string) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const openTelegramModal = (user: User) => {
    setSelectedTelegramUser(user);
    setTelegramChatIdInput(user.telegramChatId || '');
    setTelegramError('');
    setTelegramSuccess('');
    setShowTelegramModal(true);
  };

  const closeTelegramModal = () => {
    setShowTelegramModal(false);
    setSelectedTelegramUser(null);
    setTelegramChatIdInput('');
    setTelegramError('');
    setTelegramSuccess('');
  };

  const handleSaveTelegramChatId = async () => {
    if (!selectedTelegramUser) return;

    setTelegramError('');
    setTelegramSuccess('');
    setTelegramSaving(true);

    try {
      const normalizedChatId = telegramChatIdInput.trim();
      await api.put(`/users/${selectedTelegramUser.id}`, {
        telegramChatId: normalizedChatId || null
      });

      setSelectedTelegramUser({
        ...selectedTelegramUser,
        telegramChatId: normalizedChatId || null
      });

      setTelegramSuccess('Chat ID de Telegram guardado correctamente');
      await fetchUsers();
    } catch (err: any) {
      setTelegramError(err.response?.data?.error || 'Error al guardar Chat ID de Telegram');
    } finally {
      setTelegramSaving(false);
    }
  };

  const handleSendTelegramTest = async () => {
    const normalizedChatId = telegramChatIdInput.trim();

    if (!normalizedChatId) {
      setTelegramError('Debes ingresar un Chat ID antes de enviar la prueba');
      setTelegramSuccess('');
      return;
    }

    setTelegramError('');
    setTelegramSuccess('');
    setTelegramTesting(true);

    try {
      const response = await api.post('/whatsapp-notifications/telegram/test', {
        chatId: normalizedChatId
      });

      const modeNote = response.data?.data?.simulated
        ? ' (modo simulado: revisa TELEGRAM_BOT_TOKEN)'
        : '';

      setTelegramSuccess(`Prueba enviada correctamente${modeNote}`);
    } catch (err: any) {
      setTelegramError(err.response?.data?.error || 'Error enviando prueba de Telegram');
    } finally {
      setTelegramTesting(false);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      whatsappApiKey: '',
      telegramChatId: '',
      roleId: ''
    });
    setError('');
    setShowApiKeyHelp(false);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Users className="w-7 h-7" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
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

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm">{user.email}</p>
                      {user.phone && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </p>
                      )}
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <span className="text-blue-500">✈️</span>
                        {user.telegramChatId ? 'Telegram configurado' : 'Sin Telegram'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {user.roleName || 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openPasswordModal(user.id)}
                        className="p-2 text-gray-600 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Cambiar contraseña"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                          user.isActive 
                            ? 'text-gray-600 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400'
                            : 'text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'
                        }`}
                        title={user.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openTelegramModal(user)}
                        className="p-2 text-gray-600 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Configurar Telegram"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Apellido</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1">
                    <Phone className="w-4 h-4 text-green-500" />
                    Celular (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+573001234567"
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1">
                    <span className="text-blue-500">✈️</span>
                    Telegram Chat ID
                  </label>
                  <input
                    type="text"
                    value={formData.telegramChatId}
                    onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                    className="input"
                    placeholder="123456789"
                  />
                </div>
              </div>

              {/* WhatsApp API Key para CallMeBot */}
              <div>
                <label className="label flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  WhatsApp API Key (CallMeBot)
                  <button
                    type="button"
                    onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
                    className="ml-1 text-gray-400 hover:text-primary-500"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </label>
                <input
                  type="text"
                  value={formData.whatsappApiKey}
                  onChange={(e) => setFormData({ ...formData, whatsappApiKey: e.target.value })}
                  className="input"
                  placeholder="123456"
                />
                {showApiKeyHelp && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">📱 ¿Cómo obtener tu API Key?</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                      <li>Ve a: <a href="https://textmebot.com/whatsapp" target="_blank" rel="noopener noreferrer" className="underline font-medium">textmebot.com/whatsapp</a></li>
                      <li>Ingresa tu número de WhatsApp</li>
                      <li>Sigue las instrucciones para activar</li>
                      <li>Copia el API Key que te dan y pégalo aquí</li>
                    </ol>
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-500">
                      ⚡ Servicio gratuito - Solo se requiere una vez por número
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="label">
                  Contraseña {editingUser && '(dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  {...(!editingUser && { required: true, minLength: 6 })}
                  placeholder={editingUser ? '••••••••' : ''}
                />
              </div>

              <div>
                <label className="label">Rol</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="input"
                >
                  <option value="">Sin rol asignado</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cambiar Contraseña
              </h2>
              <button
                onClick={() => { setShowPasswordModal(false); setNewPassword(''); setError(''); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg">
                  {success}
                </div>
              )}

              <div>
                <label className="label">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setNewPassword(''); setError(''); }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTelegramModal && selectedTelegramUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Telegram
              </h2>
              <button
                onClick={closeTelegramModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 text-sm">
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  Usuario: {selectedTelegramUser.firstName} {selectedTelegramUser.lastName}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">{selectedTelegramUser.email}</p>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-medium">Pasos rápidos:</p>
                <p>1. El usuario debe abrir el bot y enviar /start.</p>
                <p>2. Obtén el chat_id desde getUpdates del bot.</p>
                <p>3. Pega el chat_id aquí, guarda y envía prueba.</p>
              </div>

              {telegramError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg">
                  {telegramError}
                </div>
              )}

              {telegramSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg">
                  {telegramSuccess}
                </div>
              )}

              <div>
                <label className="label flex items-center gap-1">
                  <span className="text-blue-500">✈️</span>
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatIdInput}
                  onChange={(e) => setTelegramChatIdInput(e.target.value)}
                  className="input"
                  placeholder="Ej: 5881420302"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTelegramModal}
                  className="btn-secondary"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTelegramChatId}
                  disabled={telegramSaving}
                  className="btn-secondary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {telegramSaving ? 'Guardando...' : 'Guardar Chat ID'}
                </button>
                <button
                  type="button"
                  onClick={handleSendTelegramTest}
                  disabled={telegramTesting}
                  className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {telegramTesting ? 'Enviando prueba...' : 'Enviar Prueba Telegram'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
