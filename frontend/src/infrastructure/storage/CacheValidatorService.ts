import { apiClient } from '@/infrastructure/api/client';
import { getDB } from '@/infrastructure/storage/db';

interface StoreChecksum {
  store: string;
  count: number;
  checksum: string;
}

export async function computeLocalChecksum(store: string): Promise<string> {
  const db = await getDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = db.transaction(store as any, 'readonly');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectStore = tx.objectStore(store as any) as any;
  let cursor = await objectStore.openCursor();
  let count = 0;
  let latestCachedAt = 0;

  while (cursor) {
    count++;
    const cachedAt = cursor.value.cachedAt as number | undefined;
    if (cachedAt && cachedAt > latestCachedAt) {
      latestCachedAt = cachedAt;
    }
    cursor = await cursor.continue();
  }

  return `${count}:${latestCachedAt}`;
}

export async function validateCache(): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();

  try {
    const response = await apiClient.get<StoreChecksum[]>('/api/v1/sync/checksums');

    for (const server of response.data) {
      try {
        const local = await computeLocalChecksum(server.store);
        result.set(server.store, local === server.checksum);
      } catch {
        result.set(server.store, false);
      }
    }
  } catch {
    return result;
  }

  return result;
}

export async function invalidateStore(store: string): Promise<void> {
  const db = await getDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = db.transaction(store as any, 'readwrite');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (tx.objectStore(store as any) as any).clear();
  await tx.done;
}
