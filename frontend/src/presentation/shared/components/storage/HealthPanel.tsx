'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppLoaderStore } from '@/core/loading/appLoaderStore';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';
import { useSyncStatus } from '@/presentation/shared/hooks/storage/useSyncStatus';
import { useNetworkStore } from '@/infrastructure/storage/networkStore';
import { appLogger } from '@/infrastructure/logging/appLogger';
import { TooltipHint } from '@/presentation/shared/components/ui/tooltip';
import { useHealthData } from './useHealthData';
import { HealthSections, SummaryBanner } from './HealthPanelSections';
import { HealthPanelActions } from './HealthPanelActions';

const DEBUG_PARAM = 'debug=1';

function useIsDebugMode(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search ?? '';
    setEnabled(search.includes(DEBUG_PARAM));
  }, []);
  return enabled;
}

export function HealthPanel() {
  const isDebugMode = useIsDebugMode();
  const [refreshKey, setRefreshKey] = useState(0);
  const isDev = process.env.NODE_ENV !== 'production';

  const phase = useAppLoaderStore((s) => s.phase);
  const availability = useAppLoaderStore((s) => s.availability);
  const loaderError = useAppLoaderStore((s) => s.error);
  const { isOnline, isSyncing, pendingCount, lastSyncAt, sync } = useSyncStatus();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const networkMode = useNetworkStore((s) => s.mode);

  const data = useHealthData(refreshKey);

  const userName = useMemo(() => {
    if (!user) return null;
    return user.displayName || user.username || user.id;
  }, [user]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleResync = useCallback(async () => {
    if (!isOnline) return;
    try {
      await sync();
    } catch (err) {
      appLogger.error('[HealthPanel] resync failed', err, {
        errorCode: 'ERR_HEALTHPANEL_RESYNC',
      });
    } finally {
      handleRefresh();
    }
  }, [isOnline, sync, handleRefresh]);

  if (!isDev && !isDebugMode) return null;

  return (
    <div
      data-testid="health-panel"
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-3"
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Panel de salud</h2>
          <p className="text-xs text-gray-500">
            Diagnóstico local. Solo lectura — no modifica datos.
          </p>
          {isDebugMode && (
            <p data-testid="debug-mode" className="mt-0.5 text-[10px] text-amber-700">
              Modo debug activo (?debug=1)
            </p>
          )}
        </div>
        <TooltipHint
          title="Panel de diagnóstico para soporte y desarrollo"
          description="Lee el estado de IDB, cuota, red, sesión y tareas en segundo plano. No envía datos al servidor."
          variant="info"
        />
      </header>

      <SummaryBanner loading={data.loading} error={data.error} />

      <HealthSections
        data={data}
        isAuthenticated={isAuthenticated}
        userName={userName}
        networkMode={networkMode}
        outboxCount={pendingCount}
        lastSyncAt={lastSyncAt}
      />

      <HealthPanelActions
        data={data}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onResync={handleResync}
        onRefresh={handleRefresh}
      />

      <p data-testid="health-meta" className="text-[10px] text-gray-400">
        Fase: {phase} · Disponibilidad: {availability} · Loader error: {loaderError ?? '—'}
      </p>
    </div>
  );
}

export default HealthPanel;
