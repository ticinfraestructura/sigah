import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (permissions: { module: string; action: string }[]) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Verificar si hay sesión activa al cargar
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
        setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { token: newToken, user: userData } = response.data.data;
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = useCallback((module: string, action: string): boolean => {
    if (!user) return false;
    if (user.roleName === 'Administrador') return true;
    return user.permissions?.some(p => p.module === module && p.action === action) || false;
  }, [user]);

  // Verificar si tiene cualquiera de los permisos
  const hasAnyPermission = useCallback((permissions: { module: string; action: string }[]): boolean => {
    if (!user) return false;
    if (user.roleName === 'Administrador') return true;
    return permissions.some(req => 
      user.permissions?.some(p => p.module === req.module && p.action === req.action)
    );
  }, [user]);

  // Verificar si es administrador
  const isAdmin = useCallback((): boolean => {
    return user?.roleName === 'Administrador';
  }, [user]);

  // Memoizar el valor del contexto para evitar re-renders
  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    isAdmin,
  }), [user, token, loading, login, logout, hasPermission, hasAnyPermission, isAdmin]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
