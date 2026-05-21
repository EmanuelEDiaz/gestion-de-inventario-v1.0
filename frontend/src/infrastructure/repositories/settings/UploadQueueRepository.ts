import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { IUploadQueueRepository } from '@/core/settings/ports/IUploadQueueRepository';
import type {
  UploadQueueEntry,
  CreateUploadQueueEntryData,
  UploadQueueStatus,
} from '@/core/settings/entities/upload-queue-entry';

const DB_NAME = 'inventory-upload-queue';
const DB_VERSION = 1;
const STORE = 'uploadQueue' as const;

interface UploadQueueDB extends DBSchema {
  uploadQueue: {
    key: number;
    value: UploadQueueEntry;
    indexes: {
      'by-status': UploadQueueStatus;
      'by-entity': [string, string]; // [entityType, entityId]
    };
  };
}

async function getDB(): Promise<IDBPDatabase<UploadQueueDB>> {
  return openDB<UploadQueueDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-status', 'status');
        store.createIndex('by-entity', ['entityType', 'entityId']);
      }
    },
  });
}

export class UploadQueueRepository implements IUploadQueueRepository {
  async enqueue(data: CreateUploadQueueEntryData): Promise<UploadQueueEntry> {
    const db = await getDB();
    const entry: UploadQueueEntry = {
      ...data,
      checksumSha256: null,
      status: 'PENDING',
      retryCount: 0,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };
    const id = await db.add(STORE, entry);
    return { ...entry, id: id as number };
  }

  async findByStatus(status: UploadQueueStatus): Promise<UploadQueueEntry[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORE, 'by-status', status);
  }

  async findByEntity(entityType: string, entityId: string): Promise<UploadQueueEntry[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORE, 'by-entity', [entityType, entityId]);
  }

  async updateStatus(
    id: number,
    status: UploadQueueStatus,
    errorMessage?: string,
  ): Promise<void> {
    const db = await getDB();
    const entry = await db.get(STORE, id);
    if (!entry) return;
    await db.put(STORE, { ...entry, status, errorMessage: errorMessage ?? null });
  }

  async incrementRetry(id: number): Promise<void> {
    const db = await getDB();
    const entry = await db.get(STORE, id);
    if (!entry) return;
    await db.put(STORE, { ...entry, retryCount: entry.retryCount + 1 });
  }

  async remove(id: number): Promise<void> {
    const db = await getDB();
    await db.delete(STORE, id);
  }

  async clearCompleted(): Promise<void> {
    const db = await getDB();
    const completed = await db.getAllFromIndex(STORE, 'by-status', 'DONE');
    const tx = db.transaction(STORE, 'readwrite');
    await Promise.all([
      ...completed.map((e) => tx.store.delete(e.id!)),
      tx.done,
    ]);
  }
}
