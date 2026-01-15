/**
 * Componente Toggle de Tema
 * 
 * Botón para cambiar entre modo claro/oscuro
 */

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, className = '' }) => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-5 h-5" />;
    }
    return actualTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />;
  };

  const getLabel = () => {
    switch (theme) {
      case 'light': return 'Modo Claro';
      case 'dark': return 'Modo Oscuro';
      case 'system': return 'Sistema';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title={getLabel()}
      >
        {getIcon()}
      </button>
      
      {showLabel && (
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:text-white"
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
          <option value="system">Sistema</option>
        </select>
      )}
    </div>
  );
};

export default ThemeToggle;
