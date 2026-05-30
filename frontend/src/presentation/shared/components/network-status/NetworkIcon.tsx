'use client';

import { Wifi, WifiOff, RefreshCw, Signal } from '@/presentation/shared/components/ui/icon-mapping';
import type { BackendStatus } from '@/presentation/shared/hooks/storage/useNetworkHealth';
type SyncState = 'online' | 'offline' | 'syncing' | 'error';

interface NetworkIconProps {
  backendStatus: BackendStatus;
  syncStatus: SyncState;
  pendingCount: number;
  size?: number;
  deadLetterCount?: number;
}

export function NetworkIcon({ backendStatus, syncStatus, pendingCount, size = 16, deadLetterCount }: NetworkIconProps) {
  const icon = () => {
    if (syncStatus === 'syncing') {
      return <RefreshCw size={size} className="animate-spin text-blue-500" />;
    }
    if (backendStatus === 'disconnected') {
      return <WifiOff size={size} className="text-red-500" />;
    }
    if (pendingCount > 0) {
      return <Signal size={size} className="text-amber-500" />;
    }
    return <Wifi size={size} className="text-green-500" />;
  };

  if (deadLetterCount != null && deadLetterCount > 0) {
    return (
      <span className="relative inline-block">
        {icon()}
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white ring-1 ring-white">
          {deadLetterCount > 9 ? '9+' : deadLetterCount}
        </span>
      </span>
    );
  }

  return icon();
}

export function getStatusColor(backendStatus: BackendStatus, syncStatus: SyncState, pendingCount: number): string {
  if (syncStatus === 'syncing') return 'border-blue-400 bg-blue-50';
  if (backendStatus === 'disconnected') return 'border-red-400 bg-red-50';
  if (pendingCount > 0) return 'border-amber-400 bg-amber-50';
  return 'border-green-400 bg-green-50';
}

export function getStatusLabel(backendStatus: BackendStatus, syncStatus: SyncState, pendingCount: number): string {
  if (syncStatus === 'syncing') return 'Sincronizando...';
  if (backendStatus === 'disconnected') return 'Sin conexión';
  if (pendingCount > 0) return `${pendingCount} cambio${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''}`;
  return 'Conectado';
}
