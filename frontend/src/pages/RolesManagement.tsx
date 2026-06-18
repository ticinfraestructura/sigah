import { useState, useEffect } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';
import { 
  Shield, Plus, Edit2, Trash2, Users, Check, X, 
  Save, ChevronDown, ChevronUp, AlertCircle, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role, Permission } from '../types';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';

// Módulos del sistema
const SYSTEM_MODULES = {
  dashboard: { name: 'Dashboard', actions: ['view'] },
  inventory: { name: 'Inventario', actions: ['view', 'create', 'edit', 'delete', 'export', 'adjust'] },
  kits: { name: 'Kits', actions: ['view', 'create', 'edit', 'delete'] },
  beneficiaries: { name: 'Beneficiarios', actions: ['view', 'create', 'edit', 'delete', 'export'] },
  requests: { name: 'Solicitudes', actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject'] },
  deliveries: { name: 'Entregas', actions: ['view', 'create', 'authorize', 'receive', 'prepare', 'deliver', 'cancel'] },
  returns: { name: 'Devoluciones', actions: ['view', 'create', 'process'] },
  reports: { name: 'Reportes', actions: ['view', 'export'] },
  users: { name: 'Usuarios', actions: ['view', 'create', 'edit', 'delete', 'activate'] },
  roles: { name: 'Roles', actions: ['view', 'create', 'edit', 'delete', 'assign'] },
  settings: { name: 'Configuración', actions: ['view', 'edit'] }
};

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  export: 'Exportar',
  adjust: 'Ajustar',
  approve: 'Aprobar',
  reject: 'Rechazar',
  authorize: 'Autorizar',
  receive: 'Recibir',
  prepare: 'Preparar',
  deliver: 'Entregar',
  cancel: 'Cancelar',
  process: 'Procesar',
  activate: 'Activar',
  assign: 'Asignar'
};

interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId?: string;
}

export default function RolesManagement() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [expandedRoleUsers, setExpandedRoleUsers] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        api.get('/roles'),
        api.get('/users')
      ]);
      setRoles(rolesRes.data.data);
      setAllUsers(usersRes.data.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        api.get('/roles'),
        api.get('/users')
      ]);
      setRoles(rolesRes.data.data);
      setAllUsers(usersRes.data.data);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  const getUsersForRole = (roleId: string): SystemUser[] =>
    allUsers.filter(u => u.roleId === roleId);

  const toggleRoleUsers = (roleId: string) =>
    setExpandedRoleUsers(prev => prev === roleId ? null : roleId);

  const handleNewRole = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setExpandedModules([]);
    setShowForm(true);
    setError('');
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions]
    });
    // Expandir módulos que tienen permisos
    const modules = [...new Set(role.permissions.map(p => p.module))];
    setExpandedModules(modules);
    setShowForm(true);
    setError('');
  };

  const [confirmRole, setConfirmRole] = useState<Role | null>(null);

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) {
      toast.warning('No se puede eliminar un rol del sistema');
      return;
    }
    if (role.userCount && role.userCount > 0) {
      toast.warning(`No se puede eliminar el rol porque tiene ${role.userCount} usuario(s) asignado(s)`);
      return;
    }
    setConfirmRole(role);
  };

  const handleConfirmDeleteRole = async () => {
    const role = confirmRole;
    setConfirmRole(null);
    if (!role) return;
    try {
      await api.delete(`/roles/${role.id}`);
      toast.success('Rol eliminado');
      loadRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const toggleModule = (module: string) => {
    setExpandedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const hasPermission = (module: string, action: string) => {
    return formData.permissions.some(p => p.module === module && p.action === action);
  };

  const togglePermission = (module: string, action: string) => {
    setFormData(prev => {
      const exists = prev.permissions.some(p => p.module === module && p.action === action);
      if (exists) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => !(p.module === module && p.action === action))
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, { module, action }]
        };
      }
    });
  };

  const toggleAllModulePermissions = (module: string) => {
    const moduleActions = SYSTEM_MODULES[module as keyof typeof SYSTEM_MODULES]?.actions || [];
    const allSelected = moduleActions.every(action => hasPermission(module, action));
    
    setFormData(prev => {
      // Remover todos los permisos del módulo
      let newPermissions = prev.permissions.filter(p => p.module !== module);
      
      // Si no todos estaban seleccionados, agregar todos
      if (!allSelected) {
        moduleActions.forEach(action => {
          newPermissions.push({ module, action });
        });
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, formData);
      } else {
        await api.post('/roles', formData);
      }
      setShowForm(false);
      loadRoles();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const getModulePermissionCount = (module: string) => {
    const total = SYSTEM_MODULES[module as keyof typeof SYSTEM_MODULES]?.actions.length || 0;
    const selected = formData.permissions.filter(p => p.module === module).length;
    return { selected, total };
  };

  if (!isAdmin()) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
        <p className="text-gray-500 dark:text-gray-400">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles y Permisos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona los roles del sistema y sus permisos</p>
        </div>
        <button onClick={handleNewRole} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Rol
        </button>
      </div>

      {/* Lista de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : roles.map(role => (
          <div key={role.id} className="card hover:shadow-md transition-shadow dark:bg-gray-800">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  role.isSystem ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Shield className={`w-5 h-5 ${role.isSystem ? 'text-primary-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  {role.isSystem && (
                    <span className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900 px-2 py-0.5 rounded">
                      Sistema
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEditRole(role)}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!role.isSystem && (
                  <button 
                    onClick={() => handleDeleteRole(role)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{role.description || 'Sin descripción'}</p>
            
            <div className="flex items-center justify-between text-sm mb-2">
              <button
                onClick={() => toggleRoleUsers(role.id)}
                className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Users className="w-4 h-4" />
                <span>{getUsersForRole(role.id).length} usuarios</span>
                {expandedRoleUsers === role.id
                  ? <ChevronUp className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />}
              </button>
              <span className="text-gray-400 dark:text-gray-500">
                {role.permissions.length} permisos
              </span>
            </div>

            {expandedRoleUsers === role.id && (
              <div className="mt-2 border dark:border-gray-600 rounded-lg overflow-hidden">
                {getUsersForRole(role.id).length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2 text-center">Sin usuarios asignados</p>
                ) : (
                  <div className="divide-y dark:divide-gray-600 max-h-40 overflow-y-auto">
                    {getUsersForRole(role.id).map(u => (
                      <div key={u.id} className="flex items-center gap-2 px-3 py-2">
                        <UserCheck className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          u.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Edición */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingRole ? `Editar Rol: ${editingRole.name}` : 'Nuevo Rol'}
              </h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {/* Datos básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label dark:text-gray-300">Nombre del Rol *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="Ej: Supervisor"
                    disabled={editingRole?.isSystem}
                  />
                </div>
                <div>
                  <label className="label dark:text-gray-300">Descripción</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    placeholder="Descripción del rol"
                  />
                </div>
              </div>

              {/* Permisos */}
              <div>
                <label className="label mb-3 dark:text-gray-300">Permisos por Módulo</label>
                <div className="space-y-2">
                  {Object.entries(SYSTEM_MODULES).map(([moduleKey, moduleData]) => {
                    const { selected, total } = getModulePermissionCount(moduleKey);
                    const isExpanded = expandedModules.includes(moduleKey);
                    const allSelected = selected === total;
                    
                    return (
                      <div key={moduleKey} className="border dark:border-gray-600 rounded-lg overflow-hidden">
                        {/* Header del módulo */}
                        <div 
                          className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => toggleModule(moduleKey)}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllModulePermissions(moduleKey);
                              }}
                              className={`w-5 h-5 rounded border flex items-center justify-center ${
                                allSelected 
                                  ? 'bg-primary-600 border-primary-600 text-white' 
                                  : selected > 0 
                                    ? 'bg-primary-100 border-primary-300' 
                                    : 'border-gray-300'
                              }`}
                            >
                              {allSelected && <Check className="w-3 h-3" />}
                              {!allSelected && selected > 0 && <div className="w-2 h-2 bg-primary-600 rounded-sm" />}
                            </button>
                            <span className="font-medium text-gray-900 dark:text-white">{moduleData.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({selected}/{total})
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 dark:text-gray-300" />}
                        </div>
                        
                        {/* Acciones del módulo */}
                        {isExpanded && (
                          <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2 bg-white dark:bg-gray-800">
                            {moduleData.actions.map(action => (
                              <label 
                                key={action} 
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={hasPermission(moduleKey, action)}
                                  onChange={() => togglePermission(moduleKey, action)}
                                  className="rounded text-primary-600"
                                />
                                <span className="text-sm dark:text-gray-300">{ACTION_LABELS[action] || action}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
              <button 
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                <X className="w-4 h-4 mr-2" /> Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmRole}
        title="Eliminar rol"
        message={`¿Está seguro de eliminar el rol "${confirmRole?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmDeleteRole}
        onCancel={() => setConfirmRole(null)}
      />
    </div>
  );
}
