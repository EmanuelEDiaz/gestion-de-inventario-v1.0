import { openDB, deleteDB, type DBSchema, type IDBPDatabase } from 'idb';

const MAX_OUTBOX_ENTRIES = 500;
const DB_NAME = 'inventory-offline';
const DB_VERSION = 4;
const DB_OPEN_TIMEOUT = 5_000;

const BACKOFF_DELAYS = [30_000, 120_000, 480_000, 1_920_000, 7_200_000];

const RETENTION = {
  DEAD_LETTER: 7 * 24 * 60 * 60 * 1000,
  NOTIFICATION: 7 * 24 * 60 * 60 * 1000,
  SALES: 30 * 24 * 60 * 60 * 1000,
  REJECTED_OUTBOX: 7 * 24 * 60 * 60 * 1000,
};

export interface OutboxEntry {
  id?: number;
  operationId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
  status: 'pending' | 'syncing' | 'accepted' | 'rejected';
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number;
  expiresAt: number;
  lastError?: string;
  createdAt: number;
}

export interface DeadLetterEntry {
  operationId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
  error: string;
  retryCount: number;
  rejectedAt: number;
  userNotified: boolean;
}

export interface CachedProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId: string;
  standardCost: number;
  salePrice: number;
  reorderPoint: number;
  cachedAt: number;
}

export interface CachedCategory {
  id: string;
  name: string;
  description: string;
  cachedAt: number;
}

export interface CachedWarehouse {
  id: string;
  name: string;
  code: string;
  cachedAt: number;
}

export interface CachedStockBalance {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  cachedAt: number;
}

export interface CachedCustomer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  cachedAt: number;
}

export interface CachedSupplier {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  cachedAt: number;
}

export interface CachedCurrency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  cachedAt: number;
}

export interface CachedExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  cachedAt: number;
}

export interface CachedSale {
  id: string;
  saleNumber: string;
  total: number;
  customerId: string;
  paymentMode: string;
  status: string;
  cachedAt: number;
}

export interface CachedPurchase {
  id: string;
  purchaseNumber: string;
  total: number;
  supplierId: string;
  status: string;
  cachedAt: number;
}

export interface CachedTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: string;
  cachedAt: number;
}

export interface CachedAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  type: string;
  cachedAt: number;
}

export interface CachedReturn {
  id: string;
  returnNumber: string;
  total: number;
  customerId: string;
  type: string;
  cachedAt: number;
}

export interface CachedMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  reference: string;
  cachedAt: number;
}

export interface CachedCustomerDebt {
  id: string;
  customerId: string;
  total: number;
  paidAmount: number;
  status: string;
  cachedAt: number;
}

export interface CachedNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  cachedAt: number;
}

interface InventoryDB extends DBSchema {
  outbox: {
    key: number;
    value: OutboxEntry;
    indexes: { 'by-status': string; 'by-created': number };
  };
  syncMeta: {
    key: string;
    value: { key: string; value: unknown };
  };
  products: {
    key: string;
    value: CachedProduct;
    indexes: { 'by-sku': string; 'by-barcode': string; 'by-category': string };
  };
  categories: {
    key: string;
    value: CachedCategory;
  };
  warehouses: {
    key: string;
    value: CachedWarehouse;
  };
  stockBalances: {
    key: string;
    value: CachedStockBalance;
    indexes: { 'by-warehouse': string; 'by-product': string };
  };
  customers: {
    key: string;
    value: CachedCustomer;
    indexes: { 'by-code': string; 'by-name': string };
  };
  suppliers: {
    key: string;
    value: CachedSupplier;
    indexes: { 'by-code': string; 'by-name': string };
  };
  currencies: {
    key: string;
    value: CachedCurrency;
  };
  exchangeRates: {
    key: string;
    value: CachedExchangeRate;
  };
  sales: {
    key: string;
    value: CachedSale;
    indexes: { 'by-number': string; 'by-date': number; 'by-customer': string };
  };
  purchases: {
    key: string;
    value: CachedPurchase;
    indexes: { 'by-number': string; 'by-date': number; 'by-supplier': string };
  };
  transfers: {
    key: string;
    value: CachedTransfer;
    indexes: { 'by-number': string; 'by-date': number };
  };
  adjustments: {
    key: string;
    value: CachedAdjustment;
    indexes: { 'by-number': string; 'by-date': number };
  };
  movements: {
    key: string;
    value: CachedMovement;
    indexes: { 'by-date': number };
  };
  returns: {
    key: string;
    value: CachedReturn;
    indexes: { 'by-number': string; 'by-date': number };
  };
  customerDebts: {
    key: string;
    value: CachedCustomerDebt;
    indexes: { 'by-customer': string; 'by-status': string };
  };
  notifications: {
    key: string;
    value: CachedNotification;
    indexes: { 'by-date': number; 'by-read': number };
  };
  deadLetter: {
    key: string;
    value: DeadLetterEntry;
    indexes: { 'by-rejectedAt': number; 'by-userNotified': number };
  };
  imageCache: {
    key: string;
    value: { relativePath: string; blob: Blob; size: number; cachedAt: number; lastAccessed: number };
    indexes: { 'by-lastAccessed': number };
  };
}

let dbInstance: IDBPDatabase<InventoryDB> | null = null;
let dbReady = false;

export async function getDB(): Promise<IDBPDatabase<InventoryDB>> {
  if (!dbReady) {
    throw new Error('Persistence not initialized. Call initPersistence() after login.');
  }
  if (dbInstance) return dbInstance;

  const openPromise = openDB<InventoryDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains('outbox')) {
        const store = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-status', 'status');
        store.createIndex('by-created', 'createdAt');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('outbox');
        if (!store.indexNames.contains('by-status')) store.createIndex('by-status', 'status');
        if (!store.indexNames.contains('by-created')) store.createIndex('by-created', 'createdAt');
      }

      if (!db.objectStoreNames.contains('syncMeta')) {
        db.createObjectStore('syncMeta', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('by-sku', 'sku');
        store.createIndex('by-barcode', 'barcode');
        store.createIndex('by-category', 'categoryId');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('products');
        if (!store.indexNames.contains('by-sku')) store.createIndex('by-sku', 'sku');
        if (!store.indexNames.contains('by-barcode')) store.createIndex('by-barcode', 'barcode');
        if (!store.indexNames.contains('by-category')) store.createIndex('by-category', 'categoryId');
      }

      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('warehouses')) {
        db.createObjectStore('warehouses', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('stockBalances')) {
        const store = db.createObjectStore('stockBalances', { keyPath: 'id' });
        store.createIndex('by-warehouse', 'warehouseId');
        store.createIndex('by-product', 'productId');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('stockBalances');
        if (!store.indexNames.contains('by-warehouse')) store.createIndex('by-warehouse', 'warehouseId');
        if (!store.indexNames.contains('by-product')) store.createIndex('by-product', 'productId');
      }

      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('by-code', 'code');
        store.createIndex('by-name', 'name');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('customers');
        if (!store.indexNames.contains('by-code')) store.createIndex('by-code', 'code');
        if (!store.indexNames.contains('by-name')) store.createIndex('by-name', 'name');
      }

      if (!db.objectStoreNames.contains('suppliers')) {
        const store = db.createObjectStore('suppliers', { keyPath: 'id' });
        store.createIndex('by-code', 'code');
        store.createIndex('by-name', 'name');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('suppliers');
        if (!store.indexNames.contains('by-code')) store.createIndex('by-code', 'code');
        if (!store.indexNames.contains('by-name')) store.createIndex('by-name', 'name');
      }

      if (!db.objectStoreNames.contains('currencies')) {
        db.createObjectStore('currencies', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('exchangeRates')) {
        db.createObjectStore('exchangeRates', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('sales')) {
        const store = db.createObjectStore('sales', { keyPath: 'id' });
        store.createIndex('by-number', 'saleNumber');
        store.createIndex('by-date', 'cachedAt');
        store.createIndex('by-customer', 'customerId');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('sales');
        if (!store.indexNames.contains('by-number')) store.createIndex('by-number', 'saleNumber');
        if (!store.indexNames.contains('by-date')) store.createIndex('by-date', 'cachedAt');
        if (!store.indexNames.contains('by-customer')) store.createIndex('by-customer', 'customerId');
      }

      if (!db.objectStoreNames.contains('purchases')) {
        const store = db.createObjectStore('purchases', { keyPath: 'id' });
        store.createIndex('by-number', 'purchaseNumber');
        store.createIndex('by-date', 'cachedAt');
        store.createIndex('by-supplier', 'supplierId');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('purchases');
        if (!store.indexNames.contains('by-number')) store.createIndex('by-number', 'purchaseNumber');
        if (!store.indexNames.contains('by-date')) store.createIndex('by-date', 'cachedAt');
        if (!store.indexNames.contains('by-supplier')) store.createIndex('by-supplier', 'supplierId');
      }

      if (!db.objectStoreNames.contains('transfers')) {
        const store = db.createObjectStore('transfers', { keyPath: 'id' });
        store.createIndex('by-number', 'transferNumber');
        store.createIndex('by-date', 'cachedAt');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('transfers');
        if (!store.indexNames.contains('by-number')) store.createIndex('by-number', 'transferNumber');
        if (!store.indexNames.contains('by-date')) store.createIndex('by-date', 'cachedAt');
      }

      if (!db.objectStoreNames.contains('adjustments')) {
        const store = db.createObjectStore('adjustments', { keyPath: 'id' });
        store.createIndex('by-number', 'adjustmentNumber');
        store.createIndex('by-date', 'cachedAt');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('adjustments');
        if (!store.indexNames.contains('by-number')) store.createIndex('by-number', 'adjustmentNumber');
        if (!store.indexNames.contains('by-date')) store.createIndex('by-date', 'cachedAt');
      }

  if (!db.objectStoreNames.contains('movements')) {
    const store = db.createObjectStore('movements', { keyPath: 'id' });
    store.createIndex('by-date', 'cachedAt');
  }

  if (!db.objectStoreNames.contains('returns')) {
    const store = db.createObjectStore('returns', { keyPath: 'id' });
    store.createIndex('by-number', 'returnNumber');
    store.createIndex('by-date', 'cachedAt');
  }

      if (!db.objectStoreNames.contains('customerDebts')) {
        const store = db.createObjectStore('customerDebts', { keyPath: 'id' });
        store.createIndex('by-customer', 'customerId');
        store.createIndex('by-status', 'status');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('customerDebts');
        if (!store.indexNames.contains('by-customer')) store.createIndex('by-customer', 'customerId');
        if (!store.indexNames.contains('by-status')) store.createIndex('by-status', 'status');
      }

      if (!db.objectStoreNames.contains('notifications')) {
        const store = db.createObjectStore('notifications', { keyPath: 'id' });
        store.createIndex('by-date', 'cachedAt');
        store.createIndex('by-read', 'read');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('notifications');
        if (!store.indexNames.contains('by-date')) store.createIndex('by-date', 'cachedAt');
        if (!store.indexNames.contains('by-read')) store.createIndex('by-read', 'read');
      }

      if (!db.objectStoreNames.contains('deadLetter')) {
        const store = db.createObjectStore('deadLetter', { keyPath: 'operationId' });
        store.createIndex('by-rejectedAt', 'rejectedAt');
        store.createIndex('by-userNotified', 'userNotified');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('deadLetter');
        if (!store.indexNames.contains('by-rejectedAt')) store.createIndex('by-rejectedAt', 'rejectedAt');
        if (!store.indexNames.contains('by-userNotified')) store.createIndex('by-userNotified', 'userNotified');
      }

      if (!db.objectStoreNames.contains('imageCache')) {
        const store = db.createObjectStore('imageCache', { keyPath: 'relativePath' });
        store.createIndex('by-lastAccessed', 'lastAccessed');
      } else if (oldVersion < 3) {
        const store = transaction.objectStore('imageCache');
        if (!store.indexNames.contains('by-lastAccessed')) store.createIndex('by-lastAccessed', 'lastAccessed');
      }
    },
    blocked() {
      dbInstance?.close();
      dbInstance = null;
    },
  });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('IndexedDB open timed out')), DB_OPEN_TIMEOUT),
  );

  dbInstance = await Promise.race([openPromise, timeout]);
  return dbInstance;
}

export function isPersistenceReady(): boolean {
  return dbReady;
}

export async function initPersistence(): Promise<void> {
  dbReady = true;
  try {
    await requestPersistentStorage();
    const db = await getDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = db.transaction(['outbox', 'syncMeta', 'products'] as any, 'readonly');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outboxStore = tx.objectStore('outbox' as any) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const syncMetaStore = tx.objectStore('syncMeta' as any) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsStore = tx.objectStore('products' as any) as any;
    await Promise.all([
      outboxStore.count(),
      syncMetaStore.count(),
      productsStore.count(),
    ]);
    await tx.done;
  } catch (error) {
    console.error('IndexedDB integrity check failed, recreating:', error);
    await destroyPersistence();
    dbReady = true;
    await getDB();
  }
}

export async function destroyPersistence(): Promise<void> {
  try {
    dbInstance?.close();
    dbInstance = null;
    dbReady = false;
    await deleteDB(DB_NAME, {
      blocked() {
        dbInstance?.close();
        dbInstance = null;
      },
    });
  } catch (error) {
    console.error('Failed to delete IndexedDB:', error);
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('inventory-')).map((k) => caches.delete(k)),
      );
    }
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }

  try {
    const keysToKeep = ['sidebar-collapsed'];
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }

  try {
    document.cookie = 'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } catch {
    // Cookie cleanup is best-effort
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && 'persist' in navigator.storage) {
    return await navigator.storage.persist();
  }
  return false;
}

export async function checkStorageQuota(): Promise<{ usage: number; quota: number; percentUsed: number } | null> {
  if (navigator.storage && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      usage,
      quota,
      percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }
  return null;
}

export async function cleanupStaleData(): Promise<void> {
  const db = await getDB();
  const now = Date.now();

  const deleteWhere = async (
    storeName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    predicate: (v: any) => boolean,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = db.transaction(storeName as any, 'readwrite');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objectStore = tx.objectStore(storeName as any) as any;
    let cursor = await objectStore.openCursor();
    while (cursor) {
      if (predicate(cursor.value)) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    await tx.done;
  };

  await deleteWhere('deadLetter', (v) => now - v.rejectedAt > RETENTION.DEAD_LETTER);
  await deleteWhere('notifications', (v) => now - v.cachedAt > RETENTION.NOTIFICATION);
  await deleteWhere('sales', (v) => now - v.cachedAt > RETENTION.SALES);
  await deleteWhere('outbox', (v) => v.status === 'rejected' && now - v.createdAt > RETENTION.REJECTED_OUTBOX);
}

export async function canAddToOutbox(): Promise<boolean> {
  const count = await getOutboxCount();
  return count < MAX_OUTBOX_ENTRIES;
}

export async function getOutboxCount(): Promise<number> {
  if (!dbReady) return 0;
  try {
    const db = await getDB();
    return await db.count('outbox');
  } catch {
    return 0;
  }
}

export async function getStoreCursor(store: string): Promise<number> {
  try {
    const db = await getDB();
    const meta = await db.get('syncMeta', `cursor_${store}`);
    return (meta?.value as number) ?? 0;
  } catch {
    return 0;
  }
}

export async function setStoreCursor(store: string, cursor: number): Promise<void> {
  const db = await getDB();
  await db.put('syncMeta', { key: `cursor_${store}`, value: cursor });
}

export async function getSyncMeta(key: string): Promise<unknown> {
  const db = await getDB();
  const meta = await db.get('syncMeta', key);
  return meta?.value;
}

export async function setSyncMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('syncMeta', { key, value });
}

export async function cacheProducts(products: CachedProduct[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  for (const product of products) {
    await tx.objectStore('products').put(product);
  }
  await tx.done;
}

export async function getCachedProducts(): Promise<CachedProduct[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function getCachedProduct(id: string): Promise<CachedProduct | undefined> {
  const db = await getDB();
  return db.get('products', id);
}

export async function getCachedProductList(): Promise<CachedProduct[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function getCachedCount(store: string): Promise<number> {
  if (!dbReady) return 0;
  try {
    const db = await getDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (db as any).count(store);
  } catch {
    return 0;
  }
}

export async function cacheStoreData(store: string, data: Record<string, unknown>[]): Promise<void> {
  const db = await getDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = db.transaction(store as any, 'readwrite');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectStore = tx.objectStore(store as any) as any;
  for (const item of data) {
    await objectStore.put(item);
  }
  await tx.done;
}

export function isStale(cachedAt: number, maxAgeMs: number): boolean {
  return Date.now() - cachedAt > maxAgeMs;
}

export async function getCachedCategories(): Promise<CachedCategory[]> {
  const db = await getDB();
  return db.getAll('categories');
}

export async function getCachedCustomerDebts(): Promise<CachedCustomerDebt[]> {
  const db = await getDB();
  return db.getAll('customerDebts');
}

export async function cacheCustomerDebt(debt: CachedCustomerDebt): Promise<void> {
  const db = await getDB();
  await db.put('customerDebts', debt);
}

export async function getCachedCurrencies(): Promise<CachedCurrency[]> {
  const db = await getDB();
  return db.getAll('currencies');
}

export async function cacheCurrencies(currencies: CachedCurrency[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('currencies', 'readwrite');
  for (const currency of currencies) {
    await tx.objectStore('currencies').put(currency);
  }
  await tx.done;
}

export async function getCachedExchangeRates(): Promise<CachedExchangeRate[]> {
  const db = await getDB();
  return db.getAll('exchangeRates');
}

export async function cacheExchangeRates(rates: CachedExchangeRate[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('exchangeRates', 'readwrite');
  for (const rate of rates) {
    await tx.objectStore('exchangeRates').put(rate);
  }
  await tx.done;
}

export async function getCachedStockBalances(): Promise<CachedStockBalance[]> {
  const db = await getDB();
  return db.getAll('stockBalances');
}

export async function cacheStockBalances(balances: CachedStockBalance[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('stockBalances', 'readwrite');
  for (const balance of balances) {
    await tx.objectStore('stockBalances').put(balance);
  }
  await tx.done;
}

export async function getCachedSales(): Promise<CachedSale[]> {
  const db = await getDB();
  return db.getAll('sales');
}

export async function cacheSales(sales: CachedSale[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('sales', 'readwrite');
  for (const sale of sales) {
    await tx.objectStore('sales').put(sale);
  }
  await tx.done;
}

export async function getCachedPurchases(): Promise<CachedPurchase[]> {
  const db = await getDB();
  return db.getAll('purchases');
}

export async function cachePurchases(purchases: CachedPurchase[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('purchases', 'readwrite');
  for (const purchase of purchases) {
    await tx.objectStore('purchases').put(purchase);
  }
  await tx.done;
}

export async function getCachedTransfers(): Promise<CachedTransfer[]> {
  const db = await getDB();
  return db.getAll('transfers');
}

export async function cacheTransfers(transfers: CachedTransfer[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('transfers', 'readwrite');
  for (const transfer of transfers) {
    await tx.objectStore('transfers').put(transfer);
  }
  await tx.done;
}

export async function getCachedAdjustments(): Promise<CachedAdjustment[]> {
  const db = await getDB();
  return db.getAll('adjustments');
}

export async function cacheAdjustments(adjustments: CachedAdjustment[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('adjustments', 'readwrite');
  for (const adjustment of adjustments) {
    await tx.objectStore('adjustments').put(adjustment);
  }
  await tx.done;
}

export async function getCachedReturns(): Promise<CachedReturn[]> {
  const db = await getDB();
  return db.getAll('returns');
}

export async function cacheReturns(returns: CachedReturn[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('returns', 'readwrite');
  for (const ret of returns) {
    await tx.objectStore('returns').put(ret);
  }
  await tx.done;
}

export async function getCachedMovements(): Promise<CachedMovement[]> {
  const db = await getDB();
  return db.getAll('movements');
}

export async function cacheMovements(movements: CachedMovement[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('movements', 'readwrite');
  for (const movement of movements) {
    await tx.objectStore('movements').put(movement);
  }
  await tx.done;
}

export { MAX_OUTBOX_ENTRIES, BACKOFF_DELAYS };
