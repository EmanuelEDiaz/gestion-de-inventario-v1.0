import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DashboardStats } from '@/core/entities/dashboard';

export interface OutboxEntry {
  id?: number;
  idempotencyKey: string;
  method: string;
  url: string;
  body: unknown;
  createdAt: number;
  retries: number;
}

export interface CachedProduct {
  id: string;
  name: string;
  sku: string;
  updatedAt: number;
}

interface InventoryDB extends DBSchema {
  outbox: {
    key: number;
    value: OutboxEntry;
    indexes: { 'by-created': number };
  };
  products: {
    key: string;
    value: CachedProduct;
  };
  syncMeta: {
    key: string;
    value: { key: string; value: unknown };
  };
}

let dbInstance: IDBPDatabase<InventoryDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<InventoryDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<InventoryDB>('inventory-offline', 1, {
    upgrade(db) {
      const outbox = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      outbox.createIndex('by-created', 'createdAt');
      db.createObjectStore('products', { keyPath: 'id' });
      db.createObjectStore('syncMeta', { keyPath: 'key' });
    },
  });
  return dbInstance;
}

export async function getSyncCursor(): Promise<number> {
  const db = await getDB();
  const meta = await db.get('syncMeta', 'cursor');
  return (meta?.value as number) ?? 0;
}

export async function setSyncCursor(cursor: number): Promise<void> {
  const db = await getDB();
  await db.put('syncMeta', { key: 'cursor', value: cursor });
}
