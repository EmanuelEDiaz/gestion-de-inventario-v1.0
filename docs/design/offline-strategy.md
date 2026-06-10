# Offline-First Strategy — Inventario

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Mobile/Desktop Browser (PWA)                       │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │ React UI │──│ idb      │──│ Service Worker  │   │
│  │          │  │ IndexedDB│  │ (Serwist)       │   │
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

## 2. IndexedDB Schema (idb v8+)

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
| `imageIndex` | `relativePath` | Metadata index; blobs stored in OPFS (LRU, max 50 MiB) |

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

## 5. Service Worker (Serwist)

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

---

## 9. Progreso Real de Carga Inicial

La app solo puede declararse "disponible offline" cuando los 6 pasos siguientes completan en orden:

| Paso | Descripción | Progreso |
|------|-------------|---------|
| 1/6 | App shell cargado — Service Worker activo y controlando | 15% |
| 2/6 | Autenticación verificada — token válido | 25% |
| 3/6 | Catálogo descargado — products, categories | 45% |
| 4/6 | Almacenes y stock balances descargados | 60% |
| 5/6 | Clientes, proveedores y monedas descargados | 80% |
| 6/6 | Sync pull completado — cursor guardado en IndexedDB | 100% |

### Comportamiento en error de paso
- Cada paso muestra su propio estado: `cargando…` / `✓ listo` / `⚠ error`
- En error: mensaje descriptivo + botón **"↺ Reintentar este paso"** + botón **"↺ Reintentar todo"**
- Si la conexión se pierde antes del 100%: banner _"Datos incompletos. La app no está lista para uso offline. Reconéctate para completar."_
- El modo offline solo se habilita al llegar al 100%

### Componente: barra de carga inicial (progreso real)

```
┌─────────────────────────────────────────────────────┐
│  Preparando la aplicación...                        │
│  [████████████████████████████░░░░░░░░░░░░   75%]  │
│                                                     │
│  ✓  App shell                                       │
│  ✓  Autenticación                                   │
│  ✓  Catálogo de productos                           │
│  ⟳  Almacenes y stock...                            │
│  ○  Clientes y proveedores                          │
│  ○  Sincronización pull                             │
└─────────────────────────────────────────────────────┘
```

- La barra es **real** (no animación falsa): avanza únicamente al completar cada paso
- El ancho de la barra = `(pasosCompletados / 6) * 100%` calculado en tiempo de ejecución
- Al llegar a 100% la pantalla de carga se reemplaza por la app (sin "loading" posterior)
- En primer uso (sin datos locales): pantalla de bienvenida antes de la barra
- En recargas subsiguientes: si todos los datos siguen frescos, la barra se omite y arranca directo

---

## 10. Progreso Real de Sync (Upload de cambios pendientes)

La barra de sync muestra el estado real de cada operación del outbox. No es un timer falso.

```
┌─────────────────────────────────────────────────────┐
│ 🔄 Sincronizando  5/8 operaciones      [Colapsar ↑] │
├─────────────────────────────────────────────────────┤
│ ✓ Venta #001         · aceptada         [Ver]       │
│ ✓ Venta #002         · aceptada         [Ver]       │
│ ✓ Ajuste #001        · aceptada         [Ver]       │
│ ⟳ Compra #001        · sincronizando…              │
│ ⚠ Venta #003         · conflicto        [Resolver ▶]│
│ ○ Venta #004         · pendiente                    │
│ ○ Transferencia #001 · pendiente                    │
│ ○ Pago deuda #001    · pendiente                    │
├─────────────────────────────────────────────────────┤
│ [↺ Reintentar fallidos]  [Ver todas las incidencias]│
└─────────────────────────────────────────────────────┘
```

### Comportamiento detallado
- **Progreso** = `(aceptadas + rechazadas) / total` — número real, no estimado
- El contador "X/Y operaciones" actualiza en tiempo real al completar cada una
- Al finalizar sin conflictos: barra se colapsa automáticamente tras 3 s
- Si hay conflictos pendientes: barra permanece visible con badge de alerta rojo
- Botón **"Ver todas las incidencias"** navega a `/admin/sync/incidents`
- La barra es colapsable y configurable en DisplaySettings (puede ocultarse permanentemente)

---

## 11. Política de Conflictos — 3 Tipos

### Tipo A — Entidad duplicada (ENTITY_DUPLICATE)
*Escenario: mismo SKU/barcode creado en dos dispositivos offline*

| Opción | Acción |
|--------|--------|
| **Descartar la mía** | Elimina del outbox. Usa la versión del servidor. |
| **Reemplazar la del servidor** | Solo ADMIN. Sobreescribe la del servidor con la mía. |
| **Editar y reintentar** | Abre el formulario pre-cargado con mis datos para corregir el conflicto (ej: cambiar el SKU) y reintenta. |

### Tipo B — Stock insuficiente (STOCK_CONFLICT)
*Escenario: dos dispositivos offline venden el mismo producto, el stock no alcanza para ambos. El primero en sincronizar gana.*

| Opción | Acción |
|--------|--------|
| **Olvidar esta venta** | Cancela la venta en el outbox. Pide confirmación: _"¿Seguro que quieres cancelar Venta #003? Esta acción no se puede deshacer."_ |
| **Cambiar producto/cantidad** | Abre el formulario de la venta con los datos actuales de stock del servidor para que el usuario ajuste y reintente. |

### Tipo C — Version mismatch (VERSION_MISMATCH)
*Escenario: la misma entidad fue modificada por dos dispositivos mientras ambos estaban offline*

| Opción | Acción |
|--------|--------|
| **Usar versión del servidor** | Descarta mis cambios. Adopta la versión del servidor como estado actual. |
| **Ver diferencias y editar** | Vista comparativa: "Mi versión" vs "Versión del servidor" con campos editables para hacer merge manual. |
| **Forzar mis cambios** | Solo ADMIN. Sobreescribe el servidor con mi versión. |

---

## 12. Centro de Incidencias `/admin/sync/incidents`

Vista dedicada para gestionar todas las incidencias sin depender de la barra de sync.

```
┌──────────────────────────────────────────────────────────────────┐
│ Centro de Incidencias                       [Ignorar todas]      │
├──────────────────────────────────────────────────────────────────┤
│ [Tipo ▼]  [Entidad ▼]  [Estado ▼]    🔍 [Buscar...         ]   │
├────┬──────────────────────────────────┬──────────────────────────┤
│ ☐  │ Venta #003 · Stock conflict      │ [Olvidar] [Cambiar]      │
│ ☐  │ Producto "Arroz" · Duplicado     │ [Descartar][Editar][↑]   │
│ ☐  │ Cliente "Juan" · V. mismatch     │ [Servidor][Diff][Forzar] │
│ ☐  │ Compra #002 · Checksum error     │ [Reintentar][Cancelar]   │
├────┴──────────────────────────────────┴──────────────────────────┤
│ ☐ Seleccionar todo        [Aplicar a seleccionados ▼]            │
│                           Mostrando 4 de 4 incidencias           │
└──────────────────────────────────────────────────────────────────┘
```

- Paginación estándar (20 por página)
- Cada fila es expandible: muestra "Mi versión" vs "Versión servidor" en un panel acordeón
- "Aplicar a seleccionados" → dropdown con las acciones comunes del tipo más frecuente entre los seleccionados
- Badge en el sidebar con el total de incidencias `PENDING`

---

## 13. Política de Creación de Entidades Offline

```
Si OutboxEntry.isOfflineCreated = true AND OutboxEntry.hasUniqueRisk = true:
  → Mostrar banner amarillo en el outbox entry:
    ⚠ "Creado sin conexión — riesgo de duplicado.
       Se recomienda conectarse antes de sincronizar."

Al sincronizar:
  - Servidor acepta → ✓ sin problema
  - Servidor rechaza por duplicado → genera SyncIncident de tipo ENTITY_DUPLICATE

Política recomendada (documentada para los usuarios):
  - Crear productos, categorías y otras entidades con campos únicos (SKU, barcode, código)
    preferentemente mientras se está conectado al servidor.
  - Si se crea offline, usar nombres/códigos claramente únicos para minimizar conflictos.
```

---

## 14. Upload Atómico de Archivos

Todo upload de imagen sigue este protocolo para garantizar integridad:

```
1. Cliente calcula SHA-256 del archivo antes de enviarlo
2. Cliente envía multipart con header: Content-MD5: <base64(sha256)>
3. Servidor recibe el archivo, calcula su propio SHA-256
4. Si los hashes coinciden → persiste el archivo y retorna ImageUploadResponse con serverChecksum
5. Si no coinciden → 400 Bad Request (checksum-mismatch), nada se guarda
6. Cliente verifica que serverChecksum == checksumSha256 local

En error:
  - UI muestra: "⚠ Error al subir '{filename}' — el archivo llegó incompleto"
  - Botón: [↺ Reintentar] por archivo individual
  - Botón: [↺ Reintentar todos] para todos los uploads fallidos
  - El archivo queda en status='error' en la UploadQueue (IndexedDB)
  - No se crea ningún registro roto en la base de datos
```
