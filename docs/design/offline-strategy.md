# Offline-First Strategy — Inventario

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Mobile/Desktop Browser (PWA)                       │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │ React UI │──│ Dexie.js │──│ Service Worker  │   │
│  │          │  │ IndexedDB│  │ (Workbox)       │   │
│  └──────────┘  └──────────┘  └─────────────────┘   │
│       │              │                              │
│       │         ┌────┴────┐                         │
│       │         │ Outbox  │  ← offline queue        │
│       │         └────┬────┘                         │
└───────┼──────────────┼──────────────────────────────┘
        │              │  (when online)
        ▼              ▼
┌───────────────────────────────┐
│  Next.js BFF (Route Handlers) │
│  - Auth cookie management     │
│  - Proxy to Spring Boot       │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│  Spring Boot WebFlux API      │
│  - Idempotency check          │
│  - Optimistic locking         │
│  - Sync log append            │
└───────────────────────────────┘
```

## 2. IndexedDB Schema (Dexie.js v4+)

### Tables

| Store | Keys | Purpose |
|-------|------|---------|
| `outbox` | `++id, operationId, entityType, status` | Pending operations queue |
| `syncState` | `key` | Last cursor, device ID, sync timestamps |
| `products` | `id, sku, barcode, categoryId, name` | Cached product catalog |
| `categories` | `id, parentId` | Cached category tree |
| `warehouses` | `id, code` | Cached warehouses |
| `stockBalances` | `[warehouseId+productId]` | Cached stock levels |
| `customers` | `id, name` | Cached customer list |
| `suppliers` | `id, name` | Cached supplier list |
| `currencies` | `code` | Cached currencies |
| `exchangeRates` | `id, [baseCode+quoteCode]` | Cached exchange rates |
| `imageCache` | `relativePath` | Cached thumbnail blobs (LRU, max 50 MiB) |

### Outbox Entry Schema

```typescript
interface OutboxEntry {
  id?: number;              // auto-increment
  operationId: string;      // UUID v4 (idempotency key)
  entityType: string;       // SALE, PURCHASE, TRANSFER, ADJUSTMENT, RETURN
  entityId: string;         // UUID of the entity
  action: string;           // CREATE, UPDATE, CANCEL
  payload: object;          // Full request body
  occurredAt: string;       // ISO timestamp
  expectedVersion?: number; // For optimistic locking
  status: 'pending' | 'syncing' | 'accepted' | 'rejected';
  retryCount: number;
  lastError?: string;
  createdAt: string;
}
```

## 3. Sync Flow

### 3.1 Push (Client → Server)

1. Client collects pending outbox entries (status = `pending`, ordered by `id` ASC).
2. Sends `POST /api/v1/sync/push` with batch (max 50 operations per request).
3. For each operation, server:
   a. Checks `idempotency_keys` table — if key exists and matches `request_hash`, return cached response.
   b. Executes the operation (create sale, create adjustment, etc.).
   c. On success: stores idempotency key + appends to `sync_log`.
   d. On conflict (version mismatch): rejects with `409 Conflict` details.
4. Response contains `acceptedOperationIds[]` and `rejected[]`.
5. Client marks accepted as `accepted`, rejected as `rejected` with error details.

### 3.2 Pull (Server → Client)

1. Client reads last cursor from `syncState` store (default: `0`).
2. Sends `GET /api/v1/sync/pull?cursor={lastCursor}&limit=100&warehouseId={id}`.
3. Server returns `sync_log` entries where `id > cursor`, ordered ASC, limited.
4. Client applies each change to local IndexedDB stores.
5. Client saves `newCursor` from response.
6. Repeats until response returns fewer entries than `limit`.

### 3.3 Sync Cycle

```
On connectivity detected:
  1. Push all pending outbox entries
  2. Handle rejections (surface to user)
  3. Pull changes since last cursor
  4. Update local stores
  5. Update sync state (lastSyncAt, cursor)
```

## 4. Conflict Resolution

- **Strategy**: Server-authoritative + optimistic locking.
- Client sends `expectedVersion` with each mutation operation.
- Server checks version match:
  - If match → operation succeeds, version increments.
  - If mismatch → `409 Conflict` with current server state.
- Client shows conflict to user with server state and lets them retry.

## 5. Service Worker (Workbox)

### Caching Strategies

| Route Pattern | Strategy | Notes |
|---------------|----------|-------|
| App shell (HTML/JS/CSS) | Cache-first | Pre-cached at install time |
| `/api/v1/products`, `/api/v1/categories` | Network-first, cache fallback | Stale-while-revalidate for catalog |
| `/api/v1/*/images/*?variant=thumb256` | Cache-first | LRU cache, max 50 MiB |
| `/api/v1/sync/*` | Network-only | Never cache sync endpoints |
| `/api/v1/auth/*` | Network-only | Never cache auth endpoints |
| Font files | Cache-first | Pre-cached at install |

### Offline Detection

```typescript
// Navigator API + periodic ping
const isOnline = (): boolean => {
  return navigator.onLine; // basic check
};

// Actual connectivity (ping BFF health endpoint)
const hasConnectivity = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
};
```

## 6. UI States

| State | Indicator | Behavior |
|-------|-----------|----------|
| **Online** | Green dot | Normal operation, sync in background |
| **Offline** | Red dot | Operations queued to outbox |
| **Syncing** | Animated spinner | Push/pull in progress |
| **Pending** | Badge count | Number of unsynced operations |
| **Conflict** | Warning icon | User attention needed |

### Sync Progress Bar (mandatory)

- Collapsible/hideable.
- Shows: pending count, syncing progress, last successful sync timestamp.
- Metrics: `{pending}/{total}` operations, estimated time remaining.
- Error count with expandable details.

## 7. Image Caching

- Only `thumb256` variants are cached in IndexedDB.
- LRU eviction when total size exceeds 50 MiB.
- Placeholder shown for missing thumbnails.
- Original images fetched on-demand (not cached locally).

## 8. LAN/Hotspot Deployment

```
Phone Hotspot (192.168.x.1)
     │
     ├── Server device: runs Docker (Caddy + Backend + Frontend + Postgres)
     │   └── Caddy: HTTPS on local IP with self-signed CA
     │
     └── Client devices: connect to hotspot WiFi
         └── Browser: https://192.168.x.Y → PWA installed
             └── Trust CA cert (one-time setup per device)
```

- Server accessible at `https://<server-ip>` on LAN.
- No internet required at runtime.
- All assets (JS, CSS, fonts, icons) served locally from Next.js/Caddy.
