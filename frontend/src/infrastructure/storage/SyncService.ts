/**
 * Sync Service - PERSISTENCIA NO IMPLEMENTADA
 * ===========================================
 * 
 * Este módulo maneja el sync bidireccional con el servidor.
 * NO está activo actualmente - no hay datos que sincronizar.
 * 
 * DOCUMENTACIÓN PARA IMPLEMENTACIÓN FUTURA:
 * 
 * PUSH (cliente -> servidor):
 *   - Procesar cola outbox cuando hay conexión
 *   - Reintentar operaciones fallidas (max 5 intentos)
 *   - Eliminar del outbox solo si el servidor confirma éxito
 * 
 * PULL (servidor -> cliente):
 *   - Usar cursor para sync incremental
 *   - Aplicar cambios del servidor a cache local
 *   - Resolver conflictos (timestamp-based)
 * 
 * FRECUENCIA DE SYNC:
 *   - Auto-sync cada 30 segundos cuando online
 *   - Sync manual disponible para el usuario
 * 
 * ===========================================
 * CÓDIGO COMENTADO - NO USAR HASTA IMPLEMENTACIÓN
 */

// import { apiClient } from '@/infrastructure/api/client';
// import { getSyncCursor, setSyncCursor } from './db';
// import { getPendingOutbox, removeFromOutbox, incrementRetry } from './outbox';

// interface SyncEntry {
//   cursor: number;
//   entityType: string;
//   entityId: string;
//   action: string;
//   payload: unknown;
// }

// interface SyncPullResponse {
//   nextCursor: number;
//   hasMore: boolean;
//   entries: SyncEntry[];
// }

// export async function pushOutbox(): Promise<{ pushed: number; failed: number }> {
//   const pending = await getPendingOutbox();
//   let pushed = 0;
//   let failed = 0;
//   for (const entry of pending) {
//     if (entry.retries >= 5) { failed++; continue; }
//     try {
//       await apiClient.request({ method: entry.method, url: entry.url, data: entry.body });
//       await removeFromOutbox(entry.id!);
//       pushed++;
//     } catch {
//       await incrementRetry(entry.id!);
//       failed++;
//     }
//   }
//   return { pushed, failed };
// }

// const MAX_PULL_PAGES = 50;

// export async function pullSync(): Promise<{ newEntries: number }> {
//   const cursor = await getSyncCursor();
//   let total = 0;
//   let currentCursor = cursor;
//   let hasMore = true;
//   let page = 0;

//   while (hasMore && page < MAX_PULL_PAGES) {
//     page++;
//     const response = await apiClient.get<SyncPullResponse>(
//       `/api/v1/sync/pull?cursor=${currentCursor}`
//     );
//     const { nextCursor, hasMore: more, entries } = response.data;
//     total += entries.length;

//     // Safety: if cursor doesn't advance, the server is stuck — stop immediately
//     if (nextCursor <= currentCursor) break;

//     currentCursor = nextCursor;
//     hasMore = more && entries.length > 0;
//   }

//   if (currentCursor !== cursor) {
//     await setSyncCursor(currentCursor);
//   }
//   return { newEntries: total };
// }

// Exports dummy
export async function pushOutbox(): Promise<{ pushed: number; failed: number }> {
  console.warn('[SYNC] No implementado: persistencia offline noActive');
  return { pushed: 0, failed: 0 };
}
export async function pullSync(): Promise<{ newEntries: number }> {
  return { newEntries: 0 };
}