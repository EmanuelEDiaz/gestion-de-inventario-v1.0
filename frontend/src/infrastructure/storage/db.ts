/**
 * IndexedDB Storage - PERSISTENCIA NO IMPLEMENTADA ACTUALMENTE
 * ==========================================================
 * 
 * Este módulo contiene la estructura para persistencia offline pero NO está activo.
 * Los repositorios no guardan ni leen de IndexedDB.
 * 
 * DOCUMENTACIÓN PARA IMPLEMENTACIÓN FUTURA:
 * 
 * 1. ENTIDADES A PERSISTIR (investigar):
 *    - Productos (maestros)
 *    - Categorías  
 *    - Almacenes
 *    - Proveedores
 *    - Clientes
 *    - Monedas/tasas
 *    - Ajustes de sistema
 * 
 * 2. OPERACIONES EN OUTBOX (investigar):
 *    - Creaciones (POST)
 *    - Actualizaciones (PUT)
 *    - Eliminaciones (DELETE)
 *    - Inventario (compras, ventas, ajustes, transferencias)
 * 
 * 3. REGLAS OBLIGATORIAS:
 *    - Login: SIEMPRE online, NO puede usar IndexedDB
 *    - Crear productos/entidades: SIEMPRE requiere conexión (investigar estrategia)
 *    - Consultas: try API -> fallback IndexedDB si offline
 * 
 * 4. ESTRATEGIA DE IMPLEMENTACIÓN (a futuro):
 *    a) Definir qué entidades tienen cache offline
 *    b) Modificar repositories para usar cache + outbox
 *    c) Implementar sync bidireccional
 *    d) Agregar UI de progreso/carga
 * 
 * ==========================================================
 * CÓDIGO COMENTADO - NO USAR HASTA IMPLEMENTACIÓN
 */

// import { openDB, deleteDB, type DBSchema, type IDBPDatabase } from 'idb';

// // ─── Safety limits to prevent disk exhaustion ───
// const MAX_OUTBOX_ENTRIES = 500;
// const DB_NAME = 'inventory-offline';
// const DB_VERSION = 1;
// const DB_OPEN_TIMEOUT = 5_000;

// export interface OutboxEntry {
//   id?: number;
//   idempotencyKey: string;
//   method: string;
//   url: string;
//   body: unknown;
//   createdAt: number;
//   retries: number;
// }

// export interface CachedProduct {
//   id: string;
//   name: string;
//   sku: string;
//   updatedAt: number;
// }

// interface InventoryDB extends DBSchema {
//   outbox: {
//     key: number;
//     value: OutboxEntry;
//     indexes: { 'by-created': number };
//   };
//   products: {
//     key: string;
//     value: CachedProduct;
//   };
//   syncMeta: {
//     key: string;
//     value: { key: string; value: unknown };
//   };
// }

// let dbInstance: IDBPDatabase<InventoryDB> | null = null;
// let dbReady = false;

// /**
//  * Opens the DB only if persistence has been initialized (post-login).
//  * Includes timeout to avoid hanging on corrupt IndexedDB.
//  */
// export async function getDB(): Promise<IDBPDatabase<InventoryDB>> {
//   if (!dbReady) {
//     throw new Error('Persistence not initialized. Call initPersistence() after login.');
//   }
//   if (dbInstance) return dbInstance;

//   const openPromise = openDB<InventoryDB>(DB_NAME, DB_VERSION, {
//     upgrade(db) {
//       if (!db.objectStoreNames.contains('outbox')) {
//         const outbox = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
//         outbox.createIndex('by-created', 'createdAt');
//       }
//       if (!db.objectStoreNames.contains('products')) {
//         db.createObjectStore('products', { keyPath: 'id' });
//       }
//       if (!db.objectStoreNames.contains('syncMeta')) {
//         db.createObjectStore('syncMeta', { keyPath: 'key' });
//       }
//     },
//     blocked() {
//       dbInstance?.close();
//       dbInstance = null;
//     },
//   });

//   // Timeout guard: abort if IndexedDB hangs (corrupt state)
//   const timeout = new Promise<never>((_, reject) =>
//     setTimeout(() => reject(new Error('IndexedDB open timed out')), DB_OPEN_TIMEOUT),
//   );

//   dbInstance = await Promise.race([openPromise, timeout]);
//   return dbInstance;
// }

// export async function getSyncCursor(): Promise<number> {
//   const db = await getDB();
//   const meta = await db.get('syncMeta', 'cursor');
//   return (meta?.value as number) ?? 0;
// }

// export async function setSyncCursor(cursor: number): Promise<void> {
//   const db = await getDB();
//   await db.put('syncMeta', { key: 'cursor', value: cursor });
// }

// /**
//  * Returns current outbox count (for progress indicators).
//  * Returns 0 if persistence is not ready.
//  */
// export async function getOutboxCount(): Promise<number> {
//   if (!dbReady) return 0;
//   try {
//     const db = await getDB();
//     return await db.count('outbox');
//   } catch {
//     return 0;
//   }
// }

// /** Check if outbox is under the safety limit */
// export async function canAddToOutbox(): Promise<boolean> {
//   const count = await getOutboxCount();
//   return count < MAX_OUTBOX_ENTRIES;
// }

// // ─── Persistence lifecycle ───

// export function isPersistenceReady(): boolean {
//   return dbReady;
// }

// export async function initPersistence(): Promise<void> {
//   dbReady = true;
//   try {
//     const db = await getDB();
//     // Validate integrity: ensure stores are accessible
//     const tx = db.transaction(['outbox', 'products', 'syncMeta'], 'readonly');
//     await Promise.all([
//       tx.objectStore('outbox').count(),
//       tx.objectStore('products').count(),
//       tx.objectStore('syncMeta').count(),
//     ]);
//     await tx.done;
//   } catch (error) {
//     // DB is corrupt — wipe and recreate
//     console.error('IndexedDB integrity check failed, recreating:', error);
//     await destroyPersistence();
//     dbReady = true;
//     await getDB();
//   }
// }

// export async function destroyPersistence(): Promise<void> {
//   try {
//     dbInstance?.close();
//     dbInstance = null;
//     dbReady = false;
//     await deleteDB(DB_NAME, {
//       blocked() {
//         dbInstance?.close();
//         dbInstance = null;
//       },
//     });
//   } catch (error) {
//     console.error('Failed to delete IndexedDB:', error);
//   }

//   // Clear SW caches (all inventory-* caches)
//   try {
//     if ('caches' in window) {
//       const keys = await caches.keys();
//       await Promise.all(
//         keys.filter((k) => k.startsWith('inventory-')).map((k) => caches.delete(k)),
//       );
//     }
//   } catch (error) {
//     console.error('Failed to clear caches:', error);
//   }

//   // Clear localStorage except UI preferences
//   try {
//     const keysToKeep = ['sidebar-collapsed'];
//     const allKeys = Object.keys(localStorage);
//     for (const key of allKeys) {
//       if (!keysToKeep.includes(key)) {
//         localStorage.removeItem(key);
//       }
//     }
//   } catch (error) {
//     console.error('Failed to clear localStorage:', error);
//   }

//   // Clear auth cookie
//   try {
//     document.cookie = 'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
//   } catch {
//     // Cookie cleanup is best-effort
//   }
// }

// export { MAX_OUTBOX_ENTRIES };

// exports dummy para no romper imports
export const MAX_OUTBOX_ENTRIES = 500;
export function isPersistenceReady(): boolean { return false; }
export async function getOutboxCount(): Promise<number> { return 0; }
export async function canAddToOutbox(): Promise<boolean> { return false; }
export async function initPersistence(): Promise<void> {
	// No-op: persistencia offline aun no implementada.
}
export async function destroyPersistence(): Promise<void> {
	// No-op: persistencia offline aun no implementada.
}