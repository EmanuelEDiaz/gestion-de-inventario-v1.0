# API Endpoints

Base: `/api/v1`

## Reglas Globales

- Todo recurso mutable expone `ETag: W/"<version>"` en GET
- Todo PATCH requiere `If-Match: W/"<version>"`
  - Si falta → `428 Precondition Required`
  - Si no coincide → `409 Conflict`
- Paginación default: `page=0`, `size=20`, máximo `size=100`
- Header `Idempotency-Key` es UUID v4 generado por cliente

## Auth

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/auth/login` | Retorna access JWT + refresh (cookie) | Público |
| POST | `/auth/refresh` | Lee refresh de cookie, retorna nuevo access | Público |
| POST | `/auth/logout` | Revoca refresh token | Autenticado |

## Usuarios

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/users` | Lista usuarios | ADMIN |
| POST | `/users` | Crear usuario | ADMIN |
| GET | `/users/{id}` | Obtener usuario → ETag | ADMIN o self |
| PATCH | `/users/{id}` | Actualizar → If-Match | ADMIN o self |
| POST | `/users/{id}/avatar` | Subir avatar (multipart) | ADMIN o self |
| GET | `/users/{id}/avatar` | Obtener avatar | Autenticado |

## Catálogo

### Categorías
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/categories` | Árbol de categorías | Autenticado |
| POST | `/categories` | Crear categoría | ADMIN/MANAGER |
| GET | `/categories/{id}` | → ETag | Autenticado |
| PATCH | `/categories/{id}` | → If-Match | ADMIN/MANAGER |

### Productos
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/products` | Listar (query, categoryId, status, page, size) | Autenticado |
| POST | `/products` | Crear producto | ADMIN/MANAGER |
| GET | `/products/{id}` | → ETag | Autenticado |
| PATCH | `/products/{id}` | → If-Match | ADMIN/MANAGER |
| POST | `/products/{id}/images` | Subir imágenes (multipart) | ADMIN/MANAGER |
| GET | `/products/{id}/images` | Lista metadata | Autenticado |
| GET | `/products/{id}/images/{imgId}` | Obtener imagen (variant) | Autenticado |
| DELETE | `/products/{id}/images/{imgId}` | Eliminar imagen | ADMIN/MANAGER |

## Almacenes / Stock

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/warehouses` | Lista almacenes | Autenticado |
| POST | `/warehouses` | Crear almacén | ADMIN |
| GET | `/warehouses/{id}` | → ETag | Autenticado |
| PATCH | `/warehouses/{id}` | → If-Match | ADMIN |
| GET | `/stock` | Consultar stock (warehouseId, productId, belowReorderPoint) | Autenticado |
| GET | `/movements` | Historial movimientos | Autenticado |

## Operaciones

### Compras
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/purchases` | Crear (Idempotency-Key) | ADMIN/MANAGER |
| GET | `/purchases` | Listar | Autenticado |
| GET | `/purchases/{id}` | → ETag | Autenticado |
| POST | `/purchases/{id}/cancel` | Cancelar | ADMIN/MANAGER |

### Ventas (POS)
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/sales` | Crear (Idempotency-Key) | SELLER+ |
| GET | `/sales` | Listar | Autenticado |
| GET | `/sales/{id}` | → ETag | Autenticado |
| POST | `/sales/{id}/cancel` | Cancelar | ADMIN/MANAGER |

### Transferencias
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/transfers` | Crear (Idempotency-Key) | ADMIN/MANAGER |
| GET | `/transfers` | Listar | Autenticado |
| GET | `/transfers/{id}` | → ETag | Autenticado |
| POST | `/transfers/{id}/cancel` | Cancelar | ADMIN/MANAGER |

### Ajustes
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/adjustments` | Crear (Idempotency-Key) | ADMIN/MANAGER |
| GET | `/adjustments` | Listar | Autenticado |
| GET | `/adjustments/{id}` | → ETag | Autenticado |

### Devoluciones
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/returns` | Crear (Idempotency-Key) | ADMIN/MANAGER |
| GET | `/returns` | Listar | Autenticado |
| GET | `/returns/{id}` | → ETag | Autenticado |

## Terceros

### Proveedores
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/suppliers` | Listar | Autenticado |
| POST | `/suppliers` | Crear | ADMIN/MANAGER |
| GET | `/suppliers/{id}` | → ETag | Autenticado |
| PATCH | `/suppliers/{id}` | → If-Match | ADMIN/MANAGER |

### Clientes
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/customers` | Listar | Autenticado |
| POST | `/customers` | Crear | ADMIN/MANAGER |
| GET | `/customers/{id}` | → ETag | Autenticado |
| PATCH | `/customers/{id}` | → If-Match | ADMIN/MANAGER |

## Monedas / Tasas

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/currencies` | Lista monedas | Autenticado |
| POST | `/currencies` | Crear moneda | ADMIN |
| PATCH | `/currencies/{code}` | → If-Match | ADMIN |
| GET | `/exchange-rates` | Listar tasas | Autenticado |
| POST | `/exchange-rates` | Crear tasa | ADMIN |
| GET | `/exchange-rates/latest` | Tasa más reciente | Autenticado |

## Settings

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/settings` | → ETag | ADMIN |
| PATCH | `/settings` | → If-Match | ADMIN |

## Reportes

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/reports/dashboard` | Métricas dashboard | Autenticado |
| GET | `/reports/sales` | Reporte ventas | Autenticado |
| GET | `/reports/inventory` | Reporte inventario | Autenticado |

## Export

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/exports/sales` | CSV/XLSX/PDF ventas | ADMIN/MANAGER |
| GET | `/exports/inventory` | CSV/XLSX/PDF inventario | ADMIN/MANAGER |

## Import

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/imports/csv` | Subir CSV + mapping | ADMIN |
| POST | `/imports/dry-run` | Validar sin aplicar | ADMIN |
| GET | `/imports/{id}/status` | Estado del job | ADMIN |
| GET | `/imports/{id}/result` | Resultado del job | ADMIN |

## Sync Offline

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/sync/push` | Batch ops idempotente | Autenticado |
| GET | `/sync/pull` | Obtener cambios (cursor, limit, warehouseId) | Autenticado |

### Cursor
- Tipo: `bigserial` (id de sync_log)
- Primer pull: `cursor=0`
- Response incluye `newCursor`

---

## Regla Global — Upload con checksum (aplica a TODOS los endpoints de imágenes)

> Todo `POST */images` y `POST */avatar` requiere el header:
> `Content-MD5: <base64(sha256(file_bytes))>`
>
> Si el servidor recibe el archivo y el hash no coincide → `400 Bad Request`:
> ```json
> {
>   "type": "https://errors.app/checksum-mismatch",
>   "title": "Checksum mismatch",
>   "detail": "El archivo llegó corrupto. Esperado: {expected}, recibido: {actual}",
>   "status": 400
> }
> ```
> No se persiste nada si el checksum falla.

---

## Clientes — Imágenes

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/customers/{id}/images` | Subir imagen (multipart, máx 5 MiB, requiere Content-MD5) | ADMIN/MANAGER |
| GET | `/customers/{id}/images` | Listar metadata de imágenes | Autenticado |
| GET | `/customers/{id}/images/{imgId}` | Obtener imagen `?variant=full\|thumb256` | Autenticado |
| DELETE | `/customers/{id}/images/{imgId}` | Eliminar imagen | ADMIN/MANAGER |

---

## Proveedores — Imágenes, Links Sociales, Catálogo

### Imágenes

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/suppliers/{id}/images` | Subir imagen (multipart, máx 5 MiB, requiere Content-MD5) | ADMIN/MANAGER |
| GET | `/suppliers/{id}/images` | Listar metadata de imágenes | Autenticado |
| GET | `/suppliers/{id}/images/{imgId}` | Obtener imagen `?variant=full\|thumb256` | Autenticado |
| DELETE | `/suppliers/{id}/images/{imgId}` | Eliminar imagen | ADMIN/MANAGER |

### Links de Redes Sociales

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/suppliers/{id}/social-links` | Listar links sociales del proveedor | Autenticado |
| POST | `/suppliers/{id}/social-links` | Agregar link social | ADMIN/MANAGER |
| DELETE | `/suppliers/{id}/social-links/{linkId}` | Eliminar link social | ADMIN/MANAGER |

### Catálogo de Productos del Proveedor

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/suppliers/{id}/products` | Listar productos que ofrece el proveedor | Autenticado |
| POST | `/suppliers/{id}/products` | Vincular/agregar producto (del catálogo o texto libre) | ADMIN/MANAGER |
| DELETE | `/suppliers/{id}/products/{entryId}` | Desvincular/eliminar entrada | ADMIN/MANAGER |

---

## Deudas / Fiado

> Las ventas con `paymentMode = CREDIT` o `RESERVE` requieren `customerId` obligatorio.
> Ver modificación de `POST /sales` en la sección de DTOs.

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/debts` | Todas las deudas (filtros: `status`, `customerId`, `dueBefore`, `page`, `size`) | Autenticado |
| GET | `/debts/{id}` | Detalle de deuda con historial de pagos → ETag | Autenticado |
| PATCH | `/debts/{id}` | Actualizar `due_date` / `description` / `notes` / cancelar → If-Match | ADMIN/MANAGER |
| POST | `/debts/{id}/payments` | Registrar pago (parcial o total), requiere Idempotency-Key | Autenticado |
| GET | `/customers/{id}/debts` | Deudas de un cliente específico (filtros: `status`, `page`, `size`) | Autenticado |

### Lógica de estados de deuda (automática, no vía endpoint)
- `paid_amount = 0` → status = `PENDING`
- `0 < paid_amount < original_amount` → status = `PARTIAL`
- `paid_amount = original_amount` → status = `PAID`
- Solo `CANCELLED` se puede setear vía `PATCH /debts/{id}`

---

## Notificaciones

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/notifications` | Inbox del usuario autenticado. Params: `unreadOnly`, `category`, `page`, `size` | Autenticado |
| POST | `/notifications` | Crear notificación manual (a un usuario o broadcast) | Autenticado |
| POST | `/notifications/mark-read` | Marcar lista de IDs como leídas. Body: `{ notificationIds: string[] }` | Autenticado |
| POST | `/notifications/mark-all-read` | Marcar todas las notificaciones del usuario como leídas | Autenticado |
| GET | `/notifications/unread-count` | Retorna `{ count: number }` para badge en header | Autenticado |
| GET | `/notifications/stream` | **SSE** — stream en tiempo real (`text/event-stream`). Emite `NewNotification` events | Autenticado |

> El endpoint SSE (`/notifications/stream`) no usa paginación. El cliente usa `EventSource` nativo con reconexión automática. El servidor usa `Flux<ServerSentEvent>` de Spring WebFlux.
>
> Disparadores automáticos del sistema (no requieren endpoint):
> - `on_hand ≤ reorder_point` → notificación `LOW_STOCK`, target `ALL`
> - `customer_debts.due_date < now` → notificación `DEBT_OVERDUE`, target `ALL` (job periódico)
> - `import_jobs` completa/falla → notificación `IMPORT_DONE`, target `USER` (solo al creador)
> - `sync push` → `409 Conflict` → notificación `SYNC_CONFLICT`, target `USER` (dispositivo que falló)

---

## Sync — Incidencias

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/sync/incidents` | Reportar resolución de incidencia desde el cliente | Autenticado |
| GET | `/sync/incidents` | Listar incidencias del servidor (audit) | ADMIN/MANAGER |

> `POST /sync/incidents` body: `SyncIncidentReportRequest` (ver DTOs)

---

## Dashboard — Stats extendido

> `GET /reports/dashboard` (ya existente) ahora retorna también:
> - `pendingDebtsCount: number`
> - `pendingDebtsTotal: number` (suma en moneda base)
> - `partialDebtsCount: number`
> - `pendingSyncIncidentsCount: number`

---

## POS — Venta rápida

> `POST /sales` (ya existente) acepta el nuevo campo `paymentMode` (ver DTOs).
> No hay endpoint separado para POS. La diferencia es solo el payload.

### Reglas de venta rápida (sin cliente, `paymentMode = IMMEDIATE`):
- `customerId` es **opcional**
- `barcode` puede usarse para identificar el producto (campo en la línea)
- Si no se especifica `soldAt`, el servidor usa `now()`
- La venta se confirma inmediatamente (no queda en DRAFT)
