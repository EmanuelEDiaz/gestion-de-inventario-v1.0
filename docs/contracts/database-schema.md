# Esquema de Base de Datos

## Convenciones

- **PKs**: `uuid` (permiten IDs generados cliente-side para offline)
- **Timestamps**: `created_at`, `updated_at` (timestamptz)
- **Concurrencia**: `version int not null default 0` en entidades mutables (optimistic locking)
  - GET debe incluir `ETag: W/"<version>"`
  - PATCH debe incluir `If-Match: W/"<version>"` (si no coincide → `409 Conflict`)
- **Soft delete**: `status` o `archived_at` según entidad
- **Password hashing**: bcrypt con cost factor 12

## Tablas

### Autenticación

#### users
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| username | text unique | |
| email | text unique null | |
| password_hash | text | bcrypt |
| display_name | text | |
| role | text | ADMIN, MANAGER, SELLER |
| is_active | boolean | |
| created_at/updated_at/version | | |

#### user_images
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK unique | 1 avatar activo |
| content_type | text | image/jpeg, png, webp |
| file_path | text | relativo a MEDIA_ROOT |
| original_filename | text null | |
| size_bytes | bigint | máx 2 MiB |
| created_at | | |

#### refresh_tokens
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK | |
| token_hash | text unique | SHA-256 |
| expires_at | timestamptz | TTL 7 días |
| revoked_at | timestamptz null | |
| created_at | | |

### Catálogo

#### warehouses
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| code | text unique | |
| name | text | |
| is_active | boolean | |
| created_at/updated_at/version | | |

#### categories
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| parent_id | uuid FK null | árbol |
| name | text | |
| path | text | materialized path |
| created_at/updated_at/version | | |

#### products
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| sku | text unique null | |
| barcode | text unique null | |
| name | text | |
| description | text null | |
| category_id | uuid FK null | |
| status | text | ACTIVE, ARCHIVED |
| cost_method | text | inherit o override |
| standard_cost | numeric(19,4) null | |
| reorder_point | numeric(19,4) null | |
| default_currency_code | text FK | |
| created_at/updated_at/version | | |

#### product_images
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| product_id | uuid FK | |
| sort_order | int | >= 0 |
| is_primary | boolean | partial unique |
| content_type | text | |
| file_path | text unique | |
| original_filename | text null | |
| size_bytes | bigint | máx 10 MiB |
| created_at | | |

### Inventario

#### inventory_movements (inmutable)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| warehouse_id | uuid FK | |
| product_id | uuid FK | |
| movement_type | text | PURCHASE, SALE, ADJUSTMENT, etc. |
| quantity | numeric(19,4) | |
| unit_cost | numeric(19,4) null | |
| unit_price | numeric(19,4) null | |
| currency_code | text FK | |
| exchange_rate_id | uuid FK null | |
| source_doc_type | text | |
| source_doc_id | uuid | |
| occurred_at | timestamptz | |
| created_by | uuid FK | |
| created_at | | |

#### stock_balances
| Columna | Tipo | Descripción |
|---------|------|-------------|
| warehouse_id | uuid FK | PK compuesta |
| product_id | uuid FK | PK compuesta |
| on_hand | numeric(19,4) | |
| reserved | numeric(19,4) | default 0 |
| updated_at | | |

### Operaciones

#### purchases / purchase_lines
#### sales / sale_lines
#### transfers / transfer_lines
#### adjustments / adjustment_lines
#### returns / return_lines

(Ver CLAUDE.md original para estructura completa)

### Costos

#### product_cost_state
- warehouse_id, product_id (PK)
- avg_cost numeric(19,4) null
- updated_at

#### fifo_layers
- id uuid PK
- warehouse_id, product_id
- qty_remaining, unit_cost
- source_purchase_line_id
- created_at

### Monedas

#### currencies
- code text PK (CUP, USD, EUR)
- name, symbol, is_active

#### exchange_rates
- id uuid PK
- base_code, quote_code
- rate numeric(19,6)
- rate_type (OFFICIAL, MARKET, CUSTOM)
- valid_from, created_by, created_at

### Sistema

#### app_settings
- id text PK ('global')
- default_cost_method, default_currency_code
- company_name, low_stock_threshold_default
- updated_by, updated_at, version

#### audit_log
- id uuid PK
- actor_id, entity_type, entity_id
- action, before jsonb, after jsonb
- created_at

#### idempotency_keys
- key text PK
- scope, request_hash, response_json
- created_at, expires_at (TTL 72h)

#### sync_log
- id bigserial PK (cursor)
- entity_type, entity_id
- action, payload jsonb
- warehouse_id null
- created_at

#### import_jobs
- id uuid PK
- type, status, original_filename
- mapping_json, result_json
- created_by, created_at, updated_at

### Terceros

#### suppliers
- id, name, contact_name, phone, email, address, notes
- is_active, created_at/updated_at/version

#### customers
- id, name, phone, email, address, notes
- is_active, created_at/updated_at/version

---

## Extensiones a Terceros

### ALTER TABLE suppliers
```sql
ALTER TABLE suppliers ADD COLUMN website text null;
```

### customer_images
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| customer_id | uuid FK → customers | |
| sort_order | int | >= 0; 0 = primera posición |
| is_primary | boolean | partial unique (solo 1 true por customer_id) |
| content_type | text | image/jpeg, image/png, image/webp |
| file_path | text unique | relativo a MEDIA_ROOT |
| original_filename | text null | |
| size_bytes | bigint | máx 5 MiB |
| created_at | timestamptz | |

> Constraint: `UNIQUE (customer_id) WHERE is_primary = true`

### supplier_images
Estructura idéntica a `customer_images` con `supplier_id uuid FK → suppliers` en lugar de `customer_id`.

> Constraint: `UNIQUE (supplier_id) WHERE is_primary = true`

### supplier_social_links
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| supplier_id | uuid FK → suppliers | |
| platform | text | WHATSAPP / TELEGRAM / INSTAGRAM / FACEBOOK / TIKTOK / WEBSITE / OTHER |
| url | text | URL completa o número/handle según plataforma |
| label | text null | etiqueta descriptiva, p.ej. "WhatsApp ventas" |
| sort_order | int default 0 | orden de presentación |
| created_at | timestamptz | |

> Constraint: `CHECK (platform IN ('WHATSAPP','TELEGRAM','INSTAGRAM','FACEBOOK','TIKTOK','WEBSITE','OTHER'))`

### supplier_catalog_products
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| supplier_id | uuid FK → suppliers | |
| product_id | uuid FK null → products | null si es descripción libre |
| description | text null | obligatorio si product_id es null |
| unit_price | numeric(19,4) null | precio acordado con el proveedor (opcional) |
| currency_code | text FK null → currencies | moneda del precio (opcional) |
| notes | text null | |
| created_at | timestamptz | |

> Constraint: `CHECK (product_id IS NOT NULL OR description IS NOT NULL)`

---

## Extensiones a Operaciones

### ALTER TABLE sales
```sql
ALTER TABLE sales
  ADD COLUMN payment_mode text NOT NULL DEFAULT 'IMMEDIATE',
  ADD CONSTRAINT chk_sales_payment_mode
    CHECK (payment_mode IN ('IMMEDIATE','CREDIT','RESERVE')),
  ADD CONSTRAINT chk_sales_credit_requires_customer
    CHECK (payment_mode = 'IMMEDIATE' OR customer_id IS NOT NULL);
```

> `sales.status` agrega el valor `RESERVED` al set existente:
> `DRAFT | CONFIRMED | RESERVED | DELIVERED | CANCELLED`

### customer_debts
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| customer_id | uuid FK → customers | |
| sale_id | uuid FK unique → sales | 1 deuda por venta |
| original_amount | numeric(19,4) NOT NULL | monto total fiado |
| paid_amount | numeric(19,4) DEFAULT 0 | acumulado de pagos parciales |
| currency_code | text FK → currencies | |
| description | text null | descripción libre de lo que se adeuda (ej: "4 kg arroz, 2L aceite del 10/4") |
| status | text | PENDING / PARTIAL / PAID / CANCELLED |
| due_date | timestamptz null | fecha límite de pago (opcional) |
| notes | text null | notas internas del operador |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| version | int DEFAULT 0 | optimistic locking |

> Constraints:
> - `CHECK (status IN ('PENDING','PARTIAL','PAID','CANCELLED'))`
> - `CHECK (paid_amount >= 0 AND paid_amount <= original_amount)`

### debt_payments
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| debt_id | uuid FK → customer_debts | |
| amount | numeric(19,4) NOT NULL | monto de este pago (> 0) |
| payment_method | text null | CASH / TRANSFER / PRODUCT / OTHER |
| notes | text null | |
| registered_by | uuid FK → users | usuario que registró el pago |
| created_at | timestamptz | inmutable |

> Constraint: `CHECK (amount > 0)`

---

## Sistema (nuevas tablas)

### notifications
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| type | text | SYSTEM_AUTO / USER_MANUAL |
| category | text | LOW_STOCK / DEBT_OVERDUE / IMPORT_DONE / SYNC_CONFLICT / MANUAL |
| title | text NOT NULL | título breve de la notificación |
| body | text null | cuerpo extendido (opcional) |
| target_type | text | USER / ALL |
| target_user_id | uuid FK null → users | null cuando target_type = ALL |
| created_by | uuid FK null → users | null cuando type = SYSTEM_AUTO |
| entity_type | text null | tipo de recurso relacionado: "sale", "product", "import_job" |
| entity_id | uuid null | id del recurso relacionado |
| created_at | timestamptz | inmutable |

> Constraints:
> - `CHECK (type IN ('SYSTEM_AUTO','USER_MANUAL'))`
> - `CHECK (target_type IN ('USER','ALL'))`
> - `CHECK (target_type = 'ALL' OR target_user_id IS NOT NULL)`
> - `CHECK (category IN ('LOW_STOCK','DEBT_OVERDUE','IMPORT_DONE','SYNC_CONFLICT','MANUAL'))`

### notification_reads
| Columna | Tipo | Descripción |
|---------|------|-------------|
| notification_id | uuid FK → notifications | PK compuesta |
| user_id | uuid FK → users | PK compuesta |
| read_at | timestamptz | |

> PRIMARY KEY (notification_id, user_id)

### sync_incidents *(auditoría de conflictos de sync)*
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| device_id | text | identificador del dispositivo origen |
| operation_id | text | UUID del outbox entry relacionado |
| entity_type | text | PRODUCT / SALE / CUSTOMER / SUPPLIER / etc. |
| entity_id | uuid | id de la entidad en conflicto |
| incident_type | text | STOCK_CONFLICT / ENTITY_DUPLICATE / VERSION_MISMATCH / VALIDATION_ERROR / CHECKSUM_ERROR |
| server_state | jsonb null | estado del servidor al momento del conflicto |
| client_state | jsonb | payload que el cliente intentó enviar |
| error_code | text | código HTTP + detalle |
| resolution | text null | DISCARD_MINE / REPLACE_SERVER / EDIT_AND_RETRY / FORGET_SALE / CHANGE_PRODUCT |
| status | text | PENDING / RESOLVED / IGNORED |
| occurred_at | timestamptz | |
| resolved_at | timestamptz null | |
| resolved_by | uuid FK null → users | |

> Constraints:
> - `CHECK (incident_type IN ('STOCK_CONFLICT','ENTITY_DUPLICATE','VERSION_MISMATCH','VALIDATION_ERROR','CHECKSUM_ERROR','NETWORK_ABORT'))`
> - `CHECK (status IN ('PENDING','RESOLVED','IGNORED'))`
> - `CHECK (resolution IN ('DISCARD_MINE','REPLACE_SERVER','EDIT_AND_RETRY','FORGET_SALE','CHANGE_PRODUCT') OR resolution IS NULL)`

---

## IndexedDB Schema — Extensiones (idb v8+)
> Esta sección documenta el esquema del lado cliente (frontend). No es SQL.

### Stores nuevos

| Store | Keys índice | Propósito |
|-------|------------|-----------|
| `syncIncidents` | `++id, incidentId, entityType, status, occurredAt` | Registro local de incidencias |
| `uploadQueue` | `++id, fileId, entityType, entityId, status` | Cola de subida atómica de archivos |
| `customerDebts` | `id, customerId, saleId, status` | Caché de deudas para modo offline |
| `notifications` | `id, targetUserId, category, createdAt` | Caché de notificaciones |

### OutboxEntry — campos extendidos
```typescript
interface OutboxEntry {
  id?: number                    // auto-increment
  operationId: string            // UUID v4 — idempotency key
  entityType: string
  entityId: string
  action: string                 // CREATE | UPDATE | CANCEL
  payload: object
  occurredAt: string
  expectedVersion?: number
  status: 'pending' | 'syncing' | 'accepted' | 'rejected'
  retryCount: number
  lastError?: string
  isOfflineCreated: boolean      // true si se creó sin conexión
  hasUniqueRisk: boolean         // true si tiene SKU/barcode → riesgo duplicado
  createdAt: string
}
```

### UploadQueueEntry
```typescript
interface UploadQueueEntry {
  id?: number
  fileId: string                 // UUID
  entityType: string             // PRODUCT | CUSTOMER | SUPPLIER | USER
  entityId: string
  file: Blob
  filename: string
  contentType: string
  sizeBytes: number
  checksumSha256: string         // calculado antes de encolar
  isPrimary: boolean
  sortOrder: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  retryCount: number
  lastError?: string
  createdAt: string
}
```

### SyncIncident (IndexedDB)
```typescript
interface SyncIncident {
  id?: number
  incidentId: string
  operationId: string
  entityType: string
  entityId: string
  incidentType: 'STOCK_CONFLICT' | 'ENTITY_DUPLICATE' | 'VERSION_MISMATCH'
              | 'VALIDATION_ERROR' | 'CHECKSUM_ERROR' | 'NETWORK_ABORT'
  serverState?: Record<string, unknown>
  myState: Record<string, unknown>
  errorCode: string
  errorMessage: string
  availableActions: ResolutionAction[]
  resolution?: ResolutionAction
  status: 'PENDING' | 'RESOLVED' | 'IGNORED'
  occurredAt: string
  resolvedAt?: string
}

type ResolutionAction =
  | 'DISCARD_MINE'       // descartar mi versión
  | 'REPLACE_SERVER'     // reemplazar la del servidor (solo ADMIN)
  | 'EDIT_AND_RETRY'     // editar y reintentar
  | 'FORGET_SALE'        // olvidar la venta (para STOCK_CONFLICT)
  | 'CHANGE_PRODUCT'     // cambiar producto de la venta
```

---

## Migración Flyway
```
V2__extend_suppliers_customers_credit_notifications.sql
```
Orden de ejecución:
1. `customer_images`, `supplier_images`
2. `supplier_social_links`, `supplier_catalog_products`
3. `ALTER TABLE suppliers ADD COLUMN website`
4. `ALTER TABLE sales ADD COLUMN payment_mode`
5. `customer_debts`, `debt_payments`
6. `notifications`, `notification_reads`
7. `sync_incidents`
