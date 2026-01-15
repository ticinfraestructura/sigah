import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Heart, AlertCircle, Sun, Moon } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-gray-900 dark:to-gray-800">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 transition-colors"
        title={actualTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {actualTheme === 'dark' ? (
          <Sun className="w-5 h-5 text-yellow-300" />
        ) : (
          <Moon className="w-5 h-5 text-white" />
        )}
      </button>

      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-2xl p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-primary-100 dark:bg-primary-900/30">
              <Heart className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SIGAH</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Sistema de Gestión de Ayudas Humanitarias</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="correo@ejemplo.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Ingrese su contraseña"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-200 text-white ${
                loading 
                  ? 'bg-primary-300 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700 cursor-pointer'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p className="text-xs font-medium mb-2 text-gray-500 dark:text-gray-400">Credenciales de prueba (contraseña: admin123):</p>
            <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
              <p><strong>Administrador:</strong> admin@sigah.com</p>
              <p><strong>Autorizador:</strong> autorizador@sigah.com</p>
              <p><strong>Bodega:</strong> bodega@sigah.com</p>
              <p><strong>Despachador:</strong> despachador@sigah.com</p>
              <p><strong>Operador:</strong> operador@sigah.com</p>
              <p><strong>Consulta:</strong> consulta@sigah.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
