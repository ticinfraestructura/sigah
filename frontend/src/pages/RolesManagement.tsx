import { useState, useEffect } from 'react';
import { 
  Shield, Plus, Edit2, Trash2, Users, Check, X, 
  Save, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role, Permission } from '../types';
import api from '../services/api';

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

export default function RolesManagement() {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
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
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.data);
    } catch (err) {
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      alert('No se puede eliminar un rol del sistema');
      return;
    }
    if (role.userCount && role.userCount > 0) {
      alert(`No se puede eliminar el rol porque tiene ${role.userCount} usuario(s) asignado(s)`);
      return;
    }
    if (!confirm(`¿Está seguro de eliminar el rol "${role.name}"?`)) return;

    try {
      await api.delete(`/roles/${role.id}`);
      loadRoles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles y Permisos</h1>
          <p className="text-gray-500">Gestiona los roles del sistema y sus permisos</p>
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
          <div key={role.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  role.isSystem ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <Shield className={`w-5 h-5 ${role.isSystem ? 'text-primary-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  {role.isSystem && (
                    <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
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
            
            <p className="text-sm text-gray-500 mb-3">{role.description || 'Sin descripción'}</p>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <Users className="w-4 h-4" />
                <span>{role.userCount || 0} usuarios</span>
              </div>
              <span className="text-gray-400">
                {role.permissions.length} permisos
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edición */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
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
                  <label className="label">Nombre del Rol *</label>
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
                  <label className="label">Descripción</label>
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
                <label className="label mb-3">Permisos por Módulo</label>
                <div className="space-y-2">
                  {Object.entries(SYSTEM_MODULES).map(([moduleKey, moduleData]) => {
                    const { selected, total } = getModulePermissionCount(moduleKey);
                    const isExpanded = expandedModules.includes(moduleKey);
                    const allSelected = selected === total;
                    
                    return (
                      <div key={moduleKey} className="border rounded-lg overflow-hidden">
                        {/* Header del módulo */}
                        <div 
                          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
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
                            <span className="font-medium text-gray-900">{moduleData.name}</span>
                            <span className="text-xs text-gray-500">
                              ({selected}/{total})
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                        
                        {/* Acciones del módulo */}
                        {isExpanded && (
                          <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {moduleData.actions.map(action => (
                              <label 
                                key={action} 
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={hasPermission(moduleKey, action)}
                                  onChange={() => togglePermission(moduleKey, action)}
                                  className="rounded text-primary-600"
                                />
                                <span className="text-sm">{ACTION_LABELS[action] || action}</span>
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
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
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
    </div>
  );
}
