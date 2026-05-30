import { getDB } from '@/infrastructure/storage/db';

const MAX_IMAGE_CACHE_BYTES = 50 * 1024 * 1024;

interface ImageCacheEntry {
  relativePath: string;
  blob: Blob;
  size: number;
  cachedAt: number;
  lastAccessed: number;
}

export async function getCachedImage(relativePath: string): Promise<Blob | null> {
  const db = await getDB();
  const tx = db.transaction('imageCache', 'readwrite');
  const store = tx.objectStore('imageCache');
  const entry = await store.get(relativePath) as ImageCacheEntry | undefined;
  if (!entry) return null;
  entry.lastAccessed = Date.now();
  await store.put(entry);
  await tx.done;
  return entry.blob;
}

export async function cacheImage(relativePath: string, blob: Blob): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('imageCache', 'readwrite');
  const store = tx.objectStore('imageCache');
  const entry: ImageCacheEntry = {
    relativePath,
    blob,
    size: blob.size,
    cachedAt: Date.now(),
    lastAccessed: Date.now(),
  };
  await store.put(entry);
  await tx.done;
  await evictLRU();
}

export async function evictLRU(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('imageCache', 'readwrite');
  const store = tx.objectStore('imageCache');
  let totalSize = 0;
  let cursor = await store.openCursor();
  const entries: { key: string; lastAccessed: number; size: number }[] = [];
  while (cursor) {
    const value = cursor.value as ImageCacheEntry;
    totalSize += value.size;
    entries.push({ key: cursor.key as string, lastAccessed: value.lastAccessed, size: value.size });
    cursor = await cursor.continue();
  }
  if (totalSize <= MAX_IMAGE_CACHE_BYTES) {
    await tx.done;
    return;
  }
  entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
  let freed = 0;
  for (const entry of entries) {
    if (totalSize - freed <= MAX_IMAGE_CACHE_BYTES) break;
    await store.delete(entry.key);
    freed += entry.size;
  }
  await tx.done;
}

export async function getImageCacheSize(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('imageCache', 'readonly');
  const store = tx.objectStore('imageCache');
  let totalSize = 0;
  let cursor = await store.openCursor();
  while (cursor) {
    totalSize += (cursor.value as ImageCacheEntry).size;
    cursor = await cursor.continue();
  }
  await tx.done;
  return totalSize;
}

export async function clearImageCache(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('imageCache', 'readwrite');
  await tx.objectStore('imageCache').clear();
  await tx.done;
}
