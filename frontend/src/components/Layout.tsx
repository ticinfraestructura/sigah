import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { useToast } from './ui/Toast';
import ThemeToggle from './ThemeToggle';
// import NotificationCenter from './NotificationCenter';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  FileText,
  Truck,
  RotateCcw,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Heart,
  Shield,
  Bell,
  Settings,
  ClipboardList,
  MessageSquare,
  KeyRound
} from 'lucide-react';

// Navegación con permisos requeridos
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, module: 'dashboard', action: 'view' },
  { name: 'Inventario', href: '/inventory', icon: Package, module: 'inventory', action: 'view' },
  { name: 'Kits', href: '/kits', icon: Boxes, module: 'kits', action: 'view' },
  // { name: 'Beneficiarios', href: '/beneficiaries', icon: Users, module: 'beneficiaries', action: 'view' },
  // { name: 'Solicitudes', href: '/requests', icon: FileText, module: 'requests', action: 'view' },
  // { name: 'Entregas', href: '/deliveries', icon: Truck, module: 'deliveries', action: 'view' },
  // { name: 'Devoluciones', href: '/returns', icon: RotateCcw, module: 'returns', action: 'view' },
  { name: 'Reportes', href: '/reports', icon: BarChart3, module: 'reports', action: 'view' },
];

// Navegación de administración (solo admin)
const adminNavigation = [
  { name: 'Gestión Inventario', href: '/inventory-admin', icon: Settings, module: 'inventory', action: 'edit' },
  { name: 'Auditoría Inventario', href: '/inventory-audit', icon: ClipboardList, module: 'roles', action: 'view' },
  // { name: 'Enviar Notificaciones', href: '/send-notifications', icon: MessageSquare, module: 'users', action: 'view' },
  { name: 'Roles y Permisos', href: '/roles', icon: Shield, module: 'roles', action: 'view' },
  { name: 'Usuarios', href: '/users', icon: Users, module: 'users', action: 'view' },
  // { name: 'Config. Notificaciones', href: '/notifications', icon: Bell, module: 'users', action: 'view' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [cpForm, setCpForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Configurar idle timeout (30 minutos con advertencia a 5 minutos)
  useIdleTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    onWarning: () => {
      toast.warning('Tu sesión expirará en 5 minutos por inactividad. Mueve el mouse o presiona una tecla para mantenerla activa.');
    },
    onTimeout: () => {
      toast.error('Sesión expirada por inactividad. Por favor, inicia sesión nuevamente.');
      logout();
      navigate('/login');
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenChangePassword = () => {
    setUserMenuOpen(false);
    setCpForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setCpError('');
    setCpSuccess('');
    setShowChangePasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');
    if (cpForm.newPassword !== cpForm.confirmPassword) {
      setCpError('Las contraseñas no coinciden');
      return;
    }
    setCpLoading(true);
    try {
      await authApi.changePassword(cpForm.currentPassword, cpForm.newPassword, cpForm.confirmPassword);
      setCpSuccess('Contraseña actualizada correctamente');
      setTimeout(() => setShowChangePasswordModal(false), 1500);
    } catch (err: any) {
      setCpError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setCpLoading(false);
    }
  };

  // Filtrar navegación según permisos
  const filteredNavigation = navigation.filter(item => 
    hasPermission(item.module, item.action)
  );

  const filteredAdminNavigation = adminNavigation.filter(item => 
    hasPermission(item.module, item.action)
  );

  // Si no hay navegación disponible, mostrar mensaje
  const hasNoAccess = filteredNavigation.length === 0 && filteredAdminNavigation.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">SIGAH</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {hasNoAccess && (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Sin acceso</p>
              <p className="text-xs">No tienes permisos asignados. Contacta al administrador.</p>
            </div>
          )}
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-l-4 ${
                  isActive
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
          
          {/* Sección de Administración */}
          {filteredAdminNavigation.length > 0 && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Administración
                </p>
              </div>
              {filteredAdminNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-l-4 ${
                      isActive
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="h-full px-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {/* Notifications - oculto en esta version */}

            {/* Theme Toggle */}
            <ThemeToggle className="mx-4" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.roleName}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleOpenChangePassword}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <KeyRound className="w-4 h-4" />
                      Cambiar contraseña
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 border-t border-gray-100 dark:border-gray-800">
          SIGAH v1.0.0 · Sistema de Gestión de Ayudas Humanitarias
        </footer>
      </div>

      {/* Modal Cambio de Contraseña */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary-600" />
                Cambiar mi contraseña
              </h2>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-4 space-y-4">
              {cpError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg">{cpError}</div>
              )}
              {cpSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg">{cpSuccess}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña actual</label>
                <input
                  type="password"
                  value={cpForm.currentPassword}
                  onChange={(e) => setCpForm({ ...cpForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={cpForm.newPassword}
                  onChange={(e) => setCpForm({ ...cpForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min. 8 caracteres, mayúscula, número y carácter especial</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={cpForm.confirmPassword}
                  onChange={(e) => setCpForm({ ...cpForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cpLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {cpLoading ? 'Guardando...' : 'Actualizar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
