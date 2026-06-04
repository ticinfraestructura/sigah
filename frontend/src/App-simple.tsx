import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/Layout';
import InventoryDebug from './pages/InventoryDebug';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Kits from './pages/Kits';
import Beneficiaries from './pages/Beneficiaries';
import Requests from './pages/Requests';
import DeliveriesManagement from './pages/DeliveriesManagement';
import ReportsAdvanced from './pages/ReportsAdvanced';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<InventoryDebug />} />
            <Route path="/inventory" element={<InventoryDebug />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kits" element={<Kits />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/deliveries" element={<DeliveriesManagement />} />
            <Route path="/reports" element={<ReportsAdvanced />} />
            <Route path="*" element={<InventoryDebug />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
