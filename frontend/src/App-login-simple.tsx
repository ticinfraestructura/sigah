import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function AppLoginSimple() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            {/* Ruta pública de login */}
            <Route path="/login" element={<Login />} />
            
            {/* Ruta protegida simple - redirige a login si no está autenticado */}
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            
            {/* Redirigir cualquier otra ruta al login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

// Componente simple de protección de rutas
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default AppLoginSimple;
