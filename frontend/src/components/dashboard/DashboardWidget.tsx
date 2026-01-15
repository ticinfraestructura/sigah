import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GripVertical, 
  X, 
  Settings, 
  Maximize2, 
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { clsx } from 'clsx';

export interface WidgetConfig {
  id: string;
  type: 'stats' | 'chart' | 'table' | 'alerts' | 'activity' | 'quick-actions' | 'custom';
  title: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  visible: boolean;
  config?: Record<string, unknown>;
}

interface DashboardWidgetProps {
  widget: WidgetConfig;
  children: ReactNode;
  onRemove?: (id: string) => void;
  onConfigure?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  isDragging?: boolean;
  isEditing?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function DashboardWidget({
  widget,
  children,
  onRemove,
  onConfigure,
  onToggleVisibility,
  isDragging = false,
  isEditing = false,
  dragHandleProps,
}: DashboardWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showControls, setShowControls] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: widget.visible ? 1 : 0.5, 
        scale: 1,
        zIndex: isDragging ? 50 : 1 
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700',
        'overflow-hidden transition-shadow',
        isDragging && 'shadow-2xl ring-2 ring-primary-500',
        isExpanded && 'fixed inset-4 z-50',
        !widget.visible && 'opacity-50'
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Widget Header */}
      <div className={clsx(
        'flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-800/50'
      )}>
        <div className="flex items-center gap-2">
          {isEditing && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {widget.title}
          </h3>
        </div>

        {/* Widget Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls || isEditing ? 1 : 0 }}
          className="flex items-center gap-1"
        >
          {onToggleVisibility && (
            <button
              onClick={() => onToggleVisibility(widget.id)}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={widget.visible ? 'Ocultar' : 'Mostrar'}
            >
              {widget.visible ? (
                <Eye className="w-4 h-4 text-gray-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {onConfigure && (
            <button
              onClick={() => onConfigure(widget.id)}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Configurar"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          )}

          {onRemove && isEditing && (
            <button
              onClick={() => onRemove(widget.id)}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              title="Eliminar"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          )}
        </motion.div>
      </div>

      {/* Widget Content */}
      <div className={clsx(
        'p-4',
        isExpanded && 'h-[calc(100%-60px)] overflow-auto'
      )}>
        {widget.visible ? children : (
          <div className="flex items-center justify-center h-20 text-gray-400">
            Widget oculto
          </div>
        )}
      </div>

      {/* Expanded overlay backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </motion.div>
  );
}

// Widget configuration panel
interface WidgetConfigPanelProps {
  widget: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
  onClose: () => void;
}

export function WidgetConfigPanel({ widget, onSave, onClose }: WidgetConfigPanelProps) {
  const [config, setConfig] = useState(widget);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Configurar Widget</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Visible</span>
            <button
              onClick={() => setConfig({ ...config, visible: !config.visible })}
              className={clsx(
                'w-12 h-6 rounded-full transition-colors',
                config.visible ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <div className={clsx(
                'w-5 h-5 bg-white rounded-full shadow transition-transform',
                config.visible ? 'translate-x-6' : 'translate-x-0.5'
              )} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardWidget;
