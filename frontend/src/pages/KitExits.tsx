import { useEffect, useMemo, useState } from 'react';
import { Boxes, Send, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { inventoryApi, kitApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface KitOption {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  totalAvailable: number;
  inventory?: Array<{ quantity: number }> | null;
  kitProducts?: Array<{
    id: string;
    quantity: number;
    product?: { id: string; code: string; name: string };
  }>;
}

export default function KitExits() {
  const toast = useToast();
  const [kits, setKits] = useState<KitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ kitId: '', quantity: 1, reason: '', reference: '' });

  const selectedKit = useMemo(
    () => kits.find(kit => kit.id === form.kitId) || null,
    [kits, form.kitId]
  );

  const availableQuantity = selectedKit?.totalAvailable || 0;

  useEffect(() => {
    fetchKits();
  }, []);

  useEffect(() => {
    if (form.kitId) {
      fetchKits();
    }
  }, [form.kitId]);

  const fetchKits = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los kits
      const kitsResponse = await kitApi.getAll();
      const allKits = kitsResponse.data.data || [];
      
      console.log('🔍 Kits encontrados:', allKits.length);
      
      // Para cada kit, obtener su disponibilidad real desde kitInventory
      const kitsWithAvailability = await Promise.all(
        allKits.map(async (kit: any) => {
          try {
            // Consultar la disponibilidad del kit
            const availabilityResponse = await kitApi.getAvailability(kit.id);
            console.log(`📊 Kit ${kit.code}:`, availabilityResponse.data);
            const availableQuantity = availabilityResponse.data?.data?.maxAvailable || 0;
            
            console.log(`✅ ${kit.code} - Disponibilidad: ${availableQuantity}`);
            
            return {
              ...kit,
              totalAvailable: availableQuantity
            };
          } catch (error) {
            console.log(`❌ Error en ${kit.code}:`, error);
            // Si no hay inventario, mostrar 0
            return {
              ...kit,
              totalAvailable: 0
            };
          }
        })
      );
      
      console.log('🎯 Kits con disponibilidad:', kitsWithAvailability);
      setKits(kitsWithAvailability);
    } catch (error: any) {
      console.error('❌ Error general:', error);
      toast.error(error.response?.data?.error || 'No se pudieron cargar los kits');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.kitId) {
      toast.warning('Seleccione un kit');
      return;
    }

    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) <= 0) {
      toast.warning('Ingrese una cantidad válida');
      return;
    }

    if (Number(form.quantity) > availableQuantity) {
      toast.warning(`Stock insuficiente. Disponibles: ${availableQuantity}`);
      return;
    }

    try {
      setSaving(true);
      await inventoryApi.createKitExit({
        kitId: form.kitId,
        quantity: Number(form.quantity),
        reason: form.reason || undefined,
        reference: form.reference || undefined
      });
      toast.success('Egreso de kit registrado correctamente');
      setForm({ kitId: '', quantity: 1, reason: '', reference: '' });
      fetchKits();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo registrar el egreso del kit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-7 h-7" />
            Egresos de Kits
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Registre salidas de kits como unidades completas para trazabilidad en histórico y auditoría.
          </p>
        </div>
        <button onClick={fetchKits} className="btn-secondary flex items-center gap-2" disabled={saving}>
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Información del kit seleccionado */}
      {selectedKit && (
        <div className={`card p-4 ${selectedKit.totalAvailable > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{selectedKit.code} - {selectedKit.name}</h3>
              <p className={`text-sm ${selectedKit.totalAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedKit.totalAvailable > 0 
                  ? `✅ ${selectedKit.totalAvailable} unidades disponibles para egreso` 
                  : `❌ Sin stock disponible para egreso`}
              </p>
            </div>
            <div className={`text-2xl font-bold ${selectedKit.totalAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {selectedKit.totalAvailable}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="card lg:col-span-2 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Kit</label>
            <select
              value={form.kitId}
              onChange={(event) => setForm({ ...form, kitId: event.target.value })}
              className="input"
            >
              <option value="">Seleccione un kit</option>
              {kits.map(kit => (
                <option key={kit.id} value={kit.id}>
                  {kit.code} - {kit.name} ({kit.totalAvailable})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Cantidad a egresar</label>
              <input
                type="number"
                min="1"
                max={availableQuantity || undefined}
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Referencia</label>
              <input
                type="text"
                value={form.reference}
                onChange={(event) => setForm({ ...form, reference: event.target.value })}
                className="input"
                placeholder="Ej: EGRESO-BODEGA-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Motivo</label>
            <textarea
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
              className="input min-h-[110px]"
              placeholder="Describa el motivo del egreso"
            />
          </div>

          {selectedKit && availableQuantity <= 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-semibold">Kit sin disponibilidad registrada</p>
                <p className="text-sm">Debe existir inventario de kits antes de registrar egresos.</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={saving || !selectedKit || availableQuantity <= 0}
          >
            <Send className="w-4 h-4" />
            {saving ? 'Registrando...' : 'Registrar egreso de kit'}
          </button>
        </form>

        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Resumen</h2>
          </div>
          {selectedKit ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Código</p>
                <p className="font-mono font-semibold">{selectedKit.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Kit</p>
                <p className="font-semibold">{selectedKit.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Disponibles</p>
                <p className="text-2xl font-bold text-primary-600">{availableQuantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Composición</p>
                <div className="space-y-2">
                  {(selectedKit.kitProducts || []).map(item => (
                    <div key={item.id} className="flex justify-between rounded bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-sm">
                      <span>{item.product?.name || 'Producto'}</span>
                      <span className="font-semibold">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Seleccione un kit para ver disponibilidad y composición.</p>
          )}
        </div>
      </div>
    </div>
  );
}
