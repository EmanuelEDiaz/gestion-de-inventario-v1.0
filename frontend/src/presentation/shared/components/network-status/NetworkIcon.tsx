'use client';

import { Wifi, WifiOff, RefreshCw, Signal } from 'lucide-react';
import type { BackendStatus } from '@/presentation/shared/hooks/useNetworkHealth';
import type { SyncStatus } from '@/presentation/shared/hooks/useSyncStatus';

interface NetworkIconProps {
  backendStatus: BackendStatus;
  syncStatus: SyncStatus;
  pendingCount: number;
  size?: number;
}

export function NetworkIcon({ backendStatus, syncStatus, pendingCount, size = 16 }: NetworkIconProps) {
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
}

export function getStatusColor(backendStatus: BackendStatus, syncStatus: SyncStatus, pendingCount: number): string {
  if (syncStatus === 'syncing') return 'border-blue-400 bg-blue-50';
  if (backendStatus === 'disconnected') return 'border-red-400 bg-red-50';
  if (pendingCount > 0) return 'border-amber-400 bg-amber-50';
  return 'border-green-400 bg-green-50';
}

export function getStatusLabel(backendStatus: BackendStatus, syncStatus: SyncStatus, pendingCount: number): string {
  if (syncStatus === 'syncing') return 'Sincronizando...';
  if (backendStatus === 'disconnected') return 'Sin conexión';
  if (pendingCount > 0) return `${pendingCount} cambio${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''}`;
  return 'Conectado';
}
