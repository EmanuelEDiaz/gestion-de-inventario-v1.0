import { openDB, deleteDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Product } from '@/core/product/entities/product';
import type { CorruptionEntry } from '@/core/loading/types/corruption';

const MAX_OUTBOX_ENTRIES = 500;
export const DB_NAME = 'inventory-offline';
export const DB_VERSION = 8;
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
  priority: number;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number;
  expiresAt: number;
  lastError?: string;
  createdAt: number;
  skip?: boolean;
  isTempId?: boolean;
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

export type CachedProduct = Product & {
  cachedAt?: number;
  currencyCode?: string;
  version?: number;
};

export interface CachedCategory {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  level: number;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  cachedAt?: number;
}

export interface CachedWarehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  active: boolean;
  version?: number;
  createdAt: string;
  updatedAt: string;
  cachedAt?: number;
}

export interface CachedStockBalance {
  id: string;
  warehouseId: string;
  productId: string;
  warehouseName?: string;
  productName?: string;
  productSku?: string;
  onHand: number;
  reserved?: number;
  available?: number;
  avgCost?: number | null;
  totalValue?: number | null;
  updatedAt?: string;
  cachedAt?: number;
}

export interface CachedCustomer {
  id: string;
  code: string | null;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  province: string | null;
  municipality: string | null;
  street: string | null;
  locality: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  cachedAt?: number;
  nameLower?: string;
}

export interface CachedSupplier {
  id: string;
  code: string | null;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  website: string | null;
  province: string | null;
  municipality: string | null;
  street: string | null;
  locality: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  cachedAt?: number;
}

export interface CachedCurrency {
  code: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
  cachedAt?: number;
}

export interface CachedExchangeRate {
  id: string;
  baseCode: string;
  quoteCode: string;
  rate: number;
  rateType: string;
  validFrom: string;
  createdBy: string | null;
  createdAt: string;
  cachedAt?: number;
}

export interface CachedSale {
  id: string;
  saleNumber: string;
  total: number;
  customerId: string;
  paymentMode: string;
  status: string;
  cachedAt?: number;
}

export interface CachedPurchase {
  id: string;
  purchaseNumber: string;
  total: number;
  supplierId: string;
  status: string;
  cachedAt?: number;
}

export interface CachedTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: string;
  cachedAt?: number;
}

export interface CachedAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  type: string;
  cachedAt?: number;
}

export interface CachedReturn {
  id: string;
  returnNumber: string;
  total: number;
  customerId: string;
  type: string;
  cachedAt?: number;
}

export interface CachedMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  reference: string;
  cachedAt?: number;
}

export interface CachedCustomerDebt {
  id: string;
  customerId: string;
  saleId: string;
  originalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  currencyCode: string;
  status: string;
  description: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cachedAt?: number;
}

export interface CachedNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  cachedAt?: number;
}

interface InventoryDB extends DBSchema {
  outbox: {
    key: number;
    value: OutboxEntry;
    indexes: {
      'by-status': string;
      'by-created': number;
      'by-status-priority': [string, number];
      'by-priority': number;
    };
  };
  syncMeta: {
    key: string;
    value: { key: string; value: unknown };
  };
  products: {
    key: string;
    value: CachedProduct;
    indexes: {
      'by-sku': string;
      'by-barcode': string;
      'by-category': string;
      'by-category-status': [string, string];
    };
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
    indexes: {
      'by-warehouse': string;
      'by-product': string;
      'by-warehouse-product': [string, string];
    };
  };
  customers: {
    key: string;
    value: CachedCustomer;
    indexes: { 'by-code': string; 'by-name': string; 'by-name-lower': string };
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
    indexes: {
      'by-number': string;
      'by-date': number;
      'by-customer': string;
      'by-status-date': [string, string];
      'by-customer-status': [string, string];
      'by-sale-date': string;
    };
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
    indexes: {
      'by-date': number;
      'by-occurred-at': string;
    };
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
  corruptionQueue: {
    key: number;
    value: import('@/core/loading/types/corruption').CorruptionEntry;
    indexes: { 'by-entity-type': string; 'by-status': string };
  };
  downloadChunks: {
    key: string;
    value: import('@/core/loading/types/download-chunk').DownloadChunk;
    indexes: { 'by-entity': string; 'by-status': string };
  };
  appLogs: {
    key: number;
    value: import('@/infrastructure/logging/appLogger').LogEntry;
    indexes: { 'by-level': string; 'by-timestamp': number };
  };
  /** @deprecated replaced by imageIndex in v5 - kept for migration */
  imageCache: {
    key: string;
    value: { relativePath: string; blob: Blob; size: number; cachedAt: number; lastAccessed: number };
    indexes: { 'by-lastAccessed': number };
  };
  imageIndex: {
    key: string;
    value: {
      key: string;
      entityType: string;
      entityId: string;
      imageId: string;
      size: 'thumbnail' | 'preview' | 'full';
      opfsPath: string;
      contentType: string;
      sizeBytes: number;
      cachedAt: number;
      lastAccessedAt: number;
      checksum: string;
    };
    indexes: {
      'by-entity': [string, string];
      'by-last-access': number;
      'by-size': number;
    };
  };
  geoIndex: {
    key: string;
    value: {
      id: string;
      type: string;
      normalizedName: string;
      parentIds: string[];
    };
    indexes: {
      'by-type': string;
      'by-name': string;
      'by-parent': string[];
    };
  };
  mapMarkers: {
    key: string;
    value: {
      id: string;
      userId: string;
      entityType?: string;
      entityId?: string;
      lat: number;
      lng: number;
    };
    indexes: {
      'by-user': string;
      'by-entity': [string, string];
      'by-coords': [number, number];
    };
  };
  mapAnnotations: {
    key: string;
    value: {
      id: string;
      userId: string;
    };
    indexes: { 'by-user': string };
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
    async upgrade(db, oldVersion, newVersion, transaction) {
      // v1 stores
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

      if (oldVersion < 7) {
        if (db.objectStoreNames.contains('currencies')) {
          db.deleteObjectStore('currencies');
        }
      }

      if (!db.objectStoreNames.contains('currencies')) {
        db.createObjectStore('currencies', { keyPath: 'code' });
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

      // v4→v5 migration
      if (oldVersion < 5) {
        const stockStore = transaction.objectStore('stockBalances');
        if (!stockStore.indexNames.contains('by-warehouse-product')) {
          stockStore.createIndex('by-warehouse-product', ['warehouseId', 'productId'], { unique: true });
        }

        const prodStore = transaction.objectStore('products');
        if (!prodStore.indexNames.contains('by-category-status')) {
          prodStore.createIndex('by-category-status', ['categoryId', 'status'], { unique: false });
        }

        const salesStore = transaction.objectStore('sales');
        if (!salesStore.indexNames.contains('by-status-date')) {
          salesStore.createIndex('by-status-date', ['status', 'saleDate'], { unique: false });
        }
        if (!salesStore.indexNames.contains('by-customer-status')) {
          salesStore.createIndex('by-customer-status', ['customerId', 'status'], { unique: false });
        }

        const custStore = transaction.objectStore('customers');
        if (!custStore.indexNames.contains('by-name-lower')) {
          custStore.createIndex('by-name-lower', 'nameLower', { unique: false });
        }

        const cqStore = db.createObjectStore('corruptionQueue', { keyPath: 'id', autoIncrement: true });
        cqStore.createIndex('by-entity-type', 'entityType', { unique: false });
        cqStore.createIndex('by-status', 'status', { unique: false });

        const dcStore = db.createObjectStore('downloadChunks', { keyPath: 'chunkKey' });
        dcStore.createIndex('by-entity', 'entityType', { unique: false });
        dcStore.createIndex('by-status', 'status', { unique: false });

        const logStore = db.createObjectStore('appLogs', { keyPath: 'id', autoIncrement: true });
        logStore.createIndex('by-level', 'level', { unique: false });
        logStore.createIndex('by-timestamp', 'timestamp', { unique: false });

        const imgStore = db.createObjectStore('imageIndex', { keyPath: 'key' });
        imgStore.createIndex('by-entity', ['entityType', 'entityId'], { unique: false });
        imgStore.createIndex('by-last-access', 'lastAccessedAt', { unique: false });
        imgStore.createIndex('by-size', 'sizeBytes', { unique: false });

        const markersStore = db.createObjectStore('mapMarkers', { keyPath: 'id' });
        markersStore.createIndex('by-user', 'userId', { unique: false });
        markersStore.createIndex('by-entity', ['entityType', 'entityId'], { unique: false });
        markersStore.createIndex('by-coords', ['lat', 'lng'], { unique: false });

        const annotStore = db.createObjectStore('mapAnnotations', { keyPath: 'id' });
        annotStore.createIndex('by-user', 'userId', { unique: false });

        if (!salesStore.indexNames.contains('by-sale-date')) {
          salesStore.createIndex('by-sale-date', 'saleDate', { unique: false });
        }

        const movStore = transaction.objectStore('movements');
        if (!movStore.indexNames.contains('by-occurred-at')) {
          movStore.createIndex('by-occurred-at', 'occurredAt', { unique: false });
        }

        const geoStore = db.createObjectStore('geoIndex', { keyPath: 'id' });
        geoStore.createIndex('by-type', 'type', { unique: false });
        geoStore.createIndex('by-name', 'normalizedName', { unique: false });
        geoStore.createIndex('by-parent', 'parentIds', { unique: false, multiEntry: true });

        const outboxStore = transaction.objectStore('outbox');
        if (!outboxStore.indexNames.contains('by-status-priority')) {
          outboxStore.createIndex('by-status-priority', ['status', 'priority'], { unique: false });
        }
        if (!outboxStore.indexNames.contains('by-priority')) {
          outboxStore.createIndex('by-priority', 'priority', { unique: false });
        }
      }

      // v5→v6 migration: idempotently ensure corruptionQueue and downloadChunks
      // stores exist with the exact shape Phase B depends on. The v4→v5 block
      // already creates them for fresh installs, but pre-B.1 users that
      // somehow ran the v5 upgrade without the corruption/download stores need
      // this safety net (FIX-001).
      if (oldVersion < 6) {
        if (!db.objectStoreNames.contains('corruptionQueue')) {
          const cqStore = db.createObjectStore('corruptionQueue', { keyPath: 'id', autoIncrement: true });
          cqStore.createIndex('by-entity-type', 'entityType', { unique: false });
          cqStore.createIndex('by-status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains('downloadChunks')) {
          const dcStore = db.createObjectStore('downloadChunks', { keyPath: 'chunkKey' });
          dcStore.createIndex('by-entity', 'entityType', { unique: false });
          dcStore.createIndex('by-status', 'status', { unique: false });
        }
      }

      // v7→v8 migration: add retryCount to existing corruptionQueue entries
      if (oldVersion < 8) {
        const cqStore = transaction.objectStore('corruptionQueue');
        const all = await cqStore.getAll();
        for (const entry of all) {
          if ((entry as CorruptionEntry & { retryCount?: number }).retryCount === undefined) {
            cqStore.put({ ...entry, retryCount: 0 });
          }
        }
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
    import('@/infrastructure/logging/appLogger').then(m =>
      m.appLogger.error('IndexedDB integrity check failed, recreating', error)
    );
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
    import('@/infrastructure/logging/appLogger').then(m =>
      m.appLogger.error('Failed to delete IndexedDB', error)
    );
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('inventory-')).map((k) => caches.delete(k)),
      );
    }
  } catch (error) {
    import('@/infrastructure/logging/appLogger').then(m =>
      m.appLogger.error('Failed to clear caches', error)
    );
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
    import('@/infrastructure/logging/appLogger').then(m =>
      m.appLogger.error('Failed to clear localStorage', error)
    );
  }

  try {
    document.cookie = 'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } catch {
    // Cookie cleanup is best-effort
  }
}

/**
 * Helper: ejecuta una escritura en caché local de forma tolerante a fallos.
 * El caché es una optimización (P5: la fuente de verdad es el servidor para
 * escrituras exitosas); un fallo de IDB no debe revertir la operación del usuario.
 * Se loguea como warn para diagnóstico sin interrumpir el flujo.
 */
export async function safeCacheWrite(
  operation: () => Promise<unknown>,
  context: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    const { appLogger } = await import('@/infrastructure/logging/appLogger');
    appLogger.warn(`Cache write-back failed: ${context}`, error);
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

export async function cacheProducts(products: Product[]): Promise<void> {
  const now = Date.now();
  const items = products.map((p) => ({ ...p, cachedAt: now } satisfies CachedProduct)) as unknown as Record<string, unknown>[];
  await batchPut('products', items);
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

export async function batchPut(store: string, items: Record<string, unknown>[], batchSize = 500): Promise<void> {
  const db = await getDB();
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = db.transaction(store as any, 'readwrite', { durability: 'relaxed' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objectStore = tx.objectStore(store as any) as any;
    const keyPath = objectStore.keyPath as string | null;
    for (const item of batch) {
      const key = keyPath ? item[keyPath] : undefined;
      if (key != null) {
        objectStore.put(item);
      }
    }
    await tx.done;
  }
}

export async function cacheStoreData(store: string, data: Record<string, unknown>[]): Promise<void> {
  await batchPut(store, data);
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
  await batchPut('currencies', currencies as unknown as Record<string, unknown>[]);
}

export async function getCachedExchangeRates(): Promise<CachedExchangeRate[]> {
  const db = await getDB();
  return db.getAll('exchangeRates');
}

export async function cacheExchangeRates(rates: CachedExchangeRate[]): Promise<void> {
  await batchPut('exchangeRates', rates as unknown as Record<string, unknown>[]);
}

export async function getCachedStockBalances(): Promise<CachedStockBalance[]> {
  const db = await getDB();
  return db.getAll('stockBalances');
}

export async function cacheStockBalances(balances: CachedStockBalance[]): Promise<void> {
  await batchPut('stockBalances', balances as unknown as Record<string, unknown>[]);
}

export async function getCachedSales(): Promise<CachedSale[]> {
  const db = await getDB();
  return db.getAll('sales');
}

export async function cacheSales(sales: CachedSale[]): Promise<void> {
  await batchPut('sales', sales as unknown as Record<string, unknown>[]);
}

export async function getCachedPurchases(): Promise<CachedPurchase[]> {
  const db = await getDB();
  return db.getAll('purchases');
}

export async function cachePurchases(purchases: CachedPurchase[]): Promise<void> {
  await batchPut('purchases', purchases as unknown as Record<string, unknown>[]);
}

export async function getCachedTransfers(): Promise<CachedTransfer[]> {
  const db = await getDB();
  return db.getAll('transfers');
}

export async function cacheTransfers(transfers: CachedTransfer[]): Promise<void> {
  await batchPut('transfers', transfers as unknown as Record<string, unknown>[]);
}

export async function getCachedAdjustments(): Promise<CachedAdjustment[]> {
  const db = await getDB();
  return db.getAll('adjustments');
}

export async function cacheAdjustments(adjustments: CachedAdjustment[]): Promise<void> {
  await batchPut('adjustments', adjustments as unknown as Record<string, unknown>[]);
}

export async function getCachedReturns(): Promise<CachedReturn[]> {
  const db = await getDB();
  return db.getAll('returns');
}

export async function cacheReturns(returns: CachedReturn[]): Promise<void> {
  await batchPut('returns', returns as unknown as Record<string, unknown>[]);
}

export async function getCachedMovements(): Promise<CachedMovement[]> {
  const db = await getDB();
  return db.getAll('movements');
}

export async function cacheMovements(movements: CachedMovement[]): Promise<void> {
  await batchPut('movements', movements as unknown as Record<string, unknown>[]);
}

export { MAX_OUTBOX_ENTRIES, BACKOFF_DELAYS };
