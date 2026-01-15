import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ProductDetail from './pages/ProductDetail';
import Kits from './pages/Kits';
import KitDetail from './pages/KitDetail';
import Beneficiaries from './pages/Beneficiaries';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import NewRequest from './pages/NewRequest';
import DeliveriesManagement from './pages/DeliveriesManagement';
import NewDelivery from './pages/NewDelivery';
import Returns from './pages/Returns';
import ReportsAdvanced from './pages/ReportsAdvanced';
import RolesManagement from './pages/RolesManagement';
import UsersManagement from './pages/UsersManagement';
import NotificationsManagement from './pages/NotificationsManagement';
import InventoryManagement from './pages/InventoryManagement';
import InventoryAudit from './pages/InventoryAudit';
import SendNotifications from './pages/SendNotifications';

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <SocketProvider>
                  <Layout>
                  <Routes>
                <Route path="/" element={
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
                  <ProtectedRoute module="roles" action="view">
                    <InventoryAudit />
                  </ProtectedRoute>
                } />
                <Route path="/send-notifications" element={
                  <ProtectedRoute module="users" action="view">
                    <SendNotifications />
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
                <Route path="/beneficiaries" element={
                  <ProtectedRoute module="beneficiaries">
                    <Beneficiaries />
                  </ProtectedRoute>
                } />
                <Route path="/requests" element={
                  <ProtectedRoute module="requests">
                    <Requests />
                  </ProtectedRoute>
                } />
                <Route path="/requests/new" element={
                  <ProtectedRoute module="requests" action="create">
                    <NewRequest />
                  </ProtectedRoute>
                } />
                <Route path="/requests/:id" element={
                  <ProtectedRoute module="requests">
                    <RequestDetail />
                  </ProtectedRoute>
                } />
                <Route path="/deliveries" element={
                  <ProtectedRoute module="deliveries">
                    <DeliveriesManagement />
                  </ProtectedRoute>
                } />
                <Route path="/deliveries/new/:requestId" element={
                  <ProtectedRoute module="deliveries" action="create">
                    <NewDelivery />
                  </ProtectedRoute>
                } />
                <Route path="/returns" element={
                  <ProtectedRoute module="returns">
                    <Returns />
                  </ProtectedRoute>
                } />
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
                <Route path="/notifications" element={
                  <ProtectedRoute module="users">
                    <NotificationsManagement />
                  </ProtectedRoute>
                } />
                  </Routes>
                </Layout>
              </SocketProvider>
            </PrivateRoute>
          }
        />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
