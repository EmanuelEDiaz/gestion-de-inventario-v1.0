-- V9: Extensiones v2 - Imágenes de Clientes/Proveedores · Fiar (Credit Sales) · Notificaciones · Incidencias Sync
-- Objetivo: Crear tablas para imágenes, deudas, notificaciones internas y manejo de conflictos offline

-- Imágenes de clientes
CREATE TABLE IF NOT EXISTS customer_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sort_order int NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT false,
    content_type text NOT NULL,
    file_path text NOT NULL UNIQUE,
    original_filename text,
    size_bytes bigint NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS customer_images_primary_uidx ON customer_images(customer_id) WHERE is_primary = true;

-- Imágenes de proveedores
CREATE TABLE IF NOT EXISTS supplier_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    sort_order int NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT false,
    content_type text NOT NULL,
    file_path text NOT NULL UNIQUE,
    original_filename text,
    size_bytes bigint NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS supplier_images_primary_uidx ON supplier_images(supplier_id) WHERE is_primary = true;

-- Redes sociales de proveedores
CREATE TABLE IF NOT EXISTS supplier_social_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    platform text NOT NULL,  -- WHATSAPP | TELEGRAM | INSTAGRAM | FACEBOOK | TIKTOK | WEBSITE | OTHER
    url text NOT NULL,
    label text,
    sort_order int NOT NULL DEFAULT 0
);

-- Catálogo de productos del proveedor
CREATE TABLE IF NOT EXISTS supplier_catalog_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    description text,
    unit_price numeric(19,4),
    currency_code text REFERENCES currencies(code)
);

-- Extensión de suppliers: website
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website text;

-- Extensión de sales: modo de pago (IMMEDIATE | CREDIT | RESERVE)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'IMMEDIATE';

-- Deudas de clientes (modo fiado)
CREATE TABLE IF NOT EXISTS customer_debts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id),
    sale_id uuid NOT NULL UNIQUE REFERENCES sales(id),
    original_amount numeric(19,4) NOT NULL,
    paid_amount numeric(19,4) NOT NULL DEFAULT 0,
    currency_code text NOT NULL REFERENCES currencies(code),
    status text NOT NULL DEFAULT 'PENDING',  -- PENDING | PARTIAL | PAID | CANCELLED
    description text,
    due_date timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    version bigint NOT NULL DEFAULT 0
);

-- Pagos de deudas
CREATE TABLE IF NOT EXISTS debt_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id uuid NOT NULL REFERENCES customer_debts(id),
    amount numeric(19,4) NOT NULL,
    payment_method text,  -- CASH | TRANSFER | PRODUCT | OTHER
    notes text,
    registered_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Notificaciones internas
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,      -- SYSTEM_AUTO | USER_MANUAL
    category text NOT NULL,  -- LOW_STOCK | DEBT_OVERDUE | SYNC_CONFLICT | IMPORT_DONE | MANUAL
    title text NOT NULL,
    body text,
    target_type text NOT NULL,  -- USER | ALL
    target_user_id uuid REFERENCES users(id),
    created_by uuid REFERENCES users(id),
    entity_type text,
    entity_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Lecturas de notificaciones (evita borrado — solo marca como leída)
CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id uuid NOT NULL REFERENCES notifications(id),
    user_id uuid NOT NULL REFERENCES users(id),
    read_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (notification_id, user_id)
);

-- Incidencias de sincronización
CREATE TABLE IF NOT EXISTS sync_incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id text NOT NULL,
    operation_id text NOT NULL UNIQUE,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    incident_type text NOT NULL,  -- ENTITY_DUPLICATE | STOCK_CONFLICT | VERSION_MISMATCH | CHECKSUM_ERROR
    status text NOT NULL DEFAULT 'PENDING',  -- PENDING | RESOLVED | IGNORED
    my_payload jsonb,
    server_payload jsonb,
    resolution text,
    user_id uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);