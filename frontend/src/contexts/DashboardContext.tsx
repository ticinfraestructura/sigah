import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getDashboardWidgets, 
  saveDashboardWidget, 
  deleteDashboardWidget,
  getDefaultDashboardWidgets,
  DashboardWidget 
} from '../services/offlineDb';
import { useAuth } from '../context/AuthContext';

interface DashboardContextType {
  widgets: DashboardWidget[];
  isEditing: boolean;
  isLoading: boolean;
  setIsEditing: (editing: boolean) => void;
  addWidget: (type: DashboardWidget['type']) => void;
  removeWidget: (id: string) => void;
  updateWidget: (widget: DashboardWidget) => void;
  toggleWidgetVisibility: (id: string) => void;
  reorderWidgets: (activeId: string, overId: string) => void;
  resetToDefault: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load widgets on mount
  useEffect(() => {
    async function loadWidgets() {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        let savedWidgets = await getDashboardWidgets(user.id);
        
        if (savedWidgets.length === 0) {
          // Initialize with default widgets
          savedWidgets = await getDefaultDashboardWidgets(user.id);
          for (const widget of savedWidgets) {
            await saveDashboardWidget(widget);
          }
        }
        
        setWidgets(savedWidgets);
      } catch (error) {
        console.error('Failed to load dashboard widgets:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWidgets();
  }, [user?.id]);

  // Save widgets when they change
  useEffect(() => {
    async function saveWidgets() {
      for (const widget of widgets) {
        await saveDashboardWidget(widget);
      }
    }

    if (widgets.length > 0 && !isLoading) {
      saveWidgets();
    }
  }, [widgets, isLoading]);

  const addWidget = (type: DashboardWidget['type']) => {
    if (!user?.id) return;

    const newWidget: DashboardWidget = {
      id: `${user.id}_${type}_${Date.now()}`,
      userId: user.id,
      type,
      position: { x: 0, y: widgets.length },
      size: { w: 2, h: 1 },
      config: {},
      visible: true,
    };

    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = async (id: string) => {
    await deleteDashboardWidget(id);
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const updateWidget = (updatedWidget: DashboardWidget) => {
    setWidgets(widgets.map(w => 
      w.id === updatedWidget.id ? updatedWidget : w
    ));
  };

  const toggleWidgetVisibility = (id: string) => {
    setWidgets(widgets.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    ));
  };

  const reorderWidgets = (activeId: string, overId: string) => {
    const activeIndex = widgets.findIndex(w => w.id === activeId);
    const overIndex = widgets.findIndex(w => w.id === overId);
    
    if (activeIndex === -1 || overIndex === -1) return;

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(activeIndex, 1);
    newWidgets.splice(overIndex, 0, removed);

    // Update positions
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      position: { ...widget.position, y: index },
    }));

    setWidgets(updatedWidgets);
  };

  const resetToDefault = async () => {
    if (!user?.id) return;

    // Delete all current widgets
    for (const widget of widgets) {
      await deleteDashboardWidget(widget.id);
    }

    // Create default widgets
    const defaultWidgets = await getDefaultDashboardWidgets(user.id);
    for (const widget of defaultWidgets) {
      await saveDashboardWidget(widget);
    }

    setWidgets(defaultWidgets);
  };

  return (
    <DashboardContext.Provider value={{
      widgets,
      isEditing,
      isLoading,
      setIsEditing,
      addWidget,
      removeWidget,
      updateWidget,
      toggleWidgetVisibility,
      reorderWidgets,
      resetToDefault,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default DashboardContext;
