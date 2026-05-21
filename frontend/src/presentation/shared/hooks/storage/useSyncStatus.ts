'use client';

/**
 * useSyncStatus - PERSISTENCIA NO IMPLEMENTADA
 * ==========================================
 * 
 * Hook para manejar estado de sincronización offline/online.
 * NO está activo actualmente - no hay datos que sincronizar.
 * 
 * DOCUMENTACIÓN PARA IMPLEMENTACIÓN FUTURA:
 * 
 * - Estados: online, offline, syncing, error
 * - Auto-sync cada 30 segundos cuando online
 * - Mostrar contador de operaciones pendientes en outbox
 * 
 * ==========================================
 * CÓDIGO COMENTADO - NO USAR HASTA IMPLEMENTACIÓN
 */

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { isPersistenceReady } from '@/infrastructure/storage/db';
// import { pushOutbox, pullSync } from '@/infrastructure/storage/SyncService';

// export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

// export function useSyncStatus() {
//   const [status, setStatus] = useState<SyncStatus>('online');
//   const [lastSync, setLastSync] = useState<Date | null>(null);
//   const [pendingCount, setPendingCount] = useState(0);
//   const syncInProgress = useRef(false);

//   const updateOnlineStatus = useCallback(() => {
//     setStatus((prev) => {
//       if (!navigator.onLine) return 'offline';
//       if (prev === 'offline') return 'online';
//       return prev;
//     });
//   }, []);

//   const sync = useCallback(async () => {
//     if (syncInProgress.current || !navigator.onLine || !isPersistenceReady()) return;
//     syncInProgress.current = true;
//     setStatus('syncing');
//     try {
//       const { pushed } = await pushOutbox();
//       await pullSync();
//       setLastSync(new Date());
//       setPendingCount(prev => Math.max(0, prev - pushed));
//       setStatus('online');
//     } catch {
//       setStatus('error');
//       setTimeout(() => setStatus(navigator.onLine ? 'online' : 'offline'), 3000);
//     } finally {
//       syncInProgress.current = false;
//     }
//   }, []);

//   useEffect(() => {
//     window.addEventListener('online', updateOnlineStatus);
//     window.addEventListener('offline', updateOnlineStatus);
//     return () => {
//       window.removeEventListener('online', updateOnlineStatus);
//       window.removeEventListener('offline', updateOnlineStatus);
//     };
//   }, [updateOnlineStatus]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (navigator.onLine) sync();
//     }, 30000);
//     return () => clearInterval(interval);
//   }, [sync]);

//   return { status, lastSync, pendingCount, sync };
// }

// Export dummy - siempre online
import { useState, useEffect, useCallback } from 'react';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('online');
  const [lastSync] = useState<Date | null>(null);
  const [pendingCount] = useState(0);

  const updateOnlineStatus = useCallback(() => {
    setStatus(navigator.onLine ? 'online' : 'offline');
  }, []);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus]);

  // Sync no-op cuando no hay persistencia
  const sync = useCallback(async () => {
    return;
  }, []);

  return { status, lastSync, pendingCount, sync };
}