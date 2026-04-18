import { getDB, canAddToOutbox, type OutboxEntry } from './db';

export async function addToOutbox(entry: Omit<OutboxEntry, 'id' | 'createdAt' | 'retries'>): Promise<void> {
  const allowed = await canAddToOutbox();
  if (!allowed) {
    throw new Error('Outbox limit reached. Sync pending changes before adding more.');
  }
  const db = await getDB();
  await db.add('outbox', { ...entry, createdAt: Date.now(), retries: 0 });
}

export async function getPendingOutbox(): Promise<OutboxEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('outbox', 'by-created');
}

export async function removeFromOutbox(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('outbox', id);
}

export async function incrementRetry(id: number): Promise<void> {
  const db = await getDB();
  const entry = await db.get('outbox', id);
  if (entry) {
    await db.put('outbox', { ...entry, retries: entry.retries + 1 });
  }
}
