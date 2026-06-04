# Database Schema — PostgreSQL 17

> Created: 2026-06-02 | Basado en migraciones Flyway V1–V26
> Backend: Spring Boot 3.4 + WebFlux + R2DBC. Migraciones via Flyway + JDBC.
> DB: `inventory` en PostgreSQL 17, usuario `postgres`

## Conexión

| Propiedad | Valor |
|-----------|-------|
| R2DBC (runtime) | `r2dbc:postgresql://localhost:5432/inventory` |
| JDBC (Flyway) | `jdbc:postgresql://localhost:5432/inventory` |
| Usuario | `postgres` |
| Password | `postgres` |
| Pool | `spring.r2dbc.pool.max-size=20` |
| Flyway | `baseline-on-migrate: true`, `out-of-order: true` |

## Convenciones

- **PKs**: `UUID PRIMARY KEY DEFAULT gen_random_uuid()` (excepto `sync_log` bigserial, `currencies` code text)
- **Timestamps**: `TIMESTAMPTZ NOT NULL DEFAULT NOW()` en todos los `created_at`
- **Optimistic locking**: `version INT NOT NULL DEFAULT 0` en todas las tablas mutables
- **Soft delete**: No existe — `is_active BOOLEAN` en users, suppliers, customers, products (status), warehouses
- **Password hash**: bcrypt cost 12 (`$2a$12$...`)
- **Moneda**: `NUMERIC(19,4)` para cantidades monetarias, `NUMERIC(19,6)` para tasas de cambio

## Migraciones por Versión

| Versión | Archivo | Tablas creadas | Seed data |
|---------|---------|----------------|-----------|
| V1 | `initial_schema` | permissions, roles, role_permissions, users, user_images, refresh_tokens, currencies, app_settings, audit_log, idempotency_keys, sync_log | 3 monedas, 45 permisos, 2 roles, admin user, app_settings global |
| V2 | `fix_admin_user` | — | 18 permisos adicionales (estilo mayúsculas), upsert admin + roles |
| V3 | `fix_admin_password` | — | UPDATE password hash admin |
| V4 | `catalog_base` | exchange_rates, warehouses, categories, suppliers, customers, products, product_images | 1 moneda (MLC), 1 warehouse (PRINCIPAL), ALTER TABLE audit_log/idempotency_keys |
| V5 | `inventory_operations` | stock_balances, product_cost_state, fifo_layers, inventory_movements, purchases, purchase_lines, sales, sale_lines, transfers, transfer_lines, adjustments, adjustment_lines | 4 sequences (purchase_number_seq, sale_number_seq, transfer_number_seq, adjustment_number_seq) |
| V6 | `transfers_adjustments` | — | RENAME COLUMN completed_date → received_date, ADD status CONFIRMED |
| V7 | `adjustment_sequence` | — | CREATE SEQUENCE adjustment_number_seq (idempotent) |
| V8 | `return_sequences` | — | CREATE SEQUENCE sale_return_number_seq, purchase_return_number_seq |
| V9 | `extend_suppliers_customers_credit_notifications` | customer_images, supplier_images, supplier_social_links, supplier_catalog_products, customer_debts, debt_payments, notifications, notification_reads, sync_incidents | ALTER suppliers.website, ALTER sales.payment_mode |
| V11 | `create_notifications_tables` | notifications, notification_reads (backup if V9 skipped) | — |
| V13 | `add_main_image_to_products` | — | ALTER products.main_image, backfill from product_images |
| V14 | `enhance_notifications` | notification_preferences, notification_schedules | ALTER notifications (6 columnas: source, priority, action_url, tags, delivery_channel, version) |
| V15 | `add_system_settings` | system_settings | 6 settings del sistema |
| V16 | `add_import_jobs` | import_jobs | — |
| V17 | `add_audit_log_archive` | audit_log_archive (LIKE audit_log) | — |
| V18 | `add_device_cursors` | device_cursors | — |
| V19 | `add_sync_log_indices` | — | CREATE INDEX idx_sync_log_entity_type_id, ... |
| V20 | `add_permissions_icon` | — | ALTER permissions.icon |
| V21 | `add_geo_regions` | geo_regions | 15 provincias, ~170 municipios Cuba |
| V22 | `add_structured_address` | — | ALTER suppliers/customers (province, municipality, street, locality, zip_code, latitude, longitude) |
| V23 | `seed_exchange_rates` | — | 15 tasas de cambio históricas (USD/CUP, EUR/CUP, USD/MLC, MLC/CUP, USD/EUR) |
| V24 | `seed_test_data` | — | 3 warehouses, 12 categorías, 6 suppliers, 8 customers, 24 products, stock balances, 3 purchases+lines, 3 sales+lines, 1 debt, 2 transfers+lines, 2 adjustments+lines |
| V25 | `roles_unique_code_partial` | — | DROP UNIQUE roles.code, CREATE partial UNIQUE INDEX uq_roles_code_active |
| V26 | `add_user_preferences` | — | ALTER users.preferences (TEXT DEFAULT '{}') |

---

## Tablas por Módulo

### 🔐 RBAC y Usuarios

#### `permissions`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| code | VARCHAR(100) UNIQUE | `products:read`, `sales:create` |
| name | VARCHAR(200) | Nombre legible |
| category | VARCHAR(50) | Agrupación: dashboard, users, roles, products, categories, warehouses, stock, sales, purchases, transfers, adjustments, returns, suppliers, customers, finance, settings, reports, imports, audit |
| icon | TEXT | (V20) Ícono para UI |
| created_at | TIMESTAMPTZ | |

#### `roles`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| code | VARCHAR(100) UNIQUE (partial, active only) | `ADMIN`, `SELLER` |
| name | VARCHAR(200) | |
| description | TEXT | |
| is_system | BOOLEAN | Sistema no editable |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| version | INT | Optimistic lock |

#### `role_permissions`
| Columna | Tipo |
|---------|------|
| role_id | UUID FK → roles(id) ON DELETE CASCADE |
| permission_id | UUID FK → permissions(id) ON DELETE CASCADE |
| granted_at | TIMESTAMPTZ |
| PK | (role_id, permission_id) |

#### `users`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| username | VARCHAR(100) UNIQUE | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt cost 12 |
| display_name | VARCHAR(200) | |
| role_id | UUID FK → roles(id) | |
| is_active | BOOLEAN | |
| preferences | TEXT | (V26) JSON con preferencias, default `'{}'` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| version | INT | |

#### `user_images`
| Columna | Tipo | Restricción |
|---------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users(id) ON DELETE CASCADE | UNIQUE |
| content_type | VARCHAR(50) | CHECK: image/jpeg, image/png, image/webp |
| file_path | VARCHAR(500) UNIQUE | |
| original_filename | VARCHAR(255) | |
| size_bytes | BIGINT | CHECK: >0 AND ≤2097152 (2 MiB) |
| created_at | TIMESTAMPTZ | |

#### `refresh_tokens`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users(id) ON DELETE CASCADE | |
| token_hash | VARCHAR(64) UNIQUE | SHA-256 del token |
| expires_at | TIMESTAMPTZ | 7 días |
| revoked_at | TIMESTAMPTZ | Null si activo |
| created_at | TIMESTAMPTZ | |

---

### 💰 Monedas y Configuración

#### `currencies`
| Columna | Tipo |
|---------|------|
| code | VARCHAR(3) PK |
| name | VARCHAR(100) |
| symbol | VARCHAR(10) |
| is_active | BOOLEAN |

Seed: CUP ($), USD ($), EUR (€), MLC (MLC)

#### `exchange_rates`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| base_code | TEXT FK → currencies(code) |
| quote_code | TEXT FK → currencies(code) |
| rate | NUMERIC(19,6) CHECK >0 |
| rate_type | TEXT CHECK (OFFICIAL, MARKET, CUSTOM) |
| valid_from | TIMESTAMPTZ |
| created_by | UUID FK → users(id) |
| created_at | TIMESTAMPTZ |

#### `app_settings`
| Columna | Tipo | Default |
|---------|------|---------|
| id | VARCHAR(50) PK | 'global' |
| default_cost_method | VARCHAR(20) | 'STANDARD' (CHECK: STANDARD, WAC, FIFO) |
| default_currency_code | VARCHAR(3) FK → currencies(code) | 'CUP' |
| company_name | VARCHAR(200) | null |
| low_stock_threshold_default | NUMERIC(19,4) | null |
| updated_by | UUID FK → users(id) | null |
| updated_at | TIMESTAMPTZ | |
| version | INT | |

#### `system_settings`
| Columna | Tipo |
|---------|------|
| key | VARCHAR(100) PK |
| value | TEXT NOT NULL |
| value_type | VARCHAR(20) DEFAULT 'string' (integer, boolean, string, cron) |
| description | TEXT |
| is_public | BOOLEAN DEFAULT FALSE |
| updated_by | UUID FK → users(id) |
| updated_at | TIMESTAMPTZ |

Seeds: audit.retention-days-hot (90), audit.retention-days-archive (365), import.retention-days (7), sync.outbox-limit (500), sync.retention-days (30), sync.pull-interval-seconds (30)

---

### 📦 Catálogo

#### `warehouses`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| code | TEXT UNIQUE |
| name | TEXT NOT NULL |
| address | TEXT |
| is_active | BOOLEAN DEFAULT TRUE |
| province | TEXT | (V22) |
| municipality | TEXT | (V22) |
| street | TEXT | (V22) |
| locality | TEXT | (V22) |
| zip_code | TEXT | (V22) |
| latitude | NUMERIC | (V22) |
| longitude | NUMERIC | (V22) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| version | INT |

#### `categories` (árbol con materialized path)
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| parent_id | UUID FK → categories(id) ON DELETE SET NULL |
| name | TEXT NOT NULL |
| path | TEXT DEFAULT '' | materialized path ej: `/alimentos-bebidas/bebidas` |
| level | INT DEFAULT 0 |
| sort_order | INT DEFAULT 0 |
| is_active | BOOLEAN DEFAULT TRUE |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| version | INT |

#### `products`
| Columna | Tipo | Default |
|---------|------|---------|
| id | UUID PK | |
| sku | TEXT UNIQUE | |
| barcode | TEXT UNIQUE | |
| name | TEXT NOT NULL | |
| description | TEXT | |
| category_id | UUID FK → categories(id) ON DELETE SET NULL | |
| status | TEXT | 'ACTIVE' (CHECK: ACTIVE, ARCHIVED) |
| cost_method | TEXT | 'INHERIT' (CHECK: INHERIT, STANDARD, WAC, FIFO) |
| standard_cost | NUMERIC(19,4) | |
| sale_price | NUMERIC(19,4) | |
| reorder_point | NUMERIC(19,4) | |
| default_currency_code | TEXT FK → currencies(code) | 'CUP' |
| tax_rate | NUMERIC(5,2) | 0 |
| unit_of_measure | TEXT | 'UNIT' |
| main_image | TEXT | (V13) file path de imagen principal |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| version | INT | |

#### `product_images`
| Columna | Tipo | Restricción |
|---------|------|-------------|
| id | UUID PK | |
| product_id | UUID FK → products(id) ON DELETE CASCADE | |
| sort_order | INT DEFAULT 0 | |
| is_primary | BOOLEAN DEFAULT FALSE | UNIQUE partial por producto |
| content_type | TEXT NOT NULL | |
| file_path | TEXT UNIQUE | |
| thumbnail_path | TEXT | |
| original_filename | TEXT | |
| size_bytes | BIGINT | CHECK ≤10485760 (10 MiB) |
| created_at | TIMESTAMPTZ | |

#### `suppliers`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| code | TEXT UNIQUE |
| name | TEXT NOT NULL |
| contact_name | TEXT |
| phone | TEXT |
| email | TEXT |
| address | TEXT |
| notes | TEXT |
| is_active | BOOLEAN DEFAULT TRUE |
| website | TEXT | (V9) |
| province | TEXT | (V22) |
| municipality | TEXT | (V22) |
| street | TEXT | (V22) |
| locality | TEXT | (V22) |
| zip_code | TEXT | (V22) |
| latitude | NUMERIC | (V22) |
| longitude | NUMERIC | (V22) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| version | INT |

#### `supplier_images`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| supplier_id | UUID FK → suppliers(id) ON DELETE CASCADE |
| sort_order | INT DEFAULT 0 |
| is_primary | BOOLEAN DEFAULT FALSE (UNIQUE partial) |
| content_type | TEXT NOT NULL |
| file_path | TEXT UNIQUE |
| original_filename | TEXT |
| size_bytes | BIGINT |
| created_at | TIMESTAMPTZ |

#### `supplier_social_links`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| supplier_id | UUID FK → suppliers(id) ON DELETE CASCADE |
| platform | TEXT NOT NULL |
| url | TEXT NOT NULL |
| label | TEXT |
| sort_order | INT DEFAULT 0 |

#### `supplier_catalog_products`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| supplier_id | UUID FK → suppliers(id) ON DELETE CASCADE |
| product_id | UUID FK → products(id) ON DELETE SET NULL |
| description | TEXT |
| unit_price | NUMERIC(19,4) |
| currency_code | TEXT FK → currencies(code) |

#### `customers`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| code | TEXT UNIQUE |
| name | TEXT NOT NULL |
| contact_name | TEXT |
| phone | TEXT |
| email | TEXT |
| address | TEXT |
| notes | TEXT |
| is_active | BOOLEAN DEFAULT TRUE |
| province | TEXT | (V22) |
| municipality | TEXT | (V22) |
| street | TEXT | (V22) |
| locality | TEXT | (V22) |
| zip_code | TEXT | (V22) |
| latitude | NUMERIC | (V22) |
| longitude | NUMERIC | (V22) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| version | INT |

#### `customer_images`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| customer_id | UUID FK → customers(id) ON DELETE CASCADE |
| sort_order | INT DEFAULT 0 |
| is_primary | BOOLEAN DEFAULT FALSE (UNIQUE partial) |
| content_type | TEXT NOT NULL |
| file_path | TEXT UNIQUE |
| original_filename | TEXT |
| size_bytes | BIGINT |
| created_at | TIMESTAMPTZ |

---

### 📊 Inventario y Stock

#### `stock_balances`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| warehouse_id | UUID FK → warehouses(id) | PK compuesta |
| product_id | UUID FK → products(id) | PK compuesta |
| on_hand | NUMERIC(19,4) DEFAULT 0 | Stock físico actual |
| reserved | NUMERIC(19,4) DEFAULT 0 | Stock reservado (ventas CONFIRMED) |
| available | NUMERIC(19,4) GENERATED ALWAYS AS (on_hand - reserved) STORED | Stock disponible |
| avg_cost | NUMERIC(19,4) | Costo promedio |
| updated_at | TIMESTAMPTZ | |

#### `product_cost_state`
| Columna | Tipo |
|---------|------|
| warehouse_id | UUID FK → warehouses(id) | PK |
| product_id | UUID FK → products(id) | PK |
| avg_cost | NUMERIC(19,4) |
| total_qty | NUMERIC(19,4) DEFAULT 0 |
| total_value | NUMERIC(19,4) DEFAULT 0 |
| updated_at | TIMESTAMPTZ |

#### `fifo_layers`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| warehouse_id | UUID FK → warehouses(id) |
| product_id | UUID FK → products(id) |
| qty_remaining | NUMERIC(19,4) CHECK ≥0 |
| unit_cost | NUMERIC(19,4) NOT NULL |
| source_doc_type | TEXT NOT NULL |
| source_doc_id | UUID NOT NULL |
| created_at | TIMESTAMPTZ |

#### `inventory_movements` (ledger inmutable)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| warehouse_id | UUID FK → warehouses(id) | |
| product_id | UUID FK → products(id) | |
| movement_type | TEXT | CHECK: PURCHASE, SALE, SALE_RETURN, PURCHASE_RETURN, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_IN, TRANSFER_OUT, INITIAL |
| quantity | NUMERIC(19,4) NOT NULL | |
| unit_cost | NUMERIC(19,4) | |
| unit_price | NUMERIC(19,4) | |
| total_cost | NUMERIC(19,4) | |
| total_price | NUMERIC(19,4) | |
| currency_code | TEXT FK → currencies(code) | |
| exchange_rate | NUMERIC(19,6) DEFAULT 1 | |
| balance_after | NUMERIC(19,4) NOT NULL | |
| source_doc_type | TEXT NOT NULL | |
| source_doc_id | UUID NOT NULL | |
| notes | TEXT | |
| occurred_at | TIMESTAMPTZ | |
| created_by | UUID FK → users(id) | |
| created_at | TIMESTAMPTZ | |

---

### 📋 Operaciones

#### `purchases`
| Columna | Tipo | Default |
|---------|------|---------|
| id | UUID PK | |
| purchase_number | TEXT UNIQUE | |
| supplier_id | UUID FK → suppliers(id) | |
| warehouse_id | UUID FK → warehouses(id) | |
| status | TEXT | 'DRAFT' (CHECK: DRAFT, CONFIRMED, RECEIVED, CANCELLED) |
| currency_code | TEXT | 'CUP' |
| exchange_rate | NUMERIC(19,6) | 1 |
| subtotal | NUMERIC(19,4) | 0 |
| tax_amount | NUMERIC(19,4) | 0 |
| total | NUMERIC(19,4) | 0 |
| notes | TEXT | |
| purchase_date | DATE | |
| received_date | DATE | |
| created_by | UUID FK → users(id) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| version | INT | |

#### `purchase_lines`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| purchase_id | UUID FK → purchases(id) ON DELETE CASCADE |
| product_id | UUID FK → products(id) |
| quantity | NUMERIC(19,4) CHECK >0 |
| unit_cost | NUMERIC(19,4) CHECK ≥0 |
| total_cost | NUMERIC(19,4) |
| received_qty | NUMERIC(19,4) DEFAULT 0 |
| sort_order | INT DEFAULT 0 |
| created_at | TIMESTAMPTZ |

#### `sales`
| Columna | Tipo | Default |
|---------|------|---------|
| id | UUID PK | |
| sale_number | TEXT UNIQUE | |
| customer_id | UUID FK → customers(id) | |
| warehouse_id | UUID FK → warehouses(id) | |
| status | TEXT | 'DRAFT' (CHECK: DRAFT, CONFIRMED, DELIVERED, CANCELLED, VOIDED) |
| currency_code | TEXT FK | 'CUP' |
| exchange_rate | NUMERIC(19,6) | 1 |
| subtotal | NUMERIC(19,4) | 0 |
| discount_amount | NUMERIC(19,4) | 0 |
| tax_amount | NUMERIC(19,4) | 0 |
| total | NUMERIC(19,4) | 0 |
| amount_paid | NUMERIC(19,4) | 0 |
| payment_method | TEXT | |
| payment_mode | TEXT | (V9) 'IMMEDIATE' (CHECK: IMMEDIATE, CREDIT, RESERVE) |
| notes | TEXT | |
| sale_date | DATE | |
| created_by | UUID FK → users(id) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| version | INT | |

#### `sale_lines`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| sale_id | UUID FK → sales(id) ON DELETE CASCADE |
| product_id | UUID FK → products(id) |
| quantity | NUMERIC(19,4) CHECK >0 |
| unit_price | NUMERIC(19,4) CHECK ≥0 |
| unit_cost | NUMERIC(19,4) |
| discount_pct | NUMERIC(5,2) DEFAULT 0 |
| total_price | NUMERIC(19,4) |
| sort_order | INT DEFAULT 0 |
| created_at | TIMESTAMPTZ |

#### `transfers`
| Columna | Tipo | Default |
|---------|------|---------|
| id | UUID PK | |
| transfer_number | TEXT UNIQUE | |
| from_warehouse_id | UUID FK → warehouses(id) | CHECK ≠ to |
| to_warehouse_id | UUID FK → warehouses(id) | CHECK ≠ from |
| status | TEXT | 'DRAFT' (CHECK: DRAFT, CONFIRMED, IN_TRANSIT, COMPLETED, CANCELLED) |
| notes | TEXT | |
| transfer_date | DATE | |
| received_date | DATE | (RENAME de completed_date en V6) |
| created_by | UUID FK → users(id) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| version | INT | |

#### `transfer_lines`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| transfer_id | UUID FK → transfers(id) ON DELETE CASCADE |
| product_id | UUID FK → products(id) |
| quantity | NUMERIC(19,4) CHECK >0 |
| unit_cost | NUMERIC(19,4) |
| received_qty | NUMERIC(19,4) DEFAULT 0 |
| sort_order | INT DEFAULT 0 |
| created_at | TIMESTAMPTZ |

#### `adjustments`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| adjustment_number | TEXT UNIQUE |
| warehouse_id | UUID FK → warehouses(id) |
| adjustment_type | TEXT CHECK: COUNT, DAMAGE, LOSS, FOUND, CORRECTION, OTHER |
| status | TEXT CHECK: DRAFT, APPROVED, CANCELLED |
| reason | TEXT |
| notes | TEXT |
| adjustment_date | DATE |
| approved_by | UUID FK → users(id) |
| approved_at | TIMESTAMPTZ |
| created_by | UUID FK → users(id) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| version | INT |

#### `adjustment_lines`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| adjustment_id | UUID FK → adjustments(id) ON DELETE CASCADE |
| product_id | UUID FK → products(id) |
| quantity_change | NUMERIC(19,4) NOT NULL |
| unit_cost | NUMERIC(19,4) |
| reason | TEXT |
| sort_order | INT DEFAULT 0 |
| created_at | TIMESTAMPTZ |

---

### 🔄 Devoluciones

> Nota: No hay tabla `returns` en PostgreSQL — las devoluciones se manejan como movimientos de inventario (`inventory_movements.movement_type = 'SALE_RETURN'` o `'PURCHASE_RETURN'`). El frontend tiene store `returns` en IndexedDB para cache.

---

### 💳 Crédito / Fiado

#### `customer_debts`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| customer_id | UUID FK → customers(id) |
| sale_id | UUID FK → sales(id) UNIQUE |
| original_amount | NUMERIC(19,4) NOT NULL |
| paid_amount | NUMERIC(19,4) DEFAULT 0 |
| currency_code | TEXT FK → currencies(code) |
| status | TEXT DEFAULT 'PENDING' |
| description | TEXT |
| due_date | TIMESTAMPTZ |
| notes | TEXT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| version | BIGINT DEFAULT 0 |

#### `debt_payments`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| debt_id | UUID FK → customer_debts(id) |
| amount | NUMERIC(19,4) NOT NULL |
| payment_method | TEXT |
| notes | TEXT |
| registered_by | UUID FK → users(id) |
| created_at | TIMESTAMPTZ |

---

### 🔔 Notificaciones

#### `notifications`
| Columna | Tipo | Default |
|---------|------|---------|
| id | UUID PK | |
| type | TEXT NOT NULL | |
| category | TEXT NOT NULL | |
| title | TEXT NOT NULL | |
| body | TEXT | |
| target_type | TEXT NOT NULL | |
| target_user_id | UUID FK → users(id) | |
| created_by | UUID FK → users(id) | |
| entity_type | TEXT | |
| entity_id | UUID | |
| source | VARCHAR(50) | (V14) 'SYSTEM' (CHECK: SYSTEM, USER, INTEGRATION, SCHEDULED_TASK) |
| priority | VARCHAR(50) | (V14) 'MEDIUM' (CHECK: LOW, MEDIUM, HIGH, CRITICAL) |
| action_url | TEXT | (V14) |
| tags | TEXT[] | (V14) DEFAULT ARRAY[] |
| delivery_channel | VARCHAR(50) | (V14) 'SSE' (CHECK: SSE, TOAST, PUSH) |
| version | INT | (V14) DEFAULT 1 |
| created_at | TIMESTAMPTZ | |

#### `notification_reads`
| Columna | Tipo |
|---------|------|
| notification_id | UUID FK → notifications(id) |
| user_id | UUID FK → users(id) |
| read_at | TIMESTAMPTZ DEFAULT NOW() |
| PK | (notification_id, user_id) |

#### `notification_preferences`
| Columna | Tipo | Default |
|---------|------|---------|
| id | UUID PK | |
| user_id | UUID FK → users(id) UNIQUE | |
| enabled | BOOLEAN | TRUE |
| low_stock_enabled | BOOLEAN | TRUE |
| sync_enabled | BOOLEAN | TRUE |
| operations_enabled | BOOLEAN | TRUE |
| debt_enabled | BOOLEAN | TRUE |
| user_actions_enabled | BOOLEAN | TRUE |
| system_enabled | BOOLEAN | TRUE |
| push_notifications_enabled | BOOLEAN | FALSE |
| toast_notifications_enabled | BOOLEAN | TRUE |
| sse_enabled | BOOLEAN | TRUE |
| sound_enabled | BOOLEAN | TRUE |
| desktop_notification_enabled | BOOLEAN | FALSE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `notification_schedules` (quiet hours)
| Columna | Tipo | Default |
|---------|------|---------|
| id | UUID PK | |
| user_id | UUID FK → users(id) UNIQUE | |
| quiet_hours_start | TIME | '22:00:00' |
| quiet_hours_end | TIME | '08:00:00' |
| quiet_hours_enabled | BOOLEAN | FALSE |
| quiet_days_list | INT[] | ARRAY[] |
| bypass_on_critical | BOOLEAN | TRUE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### 🗺️ Regiones Geográficas

#### `geo_regions`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID PK | |
| type | TEXT NOT NULL | 'province' o 'municipality' |
| code | TEXT NOT NULL | Código ISO o interno |
| name | TEXT NOT NULL | |
| parent_id | UUID | FK a provincia (null si es provincia) |
| latitude | NUMERIC | |
| longitude | NUMERIC | |
| sort_order | INT | |

---

### 📋 Sync y Offline

#### `sync_log`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | BIGSERIAL PK | Cursor de sync |
| entity_type | VARCHAR(100) NOT NULL | |
| entity_id | UUID NOT NULL | |
| action | VARCHAR(20) NOT NULL | CREATE, UPDATE, DELETE |
| payload | JSONB | |
| warehouse_id | UUID | Opcional, para filtrar |
| created_at | TIMESTAMPTZ | |

#### `device_cursors`
| Columna | Tipo |
|---------|------|
| device_id | UUID PK |
| user_id | UUID FK → users(id) |
| last_cursor | BIGINT DEFAULT 0 |
| last_seen_at | TIMESTAMPTZ DEFAULT NOW() |
| user_agent | VARCHAR(500) |
| created_at | TIMESTAMPTZ DEFAULT NOW() |

#### `idempotency_keys`
| Columna | Tipo | Default |
|---------|------|---------|
| key | VARCHAR(100) PK | |
| scope | VARCHAR(50) NOT NULL | |
| request_hash | VARCHAR(64) | |
| response_json | JSONB | |
| status | TEXT | (V4) 'PENDING' |
| created_at | TIMESTAMPTZ | |
| expires_at | TIMESTAMPTZ | NOW() + INTERVAL '72 hours' |

#### `sync_incidents`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| device_id | TEXT NOT NULL |
| operation_id | TEXT UNIQUE |
| entity_type | TEXT NOT NULL |
| entity_id | TEXT NOT NULL |
| incident_type | TEXT NOT NULL |
| status | TEXT DEFAULT 'PENDING' |
| my_payload | JSONB |
| server_payload | JSONB |
| resolution | TEXT |
| user_id | UUID FK → users(id) |
| created_at | TIMESTAMPTZ |
| resolved_at | TIMESTAMPTZ |

---

### 📝 Auditoría e Import

#### `audit_log`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| actor_id | UUID FK → users(id) |
| actor_name | TEXT | (V4, legacy) |
| entity_type | VARCHAR(100) NOT NULL |
| entity_id | UUID NOT NULL |
| action | VARCHAR(50) NOT NULL |
| before_data | JSONB |
| after_data | JSONB |
| ip_address | TEXT | (V4) |
| created_at | TIMESTAMPTZ |

#### `audit_log_archive`
| Columna | Tipo |
|---------|------|
| (LIKE audit_log INCLUDING ALL) | |

#### `import_jobs`
| Columna | Tipo |
|---------|------|
| id | UUID PK |
| type | VARCHAR(50) NOT NULL |
| status | VARCHAR(20) DEFAULT 'PENDING' |
| original_filename | VARCHAR(255) NOT NULL |
| mapping_json | TEXT |
| result_json | TEXT |
| error_message | TEXT |
| created_by | UUID FK → users(id) |
| created_at | TIMESTAMPTZ DEFAULT NOW() |
| updated_at | TIMESTAMPTZ DEFAULT NOW() |

---

### Secuencias

| Nombre | Propósito |
|--------|-----------|
| `purchase_number_seq` | Números de compra (PO-2025-NNN) |
| `sale_number_seq` | Números de venta (SALE-2025-NNN) |
| `transfer_number_seq` | Números de transferencia (TRF-2025-NNN) |
| `adjustment_number_seq` | Números de ajuste (ADJ-2025-NNN) |
| `sale_return_number_seq` | Números de devolución de venta |
| `purchase_return_number_seq` | Números de devolución de compra |

---

### Índices Principales

| Tabla | Índice | Tipo |
|-------|--------|------|
| users | idx_users_username | B-tree |
| users | idx_users_email | B-tree (partial, NOT NULL) |
| products | idx_products_sku | B-tree (partial, NOT NULL) |
| products | idx_products_name | GIN (to_tsvector spanish) |
| categories | idx_categories_path | B-tree |
| stock_balances | idx_stock_balances_product | B-tree |
| inventory_movements | idx_movements_warehouse_product | B-tree |
| sales | idx_sales_number | B-tree |
| sync_log | idx_sync_log_cursor | B-tree (id) |
| sync_log | idx_sync_log_entity_type_id | B-tree (entity_type, id) |
| idempotency_keys | idx_idempotency_expires | B-tree |
| audit_log | idx_audit_entity | B-tree (entity_type, entity_id) |
| roles | uq_roles_code_active | UNIQUE partial (is_active = TRUE) |
