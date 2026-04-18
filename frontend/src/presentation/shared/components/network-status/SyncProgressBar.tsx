'use client';

import { CheckCircle2, CloudOff } from 'lucide-react';
import type { BackendStatus } from '@/presentation/shared/hooks/useNetworkHealth';

interface SyncProgressBarProps {
  pendingCount: number;
  syncStatus: 'online' | 'offline' | 'syncing' | 'error';
  backendStatus: BackendStatus;
  lastSync: Date | null;
  onSync: () => void;
}

export function SyncProgressBar({ pendingCount, syncStatus, backendStatus, lastSync, onSync }: SyncProgressBarProps) {
  const isSyncing = syncStatus === 'syncing';
  const hasError = syncStatus === 'error';
  const isConnected = backendStatus === 'connected';
  const noPending = pendingCount === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Sincronización</span>
      </div>

      {noPending && isConnected && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>Todo actualizado</span>
        </div>
      )}

      {noPending && !isConnected && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <CloudOff size={14} className="shrink-0" />
          <span>Sin cambios pendientes</span>
        </div>
      )}

      {!noPending && (
        <>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium text-amber-600">
              {pendingCount} cambio{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isSyncing ? 'animate-pulse bg-blue-500' : hasError ? 'bg-red-400' : 'bg-amber-500'
              }`}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {lastSync
            ? `Último sync: ${lastSync.toLocaleTimeString()}`
            : noPending && isConnected ? 'Sin cambios offline' : 'Sin sincronizar'}
        </span>
        {!noPending && syncStatus !== 'offline' && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        )}
      </div>
    </div>
  );
}
