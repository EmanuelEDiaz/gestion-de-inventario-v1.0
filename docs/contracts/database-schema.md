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
