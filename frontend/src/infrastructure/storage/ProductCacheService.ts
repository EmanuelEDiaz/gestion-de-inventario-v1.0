import { getDB, type CachedProduct } from './db';

export async function saveProducts(products: CachedProduct[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');
  const now = Date.now();
  for (const product of products) {
    await store.put({ ...product, cachedAt: now });
  }
  await tx.done;
}

export async function getAllProducts(): Promise<CachedProduct[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function getProduct(id: string): Promise<CachedProduct | undefined> {
  const db = await getDB();
  return db.get('products', id);
}

export async function clearProducts(): Promise<void> {
  const db = await getDB();
  await db.clear('products');
}

export async function getProductsCount(): Promise<number> {
  const db = await getDB();
  return db.count('products');
}

export function isStale(cachedAt: number, maxAgeMs: number): boolean {
  return Date.now() - cachedAt > maxAgeMs;
}
