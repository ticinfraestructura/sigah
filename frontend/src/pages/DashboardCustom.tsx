import React, { useState, useEffect } from 'react';
import { inventoryApi, kitApi, beneficiaryApi, requestApi } from '../services/api';

interface Widget {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'list' | 'alert';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
  loading?: boolean;
  error?: string;
}

const DashboardCustom: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: 'total-products',
      type: 'stat',
      title: 'Total Productos',
      size: 'small',
      position: { x: 0, y: 0 },
      loading: true
    },
    {
      id: 'low-stock',
      type: 'alert',
      title: 'Stock Bajo',
      size: 'medium',
      position: { x: 1, y: 0 },
      loading: true
    },
    {
      id: 'total-kits',
      type: 'stat',
      title: 'Total Kits',
      size: 'small',
      position: { x: 2, y: 0 },
      loading: true
    },
    {
      id: 'recent-requests',
      type: 'list',
      title: 'Solicitudes Recientes',
      size: 'medium',
      position: { x: 0, y: 1 },
      loading: true
    },
    {
      id: 'top-products',
      type: 'table',
      title: 'Productos Top',
      size: 'large',
      position: { x: 1, y: 1 },
      loading: true
    },
    {
      id: 'beneficiaries',
      type: 'stat',
      title: 'Beneficiarios',
      size: 'small',
      position: { x: 2, y: 1 },
      loading: true
    }
  ]);

  const [loading, setLoading] = useState(true);

  // Cargar datos de widgets
  useEffect(() => {
    const loadWidgetData = async () => {
      try {
        // Cargar productos
        const productsResponse = await inventoryApi.getStock({});
        const products = productsResponse.data.data || [];
        
        // Cargar kits
        const kitsResponse = await kitApi.getAll(false).catch(() => ({ data: { data: [] } }));
        const kits = kitsResponse.data.data || [];

        // Cargar beneficiarios
        const beneficiariesResponse = await beneficiaryApi.getAll().catch(() => ({ data: { data: [] } }));
        const beneficiaries = beneficiariesResponse.data.data || [];

        // Cargar solicitudes
        const requestsResponse = await requestApi.getAll().catch(() => ({ data: { data: [] } }));
        const requests = requestsResponse.data.data || [];

        // Actualizar widgets con datos
        setWidgets(prevWidgets => 
          prevWidgets.map(widget => {
            switch (widget.id) {
              case 'total-products':
                return {
                  ...widget,
                  loading: false,
                  data: {
                    value: products.length,
                    label: 'Productos',
                    color: 'text-blue-600',
                    change: 5.2
                  }
                };

              case 'low-stock':
                const lowStockProducts = products.filter(p => p.isLowStock);
                return {
                  ...widget,
                  loading: false,
                  data: {
                    alerts: lowStockProducts.map(p => ({
                      type: 'warning',
                      title: p.name,
                      message: `Stock: ${p.totalStock} (Mín: ${p.minStock})`
                    }))
                  }
                };

              case 'total-kits':
                return {
                  ...widget,
                  loading: false,
                  data: {
                    value: kits.length,
                    label: 'Kits',
                    color: 'text-green-600',
                    change: 2.1
                  }
                };

              case 'recent-requests':
                const recentRequests = requests.slice(0, 5);
                return {
                  ...widget,
                  loading: false,
                  data: {
                    items: recentRequests.map(req => ({
                      title: req.code,
                      subtitle: req.beneficiaryId,
                      value: req.status,
                      color: req.status === 'APPROVED' ? 'text-green-600' : 
                             req.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'
                    }))
                  }
                };

              case 'top-products':
                const topProducts = products
                  .sort((a, b) => b.totalStock - a.totalStock)
                  .slice(0, 5);
                return {
                  ...widget,
                  loading: false,
                  data: {
                    columns: ['Producto', 'Categoría', 'Stock'],
                    rows: topProducts.map(p => ({
                      'Producto': p.name,
                      'Categoría': p.category,
                      'Stock': p.totalStock
                    }))
                  }
                };

              case 'beneficiaries':
                return {
                  ...widget,
                  loading: false,
                  data: {
                    value: beneficiaries.length,
                    label: 'Beneficiarios',
                    color: 'text-purple-600',
                    change: 8.7
                  }
                };

              default:
                return { ...widget, loading: false };
            }
          })
        );

        setLoading(false);
      } catch (error) {
        console.error('Error loading widget data:', error);
        setWidgets(prevWidgets => 
          prevWidgets.map(widget => ({
            ...widget,
            loading: false,
            error: 'Error al cargar datos'
          }))
        );
        setLoading(false);
      }
    };

    loadWidgetData();
  }, []);

  const handleRefresh = (widgetId: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, loading: true, error: undefined }
          : widget
      )
    );

    // Recargar datos específicos del widget
    setTimeout(() => {
      // Aquí iría la lógica de recarga específica
      setWidgets(prevWidgets =>
        prevWidgets.map(widget =>
          widget.id === widgetId
            ? { ...widget, loading: false }
            : widget
        )
      );
    }, 1000);
  };

  const handleResize = (widgetId: string, newSize: 'small' | 'medium' | 'large') => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, size: newSize }
          : widget
      )
    );
  };

  const handleRemove = (widgetId: string) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== widgetId));
  };

  // Widget component simplificado
  const WidgetComponent: React.FC<{ widget: Widget }> = ({ widget }) => {
    const sizeClasses = {
      small: 'col-span-1 row-span-1',
      medium: 'col-span-2 row-span-1',
      large: 'col-span-2 row-span-2'
    };

    const renderContent = () => {
      if (widget.loading) {
        return (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      }

      if (widget.error) {
        return (
          <div className="flex items-center justify-center h-32 text-red-500">
            <div className="text-center">
              <p className="text-sm">Error al cargar datos</p>
              <p className="text-xs">{widget.error}</p>
            </div>
          </div>
        );
      }

      switch (widget.type) {
        case 'stat':
          return (
            <div className="text-center">
              <div className={`text-3xl font-bold ${widget.data?.color || 'text-blue-600'}`}>
                {widget.data?.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{widget.data?.label}</div>
              {widget.data?.change && (
                <div className={`text-xs mt-2 ${widget.data.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {widget.data.change > 0 ? '↑' : '↓'} {Math.abs(widget.data.change)}%
                </div>
              )}
            </div>
          );

        case 'alert':
          return (
            <div className="space-y-2">
              {widget.data?.alerts?.slice(0, 3).map((alert: any, i: number) => (
                <div
                  key={i}
                  className={`p-2 rounded text-sm ${
                    alert.type === 'error'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-xs opacity-90">{alert.message}</div>
                </div>
              ))}
            </div>
          );

        case 'list':
          return (
            <div className="space-y-2">
              {widget.data?.items?.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.subtitle}</div>
                  </div>
                  <div className={`text-sm font-medium ${item.color || 'text-gray-900'}`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          );

        case 'table':
          return (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {widget.data?.columns?.map((col: string, i: number) => (
                      <th key={i} className="text-left py-1 px-2 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {widget.data?.rows?.slice(0, 5).map((row: any, i: number) => (
                    <tr key={i} className="border-b">
                      {widget.data?.columns?.map((col: string, j: number) => (
                        <td key={j} className="py-1 px-2">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        default:
          return <div className="p-4 text-gray-500">Widget no encontrado</div>;
      }
    };

    return (
      <div className={`${sizeClasses[widget.size]} bg-white rounded-lg shadow relative group`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{widget.title}</h3>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleRefresh(widget.id)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <select
              value={widget.size}
              onChange={(e) => handleResize(widget.id, e.target.value as any)}
              className="text-xs border rounded px-1 py-0.5"
            >
              <option value="small">S</option>
              <option value="medium">M</option>
              <option value="large">L</option>
            </select>

            <button
              onClick={() => handleRemove(widget.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Personalizable</h1>
        <p className="text-gray-500">Arrastra y redimensiona los widgets según tus necesidades</p>
      </div>

      <div className="grid grid-cols-3 gap-4 auto-rows-auto">
        {widgets.map(widget => (
          <WidgetComponent key={widget.id} widget={widget} />
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay widgets configurados</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Agregar Widget
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardCustom;
