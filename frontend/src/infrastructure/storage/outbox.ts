import {
  getDB,
  canAddToOutbox,
  BACKOFF_DELAYS,
  type OutboxEntry,
  type DeadLetterEntry,
} from './db';

export class OfflineQueueFullError extends Error {
  constructor(message = 'La cola de operaciones offline está llena. Sincronice los cambios pendientes antes de agregar más.') {
    super(message);
    this.name = 'OfflineQueueFullError';
  }
}

export async function addToOutbox(entry: {
  operationId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
  maxRetries?: number;
  expiresAt?: number;
}): Promise<void> {
  const allowed = await canAddToOutbox();
  if (!allowed) {
    throw new Error('Límite de la cola offline alcanzado. Sincronice antes de agregar más.');
  }
  const db = await getDB();
  const outboxEntry: OutboxEntry = {
    operationId: entry.operationId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    payload: entry.payload,
    status: 'pending',
    retryCount: 0,
    maxRetries: entry.maxRetries ?? 5,
    nextRetryAt: Date.now(),
    expiresAt: entry.expiresAt ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
  };
  await db.add('outbox', outboxEntry);
}

export async function getPendingOutbox(): Promise<OutboxEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('outbox', 'by-created');
  const now = Date.now();
  return all.filter((e) => e.status === 'pending' && e.nextRetryAt <= now);
}

export async function removeFromOutbox(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('outbox', id);
}

export async function incrementRetry(id: number): Promise<void> {
  const db = await getDB();
  const entry = await db.get('outbox', id);
  if (!entry) return;
  const backoffIndex = Math.min(entry.retryCount, BACKOFF_DELAYS.length - 1);
  await db.put('outbox', {
    ...entry,
    retryCount: entry.retryCount + 1,
    nextRetryAt: Date.now() + BACKOFF_DELAYS[backoffIndex],
  });
}

export async function updateRetry(
  id: number,
  retryCount: number,
  nextRetryAt: number,
  lastError?: string,
): Promise<void> {
  const db = await getDB();
  const entry = await db.get('outbox', id);
  if (!entry) return;
  await db.put('outbox', {
    ...entry,
    retryCount,
    nextRetryAt,
    ...(lastError !== undefined ? { lastError } : {}),
  });
}

export async function markOutboxEntry(id: number, status: OutboxEntry['status']): Promise<void> {
  const db = await getDB();
  const entry = await db.get('outbox', id);
  if (!entry) return;
  await db.put('outbox', { ...entry, status });
}

export async function moveToDeadLetter(entry: OutboxEntry): Promise<void> {
  const db = await getDB();
  const deadEntry: DeadLetterEntry = {
    operationId: entry.operationId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    payload: entry.payload,
    error: entry.lastError ?? 'Error desconocido',
    retryCount: entry.retryCount,
    rejectedAt: Date.now(),
    userNotified: false,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = db.transaction(['deadLetter', 'outbox'] as any, 'readwrite');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deadStore = tx.objectStore('deadLetter' as any) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outboxStore = tx.objectStore('outbox' as any) as any;
  await deadStore.add(deadEntry);
  if (entry.id !== undefined) {
    await outboxStore.delete(entry.id);
  }
  await tx.done;
}

export async function retryDeadLetter(operationId: string): Promise<void> {
  const db = await getDB();
  const deadEntry = await db.get('deadLetter', operationId);
  if (!deadEntry) return;
  const outboxEntry: OutboxEntry = {
    operationId: deadEntry.operationId,
    entityType: deadEntry.entityType,
    entityId: deadEntry.entityId,
    action: deadEntry.action,
    payload: deadEntry.payload,
    status: 'pending',
    retryCount: 0,
    maxRetries: 5,
    nextRetryAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = db.transaction(['outbox', 'deadLetter'] as any, 'readwrite');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outboxStore = tx.objectStore('outbox' as any) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deadStore = tx.objectStore('deadLetter' as any) as any;
  await outboxStore.add(outboxEntry);
  await deadStore.delete(operationId);
  await tx.done;
}

export async function discardDeadLetter(operationId: string): Promise<void> {
  const db = await getDB();
  await db.delete('deadLetter', operationId);
}

export async function getOutboxCount(): Promise<number> {
  const db = await getDB();
  return db.count('outbox');
}

export async function getDeadLetters(): Promise<DeadLetterEntry[]> {
  const db = await getDB();
  return db.getAll('deadLetter');
}

export async function enqueueOrBlock(operation: {
  operationId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
}): Promise<void> {
  const canAdd = await canAddToOutbox();
  if (!canAdd) {
    throw new OfflineQueueFullError();
  }
  await addToOutbox(operation);
}
