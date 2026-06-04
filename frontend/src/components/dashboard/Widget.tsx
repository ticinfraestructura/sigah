import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface WidgetProps {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'list' | 'alert';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onRemove?: () => void;
  onResize?: (size: 'small' | 'medium' | 'large') => void;
  onMove?: (position: { x: number; y: number }) => void;
}

export const Widget: React.FC<WidgetProps> = ({
  id,
  type,
  title,
  size,
  position,
  data,
  loading = false,
  error,
  onRefresh,
  onRemove,
  onResize,
  onMove
}) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2'
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32 text-red-500">
          <div className="text-center">
            <p className="text-sm">Error al cargar datos</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      );
    }

    switch (type) {
      case 'stat':
        return <StatWidget data={data} />;
      case 'chart':
        return <ChartWidget data={data} />;
      case 'table':
        return <TableWidget data={data} />;
      case 'list':
        return <ListWidget data={data} />;
      case 'alert':
        return <AlertWidget data={data} />;
      default:
        return <div className="p-4 text-gray-500">Widget no encontrado</div>;
    }
  };

  return (
    <Card className={`${sizeClasses[size]} relative group`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        
        {/* Actions */}
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          )}
          
          <div className="flex items-center">
            <select
              value={size}
              onChange={(e) => onResize?.(e.target.value as 'small' | 'medium' | 'large')}
              className="text-xs border rounded px-1 py-0.5"
            >
              <option value="small">S</option>
              <option value="medium">M</option>
              <option value="large">L</option>
            </select>
          </div>

          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>
    </Card>
  );
};

// Widget Components
const StatWidget: React.FC<{ data?: any }> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${data.color || 'text-blue-600'}`}>
        {data.value}
      </div>
      <div className="text-sm text-gray-500 mt-1">{data.label}</div>
      {data.change && (
        <div className={`text-xs mt-2 ${data.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {data.change > 0 ? '↑' : '↓'} {Math.abs(data.change)}%
        </div>
      )}
    </div>
  );
};

const ChartWidget: React.FC<{ data?: any }> = ({ data }) => {
  return (
    <div className="h-32 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <p className="text-sm">Gráfico</p>
        <p className="text-xs mt-1">Integrar Chart.js o Recharts</p>
      </div>
    </div>
  );
};

const TableWidget: React.FC<{ data?: any }> = ({ data }) => {
  if (!data || !data.rows) return null;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            {data.columns?.map((col: string, i: number) => (
              <th key={i} className="text-left py-1 px-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows?.slice(0, 5).map((row: any, i: number) => (
            <tr key={i} className="border-b">
              {data.columns?.map((col: string, j: number) => (
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
};

const ListWidget: React.FC<{ data?: any }> = ({ data }) => {
  if (!data || !data.items) return null;

  return (
    <div className="space-y-2">
      {data.items?.slice(0, 5).map((item: any, i: number) => (
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
};

const AlertWidget: React.FC<{ data?: any }> = ({ data }) => {
  if (!data || !data.alerts) return null;

  return (
    <div className="space-y-2">
      {data.alerts?.slice(0, 3).map((alert: any, i: number) => (
        <div
          key={i}
          className={`p-2 rounded text-sm ${
            alert.type === 'error'
              ? 'bg-red-50 text-red-700'
              : alert.type === 'warning'
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          <div className="font-medium">{alert.title}</div>
          <div className="text-xs opacity-90">{alert.message}</div>
        </div>
      ))}
    </div>
  );
};

export default Widget;
