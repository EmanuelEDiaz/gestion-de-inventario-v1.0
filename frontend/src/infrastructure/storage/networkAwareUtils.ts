/**
 * @deprecated desde v5.3 — repositorios migrados a local-first puro. Eliminar tras un sprint sin usos.
 *   - `isOnline()` → usar `getNetworkMode()` directamente
 *   - `readWithCache()` → leer directo de IDB con `getDB().getAll(store)`
 *   - `writeWithOutbox()` → patrón inline try/catch + `addToOutbox()` (ver Repository base)
 *   - `readCachedByEntityType()` → eliminar, cada repo conoce su store
 */
import { getNetworkMode } from '@/infrastructure/storage/networkStore';
import {
  getCachedProducts, getCachedProduct, cacheProducts,
  getCachedCategories, getCachedCustomerDebts,
  getCachedCount,
} from '@/infrastructure/storage/db';
import {
  addToOutbox, OfflineQueueFullError,
} from '@/infrastructure/storage/outbox';

export function isOnline(): boolean {
  const mode = getNetworkMode();
  return mode === 'online-direct' || mode === 'online-degraded';
}

export async function readWithCache<T>(
  apiCall: () => Promise<T>,
  cacheFallback: () => Promise<T>,
): Promise<T> {
  if (isOnline()) {
    return apiCall();
  }
  return cacheFallback();
}

export async function writeWithOutbox<T, TPayload>(
  apiCall: () => Promise<T>,
  operation: {
    entityType: string;
    entityId: string;
    action: string;
    payload: TPayload;
  },
  onlineFallback: (result: T) => Promise<void>,
): Promise<T> {
  if (isOnline()) {
    const result = await apiCall();
    await onlineFallback(result);
    return result;
  }
  await addToOutbox({ operationId: crypto.randomUUID(), ...operation });
  return operation.payload as unknown as T;
}

export async function readCachedByEntityType<T>(
  entityType: string,
): Promise<T[]> {
  switch (entityType) {
    case 'products': return getCachedProducts() as unknown as Promise<T[]>;
    case 'categories': return getCachedCategories() as unknown as Promise<T[]>;
    case 'customerDebts': return getCachedCustomerDebts() as unknown as Promise<T[]>;
    default: return [];
  }
}

export { OfflineQueueFullError };
