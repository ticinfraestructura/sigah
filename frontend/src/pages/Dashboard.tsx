import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Boxes,
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Kits Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.totalKits || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Boxes className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Kits configurados
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.totalUsers || 0}</p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Bajo Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.lowStockProducts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Productos bajo mínimo
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

        {/* Solicitudes por Estado y Entregas por Mes - oculto en esta version */}

        {/* Stock by category */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Stock por Categoría</h3>
          <div className="space-y-3">
            {summary?.stockByCategory?.map((category, index) => (
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            to="/inventory"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-center transition-colors"
          >
            <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-700">Ver Inventario</span>
          </Link>
          <Link
            to="/kits"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors"
          >
            <Boxes className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-700">Ver Kits</span>
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
