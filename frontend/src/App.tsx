import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ProductDetail from './pages/ProductDetail';
import Kits from './pages/Kits';
import KitDetail from './pages/KitDetail';
import ReportsAdvanced from './pages/ReportsAdvanced';
import RolesManagement from './pages/RolesManagement';
import UsersManagement from './pages/UsersManagement';
import InventoryManagement from './pages/InventoryManagement';
import InventoryAudit from './pages/InventoryAudit';
import BackupManagement from './pages/BackupManagement';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Routes>
                    <Route path="/" element={
                      <ProtectedRoute module="dashboard">
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute module="dashboard">
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/inventory" element={
                      <ProtectedRoute module="inventory">
                        <Inventory />
                      </ProtectedRoute>
                    } />
                    <Route path="/inventory/:id" element={
                      <ProtectedRoute module="inventory">
                        <ProductDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/inventory-admin" element={
                      <ProtectedRoute module="inventory" action="edit">
                        <InventoryManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/inventory-audit" element={
                      <ProtectedRoute module="audit" action="view">
                        <InventoryAudit />
                      </ProtectedRoute>
                    } />
                    <Route path="/kits" element={
                      <ProtectedRoute module="kits">
                        <Kits />
                      </ProtectedRoute>
                    } />
                    <Route path="/kits/:id" element={
                      <ProtectedRoute module="kits">
                        <KitDetail />
                      </ProtectedRoute>
                    } />
                    {/* Módulos deshabilitados temporalmente:
                      /beneficiaries, /requests, /requests/new, /requests/:id,
                      /deliveries, /deliveries/new/:requestId, /returns
                    */}
                    <Route path="/reports" element={
                      <ProtectedRoute module="reports">
                        <ReportsAdvanced />
                      </ProtectedRoute>
                    } />
                    <Route path="/roles" element={
                      <ProtectedRoute module="roles">
                        <RolesManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/users" element={
                      <ProtectedRoute module="users">
                        <UsersManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/backups" element={
                      <ProtectedRoute module="roles" action="view" fallback="redirect">
                        <BackupManagement />
                      </ProtectedRoute>
                    } />
                      </Routes>
                    </Layout>
                </PrivateRoute>
              }
            />
            </Routes>
          </div>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
