'use client';

import { useErrorLogStore } from '@/core/loading/errorLogStore';
import { AlertCircle, Trash2, RefreshCw } from '@/presentation/shared/components/ui/icon-mapping';
import { useAppLoaderStore } from '@/core/loading/appLoaderStore';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('es-CU');
}

const PHASE_LABELS: Record<string, string> = {
  quota: 'Verificando almacenamiento',
  sw_precache: 'Instalando aplicación',
  db_open: 'Preparando almacenamiento local',
  warehouses: 'Descargando bodegas',
  categories: 'Descargando categorías',
  products: 'Descargando productos',
  customers: 'Descargando clientes',
  suppliers: 'Descargando proveedores',
  stock: 'Descargando existencias',
  app_loader: 'Carga inicial',
};

function phaseLabel(p: string): string {
  return PHASE_LABELS[p] || p;
}

export function LoadErrorLog() {
  const errors = useErrorLogStore((s) => s.errors);
  const clearErrors = useErrorLogStore((s) => s.clearErrors);
  const removeError = useErrorLogStore((s) => s.removeError);
  const startLoading = useAppLoaderStore((s) => s.start);

  if (errors.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-400">
        No hay incidencias de carga registradas
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Incidencias de Carga ({errors.length})
        </h3>
        <button
          onClick={clearErrors}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
        >
          <Trash2 size={14} />
          Limpiar historial
        </button>
      </div>
      <div className="space-y-2">
        {errors.map((err) => (
          <div
            key={err.id}
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-red-700">
                  {phaseLabel(err.phase)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-400">{formatDate(err.timestamp)}</span>
                  <button
                    onClick={() => removeError(err.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Descartar"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-red-600 break-words">{err.message}</p>
              {err.details && (
                <p className="mt-0.5 text-[11px] text-gray-500 break-words">{err.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => startLoading()}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
      >
        <RefreshCw size={14} />
        Reintentar carga inicial
      </button>
    </div>
  );
}
