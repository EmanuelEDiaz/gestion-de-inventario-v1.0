/**
 * @deprecated Use useImageCache (React hook) or ImageResolver directly.
 * This service is a thin compatibility layer over the new OPFS + imageIndex system.
 */

import { getDB } from '@/infrastructure/storage/db';
import { revokeAllObjectUrls } from '@/infrastructure/images/ImageResolver';
import { deleteOPFSImage } from '@/infrastructure/images/opfs-image-utils';

const MAX_IMAGE_CACHE_BYTES = 50 * 1024 * 1024;

export async function getCachedImage(/* relativePath: string */): Promise<Blob | null> {
  return null;
}

export async function cacheImage(/* relativePath: string, blob: Blob */): Promise<void> {
  return;
}

export async function evictLRU(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('imageIndex', 'readwrite');
  const store = tx.objectStore('imageIndex');
  let totalSize = 0;
  let cursor = await store.openCursor();
  const entries: { key: string; sizeBytes: number; cachedAt: number }[] = [];
  while (cursor) {
    const value = cursor.value as { sizeBytes: number; cachedAt: number };
    totalSize += value.sizeBytes;
    entries.push({ key: cursor.key as string, sizeBytes: value.sizeBytes, cachedAt: value.cachedAt });
    cursor = await cursor.continue();
  }
  if (totalSize <= MAX_IMAGE_CACHE_BYTES) {
    await tx.done;
    return;
  }
  entries.sort((a, b) => a.cachedAt - b.cachedAt);
  let freed = 0;
  for (const entry of entries) {
    if (totalSize - freed <= MAX_IMAGE_CACHE_BYTES) break;
    const record = await store.get(entry.key) as { opfsPath: string } | undefined;
    if (record?.opfsPath) {
      await deleteOPFSImage(record.opfsPath);
    }
    await store.delete(entry.key);
    freed += entry.sizeBytes;
  }
  await tx.done;
}

export async function getImageCacheSize(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('imageIndex', 'readonly');
  const store = tx.objectStore('imageIndex');
  let totalSize = 0;
  let cursor = await store.openCursor();
  while (cursor) {
    totalSize += (cursor.value as { sizeBytes: number }).sizeBytes;
    cursor = await cursor.continue();
  }
  await tx.done;
  return totalSize;
}

export async function clearImageCache(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('imageIndex', 'readwrite');
  const store = tx.objectStore('imageIndex');
  let cursor = await store.openCursor();
  while (cursor) {
    const record = cursor.value as { opfsPath: string };
    if (record.opfsPath) {
      await deleteOPFSImage(record.opfsPath);
    }
    cursor = await cursor.continue();
  }
  await store.clear();
  await tx.done;
  revokeAllObjectUrls();
}
