'use client';

import { useState, useDeferredValue } from 'react';
import { useAppLoaderStore, getPhaseLabel, getPhaseProgress, type LoadPhase, type AppAvailability } from '@/core/loading/appLoaderStore';
import { Check, Loader2, ChevronDown, ChevronRight } from '@/presentation/shared/components/ui/icon-mapping';

const PHASE_ORDER: LoadPhase[] = [
  'quota', 'sw_precache', 'db_open', 'rehydrate_local',
  'warehouses', 'categories', 'products',
  'currencies', 'exchange_rates', 'customer_debts',
  'stock', 'customers', 'suppliers',
];

function subLabelFor(phase: LoadPhase, subStep: string, swCompleted: number, swTotal: number): string {
  if (phase === 'sw_precache' && swTotal > 0) return `Instalando aplicación... ${swCompleted}/${swTotal} assets`;
  return subStep;
}

function subPercentFor(
  phase: LoadPhase, progress: number, swCompleted: number, swTotal: number,
  subProgress: number, subTotal: number,
): number {
  if (phase === 'sw_precache' && swTotal > 0) {
    const fromW = getPhaseProgress('quota');
    const toW = getPhaseProgress('sw_precache');
    return fromW + Math.round((swCompleted / swTotal) * (toW - fromW));
  }
  if (phase === 'products' && subTotal > 0) return Math.round((subProgress / subTotal) * 100);
  // For non-paginated phases, compute how far within the current phase's weight range
  const currentW = getPhaseProgress(phase);
  const prevW = PHASE_ORDER.indexOf(phase) > 0
    ? getPhaseProgress(PHASE_ORDER[PHASE_ORDER.indexOf(phase) - 1])
    : 0;
  const range = currentW - prevW;
  if (range <= 0) return 0;
  return Math.round(((progress - prevW) / range) * 100);
}

export function CacheProgressBar() {
  const phase = useAppLoaderStore((s) => s.phase);
  const progress = useAppLoaderStore((s) => s.progress);
  const subStep = useAppLoaderStore((s) => s.subStep);
  const subProgress = useAppLoaderStore((s) => s.subProgress);
  const subTotal = useAppLoaderStore((s) => s.subTotal);
  const swCompleted = useAppLoaderStore((s) => s.swCompleted);
  const swTotal = useAppLoaderStore((s) => s.swTotal);
  const availability = useAppLoaderStore((s) => s.availability);
  const errorMsg = useAppLoaderStore((s) => s.error);

  const isReadyComplete = availability === 'ready_complete';
  const isReadyPartial = availability === 'ready_partial';
  const isFinal = isReadyComplete || isReadyPartial;

  const deferredProgress = useDeferredValue(progress);
  const [showDetails, setShowDetails] = useState(false);

  const isError = phase === 'error';
  const isIdle = phase === 'idle';

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const label = subLabelFor(phase, subStep, swCompleted, swTotal);
  const detailPercent = subPercentFor(phase, progress, swCompleted, swTotal, subProgress, subTotal);

  return (
    <div className="space-y-2">
      {/* Main progress bar — oculta en ready_complete */}
      {!isReadyComplete && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>App cargada</span>
            <span className="font-medium">{deferredProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${deferredProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Detail section: always visible while loading */}
      {!isIdle && (
        <div className="rounded border border-gray-200 bg-gray-50 p-2">
          {/* Header row: icon + label + percent + toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {isReadyComplete ? (
                <Check size={12} className="text-green-500 shrink-0" />
              ) : isReadyPartial ? (
                <Check size={12} className="text-yellow-500 shrink-0" />
              ) : isError ? (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
              ) : (
                <Loader2 size={12} className="animate-spin text-blue-500 shrink-0" />
              )}
              <span className="text-[11px] font-medium text-gray-700 truncate">
                {isReadyComplete ? 'Todo listo' : isReadyPartial ? 'App lista' : isError ? 'Error' : getPhaseLabel(phase)}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-medium text-blue-600">
                {isFinal ? '100%' : isError ? '—' : `${detailPercent}%`}
              </span>
              {!isFinal && !isError && (
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="text-gray-400 hover:text-gray-600"
                  title={showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
                >
                  {showDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Sub-step text */}
          {label && !isFinal && !isError && (
            <p className="mt-0.5 text-[10px] text-gray-500 truncate">{label}</p>
          )}

          {/* Progress bar for current phase */}
          {!isFinal && !isError && (
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${detailPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Collapsible phase list — solo durante carga */}
      {showDetails && !isFinal && !isError && (
        <ul className="space-y-1 pl-1">
          {PHASE_ORDER.map((p, idx) => {
            const isCurrent = idx === phaseIndex;
            const isDone = idx < phaseIndex;
            const pl = getPhaseLabel(p);
            return (
              <li key={p} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                {isDone ? (
                  <Check size={10} className="text-green-500 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 size={10} className="animate-spin text-blue-500 shrink-0" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full border border-gray-300 shrink-0" />
                )}
                <span className={isDone ? 'text-green-600' : isCurrent ? 'text-blue-600 font-medium' : ''}>
                  {pl}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* ready_complete message */}
      {isReadyComplete && (
        <p className="text-xs font-medium text-green-600">
          Todo listo
        </p>
      )}

      {/* ready_partial message */}
      {isReadyPartial && (
        <p className="text-xs text-amber-700">
          App lista — puedes descargar el mapa desde Configuración
        </p>
      )}

      {/* Error box */}
      {isError && (
        <div className="rounded border border-red-200 bg-red-50 p-2">
          <p className="text-xs font-medium text-red-700">Error durante la carga inicial</p>
          {errorMsg && (
            <p className="mt-1 text-[11px] leading-relaxed text-red-600 break-words">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
