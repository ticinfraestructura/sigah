import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
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
  MessageSquare
} from 'lucide-react';

// Navegación con permisos requeridos
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, module: 'dashboard', action: 'view' },
  { name: 'Inventario', href: '/inventory', icon: Package, module: 'inventory', action: 'view' },
  { name: 'Kits', href: '/kits', icon: Boxes, module: 'kits', action: 'view' },
  { name: 'Beneficiarios', href: '/beneficiaries', icon: Users, module: 'beneficiaries', action: 'view' },
  { name: 'Solicitudes', href: '/requests', icon: FileText, module: 'requests', action: 'view' },
  { name: 'Entregas', href: '/deliveries', icon: Truck, module: 'deliveries', action: 'view' },
  { name: 'Devoluciones', href: '/returns', icon: RotateCcw, module: 'returns', action: 'view' },
  { name: 'Reportes', href: '/reports', icon: BarChart3, module: 'reports', action: 'view' },
];

// Navegación de administración (solo admin)
const adminNavigation = [
  { name: 'Gestión Inventario', href: '/inventory-admin', icon: Settings, module: 'inventory', action: 'edit' },
  { name: 'Auditoría Inventario', href: '/inventory-audit', icon: ClipboardList, module: 'roles', action: 'view' },
  { name: 'Enviar Notificaciones', href: '/send-notifications', icon: MessageSquare, module: 'users', action: 'view' },
  { name: 'Roles y Permisos', href: '/roles', icon: Shield, module: 'roles', action: 'view' },
  { name: 'Usuarios', href: '/users', icon: Users, module: 'users', action: 'view' },
  { name: 'Config. Notificaciones', href: '/notifications', icon: Bell, module: 'users', action: 'view' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
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

            {/* Notifications */}
            <NotificationCenter />

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
      </div>
    </div>
  );
}
