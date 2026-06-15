# Estrategia Offline-First — Inventario

> **Fecha:** 2026-06-02
> **Propósito:** Documentar la arquitectura offline-first completa, el estado actual, las brechas, y el plan de implementación.
> **Stack:** Next.js 16 + React 19 + TypeScript + Spring Boot 3.4 (WebFlux) + PostgreSQL 17 + IndexedDB (idb) + Serwist

---

## 1. Filosofía Offline-First

La app está diseñada para funcionar **sin conexión a internet en todo momento** — no como "caída" del online, sino como *modo primario de operación*.

### Principios

| Principio | Implicación |
|-----------|-------------|
| **Read from cache, write through** | Toda lectura va a IndexedDB primero. Las escrituras van directo al backend si hay conexión, o al outbox si no. |
| **Server es source of truth eventual** | El servidor acepta escrituras cuando está disponible. Los conflictos se resuelven de forma optimista (server-authoritative + version locking). |
| **Sin CDNs ni APIs externas** | Cero dependencias externas en runtime. Assets en `/public`. |
| **No bloqueante** | La UI nunca se queda trabada esperando red. Muestra datos cacheados inmediatamente. |
| **Progreso visible siempre** | Cada fase de carga inicial tiene label + sub-step + barra de progreso real. |

---

## 2. Arquitectura General

```
┌────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (PWA)                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    REACT UI (TanStack Query)                  │    │
│  │  useQuery → readWithCache() → IDB │ API                     │    │
│  │  useMutation → writeWithOutbox() → API │ outbox              │    │
│  └────────────┬─────────────────────────────────────────────────┘    │
│               │                                                       │
│  ┌────────────▼─────────────────────────────────────────────────┐    │
│  │                   APPLICATION LAYER                           │    │
│  │                                                               │    │
│  │  useAppLoader()       useSyncStatus()      useNetworkHealth() │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │    │
│  │  │ 10 fases       │  │ pushOutbox()   │  │ navigator.onLn │   │    │
│  │  │ secuenciales   │  │ pullDelta()    │  │ /actuator/hlt  │   │    │
│  │  │ IDB + SW cache │  │ pullCatalogs() │  │ 3 modos        │   │    │
│  │  └────────────────┘  └────────────────┘  └────────────────┘   │    │
│  └────────────┬─────────────────────────────────────────────────┘    │
│               │                                                       │
│  ┌────────────▼─────────────────────────────────────────────────┐    │
│  │              INFRASTRUCTURE LAYER                             │    │
│  │                                                               │    │
│  │  ┌──────────────────┐  ┌──────────────┐  ┌────────────────┐  │    │
│  │  │ IndexedDB (idb)  │  │ apiClient    │  │ Serwist SW     │  │    │
│  │  │ • 17 stores      │  │ (axios)      │  │ • NetworkFirst │  │    │
│  │  │ • outbox/deadLtr │  │ • JWT inter.│  │ • precache     │  │    │
│  │  │ • syncMeta       │  │ • 401 refresh│  │ • /~offline    │  │    │
│  │  │ • imageCache     │  │ • withCreds  │  │ • msg handler  │  │    │
│  │  └──────────────────┘  └──────────────┘  └────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS (JWT Bearer + Cookie)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT API (WebFlux)                         │
│                                                                      │
│  POST /api/v1/sync/push     (idempotency + optimistic lock)          │
│  GET  /api/v1/sync/pull?cursor=&entityType=                          │
│  GET  /api/v1/sync/checksums (server checksum por store)             │
│  POST /api/v1/auth/refresh   (JWT refresh)                           │
│  GET  /actuator/health       (health check)                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  sync_log (append-only, cursor-based replication)            │   │
│  │  idempotency_keys (72h TTL)                                 │   │
│  │  device_cursors (por dispositivo)                            │   │
│  │  sync_incidents (conflict registry)                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. IndexedDB — Esquema Completo (17 Object Stores)

### 3.1 Stores de Datos

| Store | Key | Indexes | Propósito | TTL |
|-------|-----|---------|-----------|-----|
| `products` | `id` | `by-sku`, `by-barcode`, `by-category` | Catálogo de productos | ∞ (re-sync manual) |
| `categories` | `id` | — | Árbol de categorías | ∞ |
| `warehouses` | `id` | — | Bodegas | ∞ |
| `stockBalances` | `id` | `by-warehouse`, `by-product` | Stock actual | ∞ |
| `customers` | `id` | `by-code`, `by-name` | Clientes | ∞ |
| `suppliers` | `id` | `by-code`, `by-name` | Proveedores | ∞ |
| `currencies` | `id` | — | Monedas | ∞ |
| `exchangeRates` | `id` | — | Tasas de cambio | ∞ |
| `sales` | `id` | `by-number`, `by-date`, `by-customer` | Ventas | 30 días |
| `purchases` | `id` | `by-number`, `by-date`, `by-supplier` | Compras | ∞ |
| `transfers` | `id` | `by-number`, `by-date` | Transferencias | ∞ |
| `adjustments` | `id` | `by-number`, `by-date` | Ajustes | ∞ |
| `movements` | `id` | `by-date` | Movimientos inventario | ∞ |
| `returns` | `id` | `by-number`, `by-date` | Devoluciones | ∞ |
| `customerDebts` | `id` | `by-customer`, `by-status` | Deudas de clientes | ∞ |
| `notifications` | `id` | `by-date`, `by-read` | Notificaciones | 7 días |

### 3.2 Stores de Sistema

| Store | Key | Propósito |
|-------|-----|-----------|
| `outbox` | `id` (auto-increment) | Operaciones pendientes de sync (max 500) |
| `deadLetter` | `operationId` | Operaciones fallidas después de 3 retries |
| `syncMeta` | `key` | Metadata clave-valor (cursores, timestamps) |
| `imageCache` | `relativePath` | Blobs de imágenes (LRU, max 50MiB) |

### 3.3 Schema OutboxEntry

```typescript
interface OutboxEntry {
  id?: number;              // auto-increment
  operationId: string;       // UUID v4 (idempotency key)
  entityType: string;        // SALE, PURCHASE, TRANSFER, etc.
  entityId: string;          // UUID de la entidad (puede ser temporal si offline)
  action: string;            // CREATE, UPDATE, DELETE
  payload: unknown;          // Cuerpo completo de la operación
  status: OutboxStatus;      // pending | syncing | accepted | rejected
  retryCount: number;        // 0-3, luego dead letter
  maxRetries: number;        // default 3
  nextRetryAt: number;       // Timestamp para exponential backoff
  expiresAt: number;         // 7 días desde creación
  lastError?: string;        // Último error del servidor
  createdAt: number;         // Timestamp creación
  skip: boolean;             // Para entries colapsados (NOOP)
  isTempId: boolean;         // true si entityId es temporal (offline)
}
```

### 3.4 Schema DeadLetterEntry

```typescript
interface DeadLetterEntry {
  operationId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: unknown;
  error: string;
  retryCount: number;
  rejectedAt: number;
  userNotified: boolean;     // Para badge de UI
}
```

---

## 4. Máquina de Estados — Carga Inicial (10 Fases)

### 4.1 Diagrama

```
login → auth ready → startLoading()
        │
        ├─ quota (5%) → check storage.estimate()
        ├─ sw_precache (25%) → SW install + precache assets
        ├─ db_open (30%) → open IndexedDB
        ├─ warehouses (35%) → GET → IDB
        ├─ categories (40%) → GET → IDB
        ├─ products (65%) → GET /api/v1/products/paginated → IDB
        ├─ customers (70%) → GET → IDB
        ├─ suppliers (80%) → GET → IDB
        ├─ stock (90%) → GET → IDB
        ├─ precache_routes (95%) → fetch 27 admin routes → SW cache
        └─ complete (100%) → show dashboard
```

### 4.2 Detalle por Fase

| Fase | Peso | Acción | UI |
|------|------|--------|-----|
| `idle` | 0% | Esperando auth | No visible |
| `quota` | 5% | `navigator.storage.estimate()`, `navigator.storage.persist()` | "Verificando almacenamiento" |
| `sw_precache` | 25% | PostMessage `START_PRECACHING` al SW, esperar `done` | "Instalando aplicación... X/Y assets" |
| `db_open` | 30% | `openDB('inventory-offline', 4)`, verificar integridad | "Preparando almacenamiento local" |
| `warehouses` | 35% | `GET /api/v1/warehouses` → `batchPut('warehouses')` | "Descargando bodegas" |
| `categories` | 40% | `GET /api/v1/categories` → `batchPut('categories')` | "Descargando categorías" |
| `products` | 65% | `GET /api/v1/products/paginated?page=N&size=100` | "Descargando productos... página X/Y" |
| `customers` | 70% | `GET /api/v1/customers` → `batchPut('customers')` | "Descargando clientes" |
| `suppliers` | 80% | `GET /api/v1/suppliers` → `batchPut('suppliers')` | "Descargando proveedores" |
| `stock` | 90% | `GET /api/v1/stock` → `batchPut('stockBalances')` | "Descargando existencias" |
| `precache_routes` | 95% | `fetch(route, {credentials:'include'})` × 27 con concurrencia 3 | "Precargando vistas... X/27" |
| `complete` | 100% | `isComplete: true` | ✅ "Seguro desconectarse del servidor" |

### 4.3 Skip si ya hay datos cacheados

Cada fase de descarga verifica `getCachedCount(store) > 0`. Si ya hay datos en IndexedDB (recarga), **salta el fetch y avanza inmediatamente**. Esto hace que la segunda carga sea ~instantánea.

---

## 5. Máquina de Estados — Sync (Push + Pull)

### 5.1 Ciclo de Sync

```
useSyncStatus() hook
         │
         ├── Network change detected (online→offline, offline→online)
         ├── Interval timer (cada 120s si online)
         └── Reconnect detected (useNetworkHealth.onReconnect)
              │
              ▼
         sync() sequence:
              │
              1. tryRefreshTokenOnReconnect()
              2. pushOutbox() ────────────── POST /api/v1/sync/push
              3. checkStorageQuota()
              4. pullCatalogsIfStale() ───── GET /api/v1/{store}
              5. pullDeltaSync() ─────────── GET /api/v1/sync/pull?cursor=
              6. invalidateSpecificQueries() ─ TanStack Query cache
```

### 5.2 Push Flow Detallado

```
pushOutbox()
  │
  ├─ Skip if offline (getNetworkMode() === 'offline')
  ├─ Reset stuck entries (syncing → pending)
  ├─ Dead-letter expired (retryCount >= 3)
  ├─ Collapse outbox entries:
  │    └─ Agrupa por entityType:entityId
  │    ├─ CREATE + DELETE (solo 2) → NOOP (se cancelan)
  │    ├─ Tiene DELETE → keep última operación
  │    ├─ CREATE + más → keep CREATE (temp ID) + última UPDATE
  │    └─ DELETE individual → sin cambio
  │
  ├─ Batch: max 50 operations por request
  │    └─ Marca entries como 'syncing'
  │
  ├─ POST /api/v1/sync/push
  │    ├─ Success (accepted[]) → delete from outbox
  │    ├─ Rejected (rejected[]) → move to deadLetter
  │    ├─ 404/409 → deadLetter inmediato
  │    └─ Other error → retry con exponential backoff
  │
  └─ Cleanup: remove NOOP entries
```

### 5.3 Pull Flow Detallado

```
pullDeltaSync()
  │
  ├─ Para cada store en DELTA_STORES (con CONCURRENCY=3):
  │    ├─ Lee cursor desde syncMeta (`cursor_{store}`)
  │    ├─ GET /api/v1/sync/pull?entityType={store}&cursor={cursor}&limit=100
  │    ├─ Aplica cambios:
  │    │    ├─ action === 'DELETE' → store.delete(entityId)
  │    │    └─ cualquier otra → store.put({...afterData, cachedAt})
  │    └─ Actualiza cursor en syncMeta
  │
  └─ Repite hasta que response tenga < 100 entries
```

### 5.4 Exponential Backoff

```typescript
const BACKOFF_DELAYS = [30_000, 120_000, 480_000, 1_920_000, 7_200_000];
// Retry 1:  30 segundos
// Retry 2:  2 minutos
// Retry 3:  8 minutos
// Retry 4:  32 minutos (no usado, maxRetries=3)
// Retry 5:  2 horas    (no usado, maxRetries=3)
```

---

## 6. Detección de Conexión (useNetworkHealth)

### 6.1 Tres Modos

| Modo | Condition | UI | Comportamiento |
|------|-----------|----|----------------|
| `online-direct` | `navigator.onLine=true` AND health ping OK | 🟢 | Normal: API directa, sync automático |
| `online-degraded` | `navigator.onLine=true` BUT health ping fails | 🟡 | App funciona con datos cacheados. Escrituras van al outbox. SW sirve páginas. |
| `offline` | `navigator.onLine=false` | 🔴 | Solo datos cacheados. Todo al outbox. |

### 6.2 Health Check

```
GET /actuator/health (timeout: 2s)
├─ Online: cada 120s
├─ After 3 consecutive errors: interval *= 4 (480s, 1920s, ...)
├─ Pausa cuando document.hidden (ahorro batería)
└─ Reanuda en visibilitychange
```

### 6.3 Transiciones

```
offline ←→ online-direct (transición inmediata al reconectar)
online-direct → online-degraded (health ping falla)
online-degraded → online-direct (health ping OK)
online-degraded (navegador dice online pero backend no responde)
offline (navegador dice offline)
```

---

## 7. Service Worker (Serwist)

### 7.1 Configuración

```typescript
new Serwist({
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,   // 8 estrategias predefinidas
  fallbacks: {
    entries: [
      { url: "/~offline", matcher: (req) => req.destination === "document" },
    ],
  },
});
```

### 7.2 Estrategias de Cache

| Patrón | Estrategia | Prioridad |
|--------|------------|-----------|
| Documentos (navegación) | NetworkFirst | SW cache |
| JS/CSS (build) | CacheFirst | Precache |
| Fuentes | CacheFirst | Precache |
| Imágenes | StaleWhileRevalidate | SW cache |
| API (`/api/v1/`) | NetworkOnly | No cachea |
| RSC (React Server Components) | NetworkFirst | SW cache |
| Datos Next.js (`__next_data`) | NetworkFirst | SW cache |
| Rutas precargadas | NetworkFirst | SW cache (vía precache_routes) |

### 7.3 Mensajes Personalizados

```typescript
// Client → SW
postMessage({ type: 'START_PRECACHING' })

// SW → Client
postMessage({
  type: 'PRECACHE_PROGRESS',
  payload: { completed: 45, total: 110 }
})
```

---

## 8. Almacenamiento de Sesión y Auth

### 8.1 Tokens

| Token | Almacenamiento | TTL | Refrescable |
|-------|---------------|-----|-------------|
| `access_token` | `localStorage` + cookie (`httpOnly` via backend) | 30 días | Sí (via `/api/v1/auth/refresh`) |
| `refresh_token` | `localStorage` | 7 días | No (se regenera) |

### 8.2 Flujo de Auth

```
Login → POST /api/v1/auth/login
  ├─ access_token → localStorage + cookie
  └─ refresh_token → localStorage + IndexedDB (auth store)

Cada request:
  ├─ Axios request interceptor: attach Bearer token
  └─ Axios response interceptor:
       ├─ 401 (no es auth/refresh) → POST /api/v1/auth/refresh
       │    ├─ Success → actualiza tokens
       │    └─ Fail → limpia tokens → redirect /login
       └─ Otros códigos → pasa el error
```

### 8.3 Auth Persistida en IndexedDB

El store `syncMeta` guarda `auth_tokens` key con los tokens encriptados. `tryRefreshTokenOnReconnect()` intenta refresh al reconectar.

---

## 9. Conflictos y Resolución

### 9.1 Tipos de Conflicto

| Tipo | Causa | Resolución |
|------|-------|------------|
| `ENTITY_DUPLICATE` | Mismo SKU/barcode creado en 2 dispositivos offline | Descartar, reemplazar, o editar y reintentar |
| `STOCK_CONFLICT` | Stock insuficiente cuando 2 ventas offline se sincronizan | Olvidar venta o ajustar cantidad |
| `VERSION_MISMATCH` | Misma entidad editada en 2 dispositivos | Usar servidor, ver diferencias, o forzar (solo ADMIN) |

### 9.2 Flujo de Resolución

```
1. Servidor rechaza operación vía POST /api/v1/sync/push
2. Entry se mueve a deadLetter con error details
3. UI muestra badge rojo + SyncIncident creado en backend
4. Usuario va a Centro de Incidencias (/sync/incidents)
5. Usuario elige acción:
   ├─ Retry (editar payload y reintentar)
   ├─ Discard (eliminar dead letter)
   └─ Force (solo ADMIN, sobrescribe servidor)
```

---

## 10. Componentes de UI Relacionados

| Componente | Propósito | Archivo |
|------------|-----------|---------|
| `CacheProgressBar` | Barra de carga inicial con fases | `components/network-status/CacheProgressBar.tsx` |
| `NetworkStatusWidget` | Indicador de modo online/offline flotante | `components/data-display/NetworkStatusWidget.tsx` |
| `DashboardLayout` | Layout principal que bloquea hasta complete | `components/layout/DashboardLayout.tsx` |
| `OfflineFallback` | Página `/~offline` cuando no hay cache | `app/~offline/page.tsx` |
| `SyncProgressBar` | Progreso de operaciones pendientes | (planeado) |
| `SyncIncidentCenter` | Centro de resolución de conflictos | `/sync/incidents` |
| `DeadLettersPanel` | Lista de operaciones fallidas con retry | `modules/sync/hooks/useDeadLetters.ts` |

---

## 11. Hooks y Store — Árbol de Dependencias

```
useAppLoader()
  ├── useAppLoaderStore (Zustand) — phase, progress, subStep, etc.
  ├── useSWPrecacheProgress() — SW progress via postMessage
  ├── initPersistence() — IndexedDB open + verify
  ├── getCachedCount() — IDB check
  ├── fetchAll() / fetchPaginated() — API fetch → IDB
  └── getStorageUsage() — navigator.storage.estimate

useSyncStatus()
  ├── pushOutbox() → outbox.ts → POST /api/v1/sync/push
  ├── pullCatalogsIfStale() → GET /api/v1/{store}
  ├── pullDeltaSync() → GET /api/v1/sync/pull?cursor=
  ├── tryRefreshTokenOnReconnect() → authStore.ts
  ├── checkStorageQuota() → db.ts
  └── invalidateSpecificQueries() → TanStack Query

useNetworkHealth()
  ├── window.addEventListener('online'/'offline')
  ├── setInterval → GET /actuator/health
  └── useNetworkStore (Zustand) — modo actual

useDeadLetters()
  ├── Polling cada 5s
  ├── retry(operationId) → retryDeadLetter() → addToOutbox()
  ├── discard(operationId) → discardDeadLetter()
  └── retryWithEdit(operationId, newPayload)
```

---

## 12. Repositorios — Patrón de Acceso a Datos

Cada uno de los 25 repositorios en `infrastructure/repositories/` sigue el mismo patrón:

```typescript
// Lectura
async getById(id: string): Promise<Product | null> {
  return readWithCache(
    () => apiClient.get(`/api/v1/products/${id}`).then(r => r.data),
    () => db.getCachedProduct(id)  ← IDB fallback
  );
}

// Escritura (creación)
async create(data: CreateProductDTO): Promise<Product> {
  if (isOnline()) {
    const result = await apiClient.post('/api/v1/products', data);
    await db.cacheProduct(result.data);  // actualiza cache
    return result.data;
  }
  // Offline → outbox
  await addToOutbox({
    operationId: crypto.randomUUID(),
    entityType: 'PRODUCT',
    entityId: data.sku || crypto.randomUUID(),
    action: 'CREATE',
    payload: data,
    isTempId: true,
  });
  return { ...data, id: `temp_${Date.now()}`, cachedAt: Date.now() } as Product;
}

// Escritura (crítica: confirmar venta, entregar, cancelar)
async confirm(id: string): Promise<Sale> {
  if (!isOnline()) {
    throw new OfflineRequiredError('Confirmar venta requiere conexión');
  }
  return apiClient.post(`/api/v1/sales/${id}/confirm`);
}
```

---

## 13. Gap Analysis vs Estado Ideal

### 13.1 Implementado ✅

| Aspecto | Estado |
|---------|--------|
| IndexedDB con 17 stores | ✅ |
| Outbox pattern con exponential backoff y dead letter | ✅ |
| Push sync (POST /sync/push) | ✅ |
| Pull sync (GET /sync/pull?cursor=) | ✅ |
| Catalog refresh (5 min TTL) | ✅ |
| Network detection (3 modos) | ✅ |
| Sync automático (cada 120s + reconnect) | ✅ |
| Auth persist + refresh automático | ✅ |
| Cache validation (checksum) | ✅ |
| Image cache (LRU, 50MiB) | ✅ |
| Service Worker (Serwist) con precache | ✅ |
| Offline fallback page (`/~offline`) | ✅ |
| SW progress reporting (`PRECACHE_PROGRESS`) | ✅ |
| Interceptor axios 401 refresh | ✅ |
| 25 repos siguiendo readWithCache/writeWithOutbox | ✅ |
| Conflict resolution (3 tipos) | ✅ |
| Sync incident center | ✅ |
| Carga inicial secuencial (10 fases) | ✅ (con bug en products) |
| Dead letter management UI | ✅ |
| Carga inicial secuencial (10 fases) | ✅ (+precache_routes pending) |
| isComplete fix | ✅ |
| CacheProgressBar redesign | ✅ |
| Token 30 días | ✅ |
| SSE rewrite | ✅ |

### 13.2 Brechas Identificadas ❌

| # | Brecha | Impacto | Prioridad |
|---|--------|---------|-----------|
| 1 | **Products endpoint wrong** (`/api/v1/products` en vez de `/api/v1/products/paginated`) | Productos no se cachean en carga inicial — store vacío | 🔴 Alta |
| 2 | **precache_routes no existe** — rutas admin no se precargan | Navegación offline lenta (SW no tiene páginas en cache) | 🔴 Alta |
| 3 | **No hay delta sync** — solo pull full | Sync lento en cada ciclo | 🟡 Media |
| 4 | **SW no usa CacheFirst** para rutas precargadas | serwist usa NetworkFirst — siempre va a red primero | 🟡 Media |
| 5 | **Sync manual** basado en setInterval y eventos | No aprovecha BackgroundSync API (SW) | 🟡 Media |
| 6 | **Sin colapso inteligente** en outbox | CREATE + UPDATE + DELETE de misma entidad = 3 viajes | 🟡 Media |
| 7 | **Sin lazy loading** de datos no críticos | UI no muestra data "buena" inmediatamente, espera full load | 🟢 Baja |
| 8 | **OfflineQueueFullError** no tiene UI dedicada | Usuario no sabe que la cola está llena | 🟢 Baja |
| 9 | **pullDeltaSync** no filtra por warehouse | Dispositivos multi-bodega reciben cambios de todas | 🟢 Baja |
| 10 | **TanStack Query invalidation** hardcodeada 16 prefijos | Si se agrega store nuevo, sync no invalida queries | 🟢 Baja |
| 11 | **Dead letter sin notificación al usuario** | Operaciones fallidas quedan silenciosas | 🟢 Baja |
| 12 | **Sin request deduplication** en apiClient | Múltiples fetches simultáneos al mismo endpoint | 🟢 Baja |
| 13 | **Sin modo "online-degraded" explícito** en UI | Usuario no sabe que está en modo degradado | 🟢 Baja |

### 13.3 Recomendaciones Técnicas

| # | Recomendación | Esfuerzo | Beneficio |
|---|---------------|----------|-----------|
| 1 | **Implementar delta sync endpoint** (`/api/v1/sync/delta?since=cursor`) | 3-4 días | Reduce tráfico de pull 90%+ |
| 2 | **BackgroundSync API** para outbox automático incluso con SW cerrado | 1-2 días | Sync más confiable |
| 3 | **SW cache rutas con CacheFirst** después de precache_routes | 0.5 días | Navegación offline instantánea |
| 4 | **Lazy loading**: productos, customers, suppliers no bloqueantes | 2-3 días | Tiempo de "app usable" baja de 10s a 3s |
| 5 | **Refresh tokens automático** via Service Worker (sync periódico) | 1 día | Token siempre fresco offline |
| 6 | **Deduplicación de requests** (axios adapter con cache LRU) | 0.5 días | Menos llamadas duplicadas |

---

## 14. Plan de Implementación — 4 Fases

### Fase 1: Arreglar Carga Inicial (Urgente)

**Objetivo:** Que los datos se carguen correctamente y las rutas se precachen.

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1.1 | `useAppLoader.ts` | Fix endpoint: `/api/v1/products` → `/api/v1/products/paginated`, size 200 → 100 |
| 1.2 | `appLoaderStore.ts` | Add `precache_routes` a LoadPhase, weights, labels; totalSteps 9→10 |
| 1.3 | `useAppLoader.ts` | Nuevo useEffect para `precache_routes` con ADMIN_ROUTES (27 rutas, concurrencia 3) |
| 1.4 | `CacheProgressBar.tsx` | Add `precache_routes` a PHASE_ORDER |
| Verificar | `pnpm build`, `pnpm lint` | Sin errores |

**Duración estimada:** 2-4 horas

---

### Fase 2: Sync Inteligente (Corto Plazo)

**Objetivo:** Reducir tráfico de sync, hacerlo más confiable.

| Paso | Cambio | Archivo |
|------|--------|---------|
| 2.1 | Backend: Endpoint delta sync `GET /api/v1/sync/delta?since=cursor&entityType=&warehouseId=` | `SyncController.java` |
| 2.2 | Frontend: `pullDeltaSync()` usa nuevo endpoint con filtros | `SyncService.ts` |
| 2.3 | BackgroundSync: SW registra sync event cuando hay outbox pendiente | `sw.ts` |
| 2.4 | Colapso inteligente: ORDENAR operaciones dentro del batch por dependencia | `outbox.ts` |
| 2.5 | CacheFirst para rutas precargadas en sw.ts | `sw.ts` (runtimeCaching) |

**Duración estimada:** 5-7 días

---

### Fase 3: Lazy Loading y UX (Mediano Plazo)

**Objetivo:** Que la app sea "usable" en 3 segundos, no en 15.

| Paso | Cambio |
|------|--------|
| 3.1 | Separar datos críticos (warehouses, categories, stock) de no críticos (customers, suppliers, products) |
| 3.2 | Mostrar dashboard inmediatamente con datos críticos |
| 3.3 | Background fetch de datos no críticos mientras usuario navega |
| 3.4 | Modo degradado explícito en UI (banner amarillo) |
| 3.5 | Dead letter notification badge |

**Duración estimada:** 2-3 semanas

---

### Fase 4: Offline Avanzado (Largo Plazo)

**Objetivo:** Llevar la app al 100% offline-first sin concesiones.

| Paso | Cambio |
|------|--------|
| 4.1 | SQLite via OPFS (reemplaza IndexedDB para datos >10k records) |
| 4.2 | Web Worker para sync en background (no bloquea UI thread) |
| 4.3 | Request deduplication (axios LRU cache adapter) |
| 4.4 | Replicación multi-bodega (cada dispositivo sincroniza solo su bodega) |
| 4.5 | Compresión de payload (gzip outbox antes de enviar) |

**Duración estimada:** 4-6 semanas

---

## 15. Monitoreo y Depuración

### 15.1 DevTools Snippets

```typescript
// Verificar datos en IndexedDB
async function inspectIDB() {
  const db = await window.indexedDB.open('inventory-offline');
  const stores = ['products', 'categories', 'warehouses', 'stockBalances',
    'customers', 'suppliers', 'outbox', 'deadLetter', 'syncMeta'];
  for (const store of stores) {
    const tx = db.transaction(store, 'readonly');
    const count = await tx.objectStore(store).count();
    console.log(`${store}: ${count} items`);
  }
}

// Verificar outbox
async function inspectOutbox() {
  const db = await window.indexedDB.open('inventory-offline');
  const tx = db.transaction('outbox', 'readonly');
  const entries = await tx.objectStore('outbox').getAll();
  console.table(entries.map(e => ({
    operationId: e.operationId?.slice(0,8),
    entityType: e.entityType, action: e.action, status: e.status,
    retryCount: e.retryCount, createdAt: new Date(e.createdAt).toISOString()
  })));
}

// Verificar SW cache
async function inspectSWCache() {
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    console.log(`${name}: ${keys.length} entries`);
    keys.slice(0, 10).forEach(r => console.log(`  ${r.url}`));
  }
}
```

### 15.2 Puntos de Falla Comunes

| Síntoma | Causa Probable | Solución |
|---------|---------------|----------|
| Productos no aparecen en IDB | Endpoint incorrecto (`/api/v1/products`) | Cambiar a `/api/v1/products/paginated` |
| Fase products no avanza | Backend devuelve `{items}` sin `{content}` | Usar endpoint paginado |
| SW no registra rutas precargadas | `precache_routes` no implementada | Agregar fase + fetch |
| Auth loop infinito | 401 refresh falla repetidamente | Verificar refresh token en localStorage |
| Sync no ejecuta | `getNetworkMode()` retorna `offline` pero hay conexión | Verificar health ping |
| Outbox nunca se vacía | POST /sync/push devuelve 500 | Verificar backend logs |
| IndexedDB quota exceeded | imageCache muy grande | Limpiar imageCache manualmente |

---

## 16. Archivos Clave del Sistema

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `src/infrastructure/storage/db.ts` | 787 | IndexedDB schema + todas las operaciones de datos |
| `src/infrastructure/storage/outbox.ts` | 175 | Outbox pattern (enqueue, retry, dead letter) |
| `src/infrastructure/storage/SyncService.ts` | 322 | Sincronización push + pull + catalog |
| `src/infrastructure/storage/networkStore.ts` | 15 | Modo de red (Zustand) |
| `src/infrastructure/storage/networkAwareUtils.ts` | 56 | readWithCache, writeWithOutbox |
| `src/infrastructure/storage/authStore.ts` | 56 | Auth persistente en IndexedDB |
| `src/infrastructure/storage/CacheValidatorService.ts` | 60 | Checksum-based cache validation |
| `src/infrastructure/storage/ImageCacheService.ts` | 87 | LRU image cache (50MiB) |
| `src/infrastructure/api/client.ts` | 123 | Axios instance + interceptors |
| `src/app/sw.ts` | 79 | Service Worker (Serwist) |
| `src/core/loading/appLoaderStore.ts` | 136 | State machine de carga inicial |
| `src/presentation/shared/hooks/storage/useAppLoader.ts` | 196 | Orquestador de fases de carga |
| `src/presentation/shared/hooks/storage/useSyncStatus.ts` | 133 | Orquestador de sync |
| `src/presentation/shared/hooks/storage/useNetworkHealth.ts` | 135 | Detector de conectividad |
| `src/presentation/shared/components/network-status/CacheProgressBar.tsx` | 167 | UI de progreso de carga |
| `src/presentation/shared/components/layout/DashboardLayout.tsx` | — | Layout que bloquea hasta complete |
| `src/infrastructure/storage/` | 9 files | Todo el módulo de almacenamiento |
| `src/infrastructure/repositories/` | 25 dirs | Repos con patrón readWithCache/writeWithOutbox |
| `docs/design/offline-strategy.md` | 358 | Documento de diseño original |
| `docs_dev/pwa-serwist-plan.md` | 98 | Plan de implementación SW |
| `docs_dev/optimization-strategy.md` | 325 | Estrategia de carga optimizada |
| `docs_dev/task_plan.md` | 430 | Plan de ejecución (fases C1-C3) |
| `docs_dev/database-schema.md` | 780 | Schema completo de la BD |

---

## 17. Preguntas Frecuentes

### ¿Por qué IndexedDB y no SQLite?

SQLite vía OPFS es 10x-100x más rápido en consultas con >10k registros. Pero:
- Requiere Web Worker (CRUD es async pero costoso en main thread)
- Schema sync manual (no hay migraciones automáticas como Flyway)
- Bundle extra de ~15-20KB
- IndexedDB es suficiente para el volumen actual (cientos a miles de registros)

Se recomienda migrar a SQLite solo si la base supera los 10,000 registros o si las consultas complejas (JOINs, filtros múltiples) se vuelven lentas en IDB.

### ¿Por qué no usar BackgroundSync API?

BackgroundSync requiere Service Worker activo y no funciona en todos los navegadores. La estrategia actual (setInterval + reconnect event) es más compatible y predecible. La migración a BackgroundSync es una optimización de mediano plazo.

### ¿Cómo manejar multiples bodegas?

Cada dispositivo almacena `warehouseId` en preferencias. `device_cursors` en backend permite filtrar sync por warehouse. El frontend actualmente consulta `GET /api/v1/stock?warehouseId=X` pero el pull sync no filtra por warehouse (brecha #9).

### ¿Qué pasa si el usuario borra IndexedDB?

Si el usuario borra los datos del sitio:
1. La app detecta que `getCachedCount()` es 0 para todos los stores
2. Inicia carga completa de nuevo (fase quota → sw_precache → etc.)
3. Si está offline, muestra error "No hay datos en caché. Conéctese para descargar."
4. Si está online, descarga todo de nuevo

### ¿Cómo se renueva el token offline?

No se renueva. El token dura 30 días. Si el usuario está offline más de 30 días, al reconectar:
1. API call falla con 401
2. Axios interceptor intenta refresh con `refresh_token`
3. Si refresh_token también expiró (7 días), redirect a `/login`

---

## 18. Diagrama de Estados — Ciclo de Vida Completo

```
         ┌──────────┐
         │  Login   │
         └────┬─────┘
              │
         ┌────▼─────┐
         │  idle    │  (esperando credenciales)
         └────┬─────┘
              │ startLoading()
         ┌────▼─────┐
         │  quota   │── error ──► ┌───────┐
         └────┬─────┘             │ error │
              │                   └───────┘
         ┌────▼─────────┐              ▲
         │ sw_precache  │──────────────┘
         └────┬─────────┘   (si falla, error no fatal)
              │ SW done
         ┌────▼─────┐
         │ db_open  │── error ──► ┌───────┐
         └────┬─────┘             │ error │
              │                   └───────┘
         ┌────▼──────────┐
         │ warehouses    │── error ──► error
         └────┬──────────┘
              │
         ┌────▼──────────┐
         │ categories    │── error ──► error
         └────┬──────────┘
              │
         ┌────▼──────────┐
         │ products      │── error ──► error
         └────┬──────────┘
              │
         ┌────▼──────────┐
         │ customers     │── error ──► error
         └────┬──────────┘
              │
         ┌────▼──────────┐
         │ suppliers     │── error ──► error
         └────┬──────────┘
              │
         ┌────▼──────────┐
         │ stock         │── error ──► error
         └────┬──────────┘
              │
         ┌────▼───────────┐
         │ precache_routes│── error ──► complete (no fatal)
         └────┬───────────┘
              │
         ┌────▼──────────┐
         │  complete     │
         └────┬──────────┘
              │
         ┌────▼─────────────────────┐
         │  Dashboard + Sync Cycle  │
         │  ┌─────────────────────┐ │
         │  │ Cada 120s (si online)│ │
         │  │ 1. pushOutbox()     │ │
         │  │ 2. pullCatalogs()   │ │
         │  │ 3. pullDeltaSync()  │ │
         │  │ 4. invalidateQueries│ │
         │  └─────────────────────┘ │
         └──────────────────────────┘
```

---

## 19. Conclusión y Prioridades

La aplicación tiene una **base offline-first sorprendentemente sólida** con:
- Outbox pattern completo con dead letter
- Sync bidireccional (push + pull con cursores)
- Network detection con 3 modos
- Cache de imágenes LRU
- Interceptor de auth automático
- SW con Serwist
- 25 repositorios siguiendo el patrón

### Prioridad Inmediata (Ejecutar ahora)

1. **Fix products endpoint** (C1) — Sin esto, el catálogo nunca se cachea
2. **Agregar precache_routes** (C2) — Sin esto, offline navigation no funciona

### Prioridad Corto Plazo (Siguiente sprint)

3. Delta sync endpoint para reducir tráfico
4. BackgroundSync API para sync más confiable
5. CacheFirst para rutas precargadas
6. Lazy loading para datos no críticos

### Prioridad Mediano Plazo

7. SQLite + Web Worker para datasets grandes
8. Request deduplication
9. Modo degradado explícito en UI
10. Filtro warehouse en pull sync
