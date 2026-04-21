/**
 * Outbox Storage - PERSISTENCIA NO IMPLEMENTADA
 * ==========================================
 * 
 * Este módulo maneja la cola de operaciones para sync offline.
 * NO está activo actualmente - los repositories no lo usan.
 * 
 * DOCUMENTACIÓN PARA IMPLEMENTACIÓN FUTURA:
 * 
 * - Agregar operaciones cuando el usuario crea/actualiza/elimina entidades offline
 * - El SyncService procesará la cola cuando haya conexión
 * - Política de reintentos: máximo 5 intentos antes de marcar como fallido
 * 
 * ==========================================
 * CÓDIGO COMENTADO - NO USAR HASTA IMPLEMENTACIÓN
 */

// import { getDB, canAddToOutbox, type OutboxEntry } from './db';

// export async function addToOutbox(entry: Omit<OutboxEntry, 'id' | 'createdAt' | 'retries'>): Promise<void> {
//   const allowed = await canAddToOutbox();
//   if (!allowed) {
//     throw new Error('Outbox limit reached. Sync pending changes before adding more.');
//   }
//   const db = await getDB();
//   await db.add('outbox', { ...entry, createdAt: Date.now(), retries: 0 });
// }

// export async function getPendingOutbox(): Promise<OutboxEntry[]> {
//   const db = await getDB();
//   return db.getAllFromIndex('outbox', 'by-created');
// }

// export async function removeFromOutbox(id: number): Promise<void> {
//   const db = await getDB();
//   await db.delete('outbox', id);
// }

// export async function incrementRetry(id: number): Promise<void> {
//   const db = await getDB();
//   const entry = await db.get('outbox', id);
//   if (entry) {
//     await db.put('outbox', { ...entry, retries: entry.retries + 1 });
//   }
// }

// Exports dummy
export async function addToOutbox(_entry: unknown): Promise<void> {
  console.warn('[OUTBOX] No implementado: persistencia offline noActive');
  throw new Error('Outbox no implementado');
}
export async function getPendingOutbox(): Promise<unknown[]> { return []; }
export async function removeFromOutbox(_id: number): Promise<void> { }
export async function incrementRetry(_id: number): Promise<void> { }