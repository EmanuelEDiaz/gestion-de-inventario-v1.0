import type { IDBPDatabase } from 'idb';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id?: number;
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: number;
  deviceId?: string;
}

let idbReady = false;

export function setIdbReady(ready: boolean): void {
  idbReady = ready;
}

const MAX_MEMORY = 500;
const MAX_IDB_ENTRIES = 5000;
const MAX_CONTEXT_SIZE = 10_240;
const FLUSH_INTERVAL_MS = 5000;
const IDB_LOG_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const isDev = process.env.NODE_ENV === 'development';

const buffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function safeSerialize(ctx: unknown): string | undefined {
  if (ctx === undefined) return undefined;
  try {
    const str = JSON.stringify(ctx);
    return str.length > MAX_CONTEXT_SIZE ? str.slice(0, MAX_CONTEXT_SIZE) + '...' : str;
  } catch {
    return String(ctx).slice(0, MAX_CONTEXT_SIZE);
  }
}

async function flushToIDB(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  if (!idbReady) return;
  try {
    const { openDB } = await import('idb');
    const db: IDBPDatabase<unknown> = await openDB('inventory-offline', 6);
    const tx = db.transaction('appLogs', 'readwrite');
    const batchStore = tx.objectStore('appLogs');
    for (const entry of batch) await batchStore.add(entry);
    await tx.done;

    const cutoff = Date.now() - IDB_LOG_TTL_MS;
    const indexTx = db.transaction('appLogs', 'readwrite');
    const idxStore = indexTx.objectStore('appLogs');
    const idxIndex = idxStore.index('by-timestamp');
    let idxCursor = await idxIndex.openCursor(IDBKeyRange.upperBound(cutoff));
    while (idxCursor) {
      idxCursor.delete();
      idxCursor = await idxCursor.continue();
    }
    await indexTx.done;

    const remaining = await db.count('appLogs');
    if (remaining > MAX_IDB_ENTRIES) {
      const toDelete = remaining - MAX_IDB_ENTRIES;
      let deleted = 0;
      const oldestTx = db.transaction('appLogs', 'readwrite');
      const oldestStore = oldestTx.objectStore('appLogs');
      const oldestIdx = oldestStore.index('by-timestamp');
      let oldestCursor = await oldestIdx.openCursor();
      while (oldestCursor && deleted < toDelete) {
        oldestCursor.delete();
        deleted++;
        oldestCursor = await oldestCursor.continue();
      }
      await oldestTx.done;
    }
  } catch {
    /* silent */
  }
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  if (buffer.length >= 50) {
    flushToIDB();
    return;
  }
  flushTimer = setTimeout(() => flushToIDB(), FLUSH_INTERVAL_MS);
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('app-device-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('app-device-id', id);
  }
  return id;
}

function log(level: LogLevel, message: string, errOrContext?: unknown, ctx?: Record<string, unknown>) {
  let finalContext: Record<string, unknown> | undefined;
  if (errOrContext instanceof Error) {
    finalContext = {
      ...ctx,
      errorName: errOrContext.name,
      errorMessage: errOrContext.message,
      stack: errOrContext.stack,
    };
  } else if (errOrContext !== undefined) {
    finalContext = { ...(errOrContext as Record<string, unknown>), ...ctx };
  } else if (ctx !== undefined) {
    finalContext = ctx;
  }
  const entry: LogEntry = {
    level,
    message,
    context: safeSerialize(finalContext),
    timestamp: Date.now(),
    deviceId: getDeviceId(),
  };
  buffer.push(entry);
  if (buffer.length > MAX_MEMORY) buffer.shift();
  if (isDev) console[level](`[${level.toUpperCase()}] ${message}`, finalContext ?? '');
  scheduleFlush();
}

export const appLogger = {
  debug: (msg: string, ctx?: unknown) => log('debug', msg, ctx),
  info: (msg: string, ctx?: unknown) => log('info', msg, ctx),
  warn: (msg: string, ctx?: unknown) => log('warn', msg, ctx),
  error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => log('error', msg, err, ctx),
  getLogs: () => [...buffer],
  clearLogs: () => { buffer.length = 0; },
  flush: flushToIDB,
};
