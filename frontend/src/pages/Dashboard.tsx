import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Users,
  FileText,
  Truck,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Bell,
  UserCheck,
  Inbox,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { dashboardApi } from '../services/api';
import { DashboardSummary } from '../types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const statusLabels: Record<string, string> = {
  REGISTERED: 'Registradas',
  IN_REVIEW: 'En Revisión',
  APPROVED: 'Aprobadas',
  REJECTED: 'Rechazadas',
  DELIVERED: 'Entregadas',
  PARTIALLY_DELIVERED: 'Parciales',
  CANCELLED: 'Canceladas'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const userRole = user?.roleName;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, chartsRes] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getCharts(6)
        ]);
        setSummary(summaryRes.data.data);
        setCharts(chartsRes.data.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const kpis = summary?.kpis;
  const statusData = summary ? Object.entries(summary.requestsByStatus)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: statusLabels[key] || key,
      value
    })) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Resumen general del sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.totalProducts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Stock total: <span className="font-medium text-gray-700 dark:text-gray-300">{kpis?.totalStock?.toLocaleString() || 0}</span>
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Beneficiarios</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.totalBeneficiaries || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Registrados en el sistema
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Solicitudes Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.pendingRequests || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Total: <span className="font-medium text-gray-700 dark:text-gray-300">{kpis?.totalRequests || 0}</span>
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Entregas del Mes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.deliveriesThisMonth || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Este mes
          </p>
        </div>
      </div>

      {/* Alerts */}
      {(kpis?.expiringProducts || 0) > 0 || (kpis?.lowStockProducts || 0) > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(kpis?.expiringProducts || 0) > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-orange-800">
                  {kpis?.expiringProducts} productos próximos a vencer
                </p>
                <p className="text-sm text-orange-600">En los próximos 30 días</p>
              </div>
              <Link to="/inventory?filter=expiring" className="text-sm font-medium text-orange-700 hover:underline">
                Ver detalles
              </Link>
            </div>
          )}

          {(kpis?.lowStockProducts || 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-800">
                  {kpis?.lowStockProducts} productos con stock bajo
                </p>
                <p className="text-sm text-red-600">Por debajo del mínimo</p>
              </div>
              <Link to="/inventory?filter=lowStock" className="text-sm font-medium text-red-700 hover:underline">
                Ver detalles
              </Link>
            </div>
          )}
        </div>
      ) : null}

      {/* Pending Delivery Tasks */}
      {summary?.pendingTasks && (
        (summary.pendingTasks.forAuthorizer > 0 || 
         summary.pendingTasks.forWarehouse > 0 || 
         summary.pendingTasks.forDispatcher > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Tareas Pendientes de Entregas</h3>
            </div>
            <Link to="/deliveries" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Para Autorizador */}
            <div className={`p-4 rounded-lg border-2 ${
              (userRole === 'Administrador' || userRole === 'Autorizador') 
                ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' 
                : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{summary.pendingTasks.forAuthorizer}</p>
                  <p className="text-xs text-yellow-600">Por Autorizar</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Responsable: <span className="font-medium">Autorizador</span>
              </p>
            </div>

            {/* Para Bodeguero */}
            <div className={`p-4 rounded-lg border-2 ${
              (userRole === 'Administrador' || userRole === 'Bodeguero') 
                ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' 
                : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{summary.pendingTasks.forWarehouse}</p>
                  <p className="text-xs text-indigo-600">Por Preparar</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Responsable: <span className="font-medium">Bodeguero</span>
              </p>
            </div>

            {/* Para Despachador */}
            <div className={`p-4 rounded-lg border-2 ${
              (userRole === 'Administrador' || userRole === 'Despachador') 
                ? 'border-cyan-300 bg-cyan-50 dark:bg-cyan-900/20' 
                : 'border-gray-200 bg-gray-50 dark:bg-gray-700/50'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-cyan-700">{summary.pendingTasks.forDispatcher}</p>
                  <p className="text-xs text-cyan-600">Listas para Entregar</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Responsable: <span className="font-medium">Despachador</span>
              </p>
            </div>
          </div>

          {/* Detalle de entregas listas (para Admin y Despachador) */}
          {summary.pendingTasks.forDispatcher > 0 && 
           (userRole === 'Administrador' || userRole === 'Despachador') && (
            <div className="border-t dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600" />
                Entregas listas para despacho:
              </p>
              <div className="space-y-2">
                {summary.pendingTasks.details?.dispatcher?.map((delivery: any) => (
                  <div key={delivery.id} className="flex items-center justify-between p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-cyan-700">{delivery.code}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {delivery.request?.beneficiary?.firstName} {delivery.request?.beneficiary?.lastName}
                      </span>
                    </div>
                    <Link 
                      to="/deliveries?status=READY" 
                      className="text-xs text-cyan-600 hover:underline"
                    >
                      Gestionar
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movements by month */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Movimientos de Inventario</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.movementsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="entries" name="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exits" name="Salidas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Requests by status */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Solicitudes por Estado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deliveries trend */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Entregas por Mes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.deliveriesByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="deliveries" 
                  name="Entregas"
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock by category */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Stock por Categoría</h3>
          <div className="space-y-3">
            {summary?.stockByCategory.map((category, index) => (
              <div key={category.id} className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{category.totalStock.toLocaleString()} unidades</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${Math.min((category.totalStock / (summary?.kpis.totalStock || 1)) * 100, 100)}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/requests/new"
            className="p-4 bg-primary-50 hover:bg-primary-100 rounded-xl text-center transition-colors"
          >
            <FileText className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-primary-700">Nueva Solicitud</span>
          </Link>
          <Link
            to="/inventory"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-center transition-colors"
          >
            <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-700">Ver Inventario</span>
          </Link>
          <Link
            to="/deliveries"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors"
          >
            <Truck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-700">Entregas</span>
          </Link>
          <Link
            to="/reports"
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl text-center transition-colors"
          >
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-orange-700">Reportes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
