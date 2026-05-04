# Domain Glossary — Inventario Offline-First

## Core Entities

| Term | Definition |
|------|-----------|
| **Product** | An item tracked in inventory. Has SKU, barcode (optional), name, category, cost method, and belongs to one or more warehouses via stock balances. |
| **Warehouse** | A physical or logical location where products are stored. Each has a unique code. Stock is tracked per warehouse. |
| **Category** | Hierarchical classification of products (tree structure with `parent_id`). |
| **Supplier** | External party from whom products are purchased. |
| **Customer** | External party to whom products are sold. |

## Inventory Operations

| Term | Definition |
|------|-----------|
| **Purchase** | Inbound transaction: products enter a warehouse from a supplier. Increases stock. |
| **Sale** | Outbound transaction: products leave a warehouse to a customer. Decreases stock. Captures unit cost at sale time for profit calculation. |
| **Transfer** | Movement of products between two warehouses. Creates TRANSFER_OUT from source and TRANSFER_IN at target. |
| **Adjustment** | Manual correction of stock (count, damage, correction). Can increase or decrease stock. |
| **Return** | Products returned from a customer (RETURN_FROM_CUSTOMER → increases stock) or to a supplier (RETURN_TO_SUPPLIER → decreases stock). |

## Inventory Tracking

| Term | Definition |
|------|-----------|
| **Inventory Movement** | Immutable ledger entry recording any stock change (purchase, sale, transfer, adjustment, return). Append-only. |
| **Stock Balance** | Materialized view of current on-hand and reserved quantities per (warehouse, product). Derived from movements. |
| **Ledger Pattern** | All stock changes are recorded as immutable movement entries. Balances are computed/cached from movements. |

## Costing Methods

| Term | Definition |
|------|-----------|
| **Standard/Manual Cost** | Product has a fixed `standard_cost` set manually. Used by default. |
| **WAC (Weighted Average Cost)** | Cost recalculated on each purchase as `(existing_qty * existing_avg + new_qty * new_cost) / total_qty`. Tracked per warehouse in `product_cost_state`. |
| **FIFO (First In, First Out)** | Oldest inventory layers are consumed first. Tracked via `fifo_layers` table. |
| **Cost Method** | Configurable globally in `app_settings` and overridable per product. |

## Currency & Exchange

| Term | Definition |
|------|-----------|
| **Currency** | ISO code (CUP, USD, EUR, etc.) with name and symbol. |
| **Exchange Rate** | Conversion rate between two currencies at a point in time. Types: OFFICIAL, MARKET, CUSTOM. Never hardcoded. |
| **Base Currency** | Primary operating currency (configured in `app_settings.default_currency_code`). |

## Auth & Security

| Term | Definition |
|------|-----------|
| **Role** | RBAC role: ADMIN (full access), MANAGER (catalog + operations), SELLER (POS + limited reads). |
| **Access Token** | Short-lived JWT (HS256, 15 min) for API authentication. |
| **Refresh Token** | Long-lived UUID (7 days) stored as SHA-256 hash, delivered via httpOnly cookie. |

## Offline & Sync

| Term | Definition |
|------|-----------|
| **Outbox** | IndexedDB queue of operations created offline, pending sync to server. |
| **Sync Push** | Client sends batch of outbox operations to server. Each operation is idempotent via `operation_id`. |
| **Sync Pull** | Client requests changes since last known cursor. Server returns changes from `sync_log` ordered by monotonic `bigserial` id. |
| **Cursor** | Last known `sync_log.id` on the client. Starts at 0 for first sync. |
| **Idempotency Key** | UUID v4 sent by client in `Idempotency-Key` header. Server deduplicates within 72-hour TTL. |
| **Conflict** | Server rejects operation when `version` mismatch (optimistic lock). Client receives rejection with details. |

## Import/Export

| Term | Definition |
|------|-----------|
| **CSV Import** | Job-based import of entities from CSV. Supports column mapping, dry-run validation, and progress tracking. |
| **Export** | Download of data in CSV, XLSX, or PDF format. |
| **Dry Run** | Validation-only import that reports errors without committing changes. |

## Architecture

| Term | Definition |
|------|-----------|
| **Port** | Interface defining a boundary (inbound use case or outbound repository). |
| **Adapter** | Implementation of a port (Web controller, R2DBC repository, file storage). |
| **Use Case** | Application-layer operation: Command (mutates state) or Query (reads state). |
| **BFF** | Backend-For-Frontend. Next.js route handlers proxy requests to Spring Boot, managing auth cookies. |
