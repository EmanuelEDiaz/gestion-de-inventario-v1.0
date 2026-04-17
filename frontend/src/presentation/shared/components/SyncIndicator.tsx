'use client';

import { useSyncStatus } from '@/presentation/shared/hooks/useSyncStatus';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export function SyncIndicator() {
  const { status, lastSync, sync } = useSyncStatus();

  const configs = {
    online: { icon: <Wifi className="h-4 w-4 text-green-500" />, label: 'En línea', color: 'text-green-600' },
    offline: { icon: <WifiOff className="h-4 w-4 text-gray-400" />, label: 'Sin conexión', color: 'text-gray-500' },
    syncing: { icon: <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />, label: 'Sincronizando...', color: 'text-blue-600' },
    error: { icon: <AlertCircle className="h-4 w-4 text-red-500" />, label: 'Error de sync', color: 'text-red-600' },
  };

  const { icon, label, color } = configs[status];

  return (
    <button
      onClick={() => status === 'online' && sync()}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-gray-100 ${color}`}
      title={lastSync ? `Última sincronización: ${lastSync.toLocaleTimeString()}` : 'Sin sincronizar'}
      disabled={status === 'syncing' || status === 'offline'}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
