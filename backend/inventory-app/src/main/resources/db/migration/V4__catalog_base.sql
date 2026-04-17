-- =====================================================
-- V4: Catálogo base - Monedas, Almacenes, Categorías, Productos
-- =====================================================

-- Monedas (base para multi-moneda)
CREATE TABLE currencies (
    code        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    symbol      TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datos iniciales de monedas
INSERT INTO currencies (code, name, symbol) VALUES
    ('CUP', 'Peso Cubano', '$'),
    ('USD', 'Dólar Estadounidense', '$'),
    ('EUR', 'Euro', '€'),
    ('MLC', 'Moneda Libremente Convertible', 'MLC');

-- Tasas de cambio
CREATE TABLE exchange_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_code       TEXT NOT NULL REFERENCES currencies(code),
    quote_code      TEXT NOT NULL REFERENCES currencies(code),
    rate            NUMERIC(19,6) NOT NULL CHECK (rate > 0),
    rate_type       TEXT NOT NULL CHECK (rate_type IN ('OFFICIAL', 'MARKET', 'CUSTOM')),
    valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT exchange_rates_different_codes CHECK (base_code != quote_code)
);

CREATE INDEX idx_exchange_rates_codes ON exchange_rates(base_code, quote_code, valid_from DESC);

-- Configuración global de la aplicación
CREATE TABLE app_settings (
    id                          TEXT PRIMARY KEY DEFAULT 'global',
    company_name                TEXT,
    default_cost_method         TEXT NOT NULL DEFAULT 'STANDARD' CHECK (default_cost_method IN ('STANDARD', 'WAC', 'FIFO')),
    default_currency_code       TEXT NOT NULL DEFAULT 'CUP' REFERENCES currencies(code),
    low_stock_threshold_default NUMERIC(19,4) DEFAULT 10,
    updated_by                  UUID REFERENCES users(id),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version                     INT NOT NULL DEFAULT 0
);

-- Configuración inicial
INSERT INTO app_settings (id, company_name, default_cost_method, default_currency_code)
VALUES ('global', 'Mi Negocio', 'STANDARD', 'CUP');

-- Almacenes
CREATE TABLE warehouses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    address     TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version     INT NOT NULL DEFAULT 0
);

-- Almacén por defecto
INSERT INTO warehouses (id, code, name) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'PRINCIPAL', 'Almacén Principal');

-- Categorías (árbol con materialized path)
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    path        TEXT NOT NULL DEFAULT '',
    level       INT NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version     INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories(path);

-- Proveedores
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE,
    name            TEXT NOT NULL,
    contact_name    TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version         INT NOT NULL DEFAULT 0
);

-- Clientes
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE,
    name            TEXT NOT NULL,
    contact_name    TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version         INT NOT NULL DEFAULT 0
);

-- Productos
CREATE TABLE products (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                     TEXT UNIQUE,
    barcode                 TEXT UNIQUE,
    name                    TEXT NOT NULL,
    description             TEXT,
    category_id             UUID REFERENCES categories(id) ON DELETE SET NULL,
    status                  TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    cost_method             TEXT NOT NULL DEFAULT 'INHERIT' CHECK (cost_method IN ('INHERIT', 'STANDARD', 'WAC', 'FIFO')),
    standard_cost           NUMERIC(19,4),
    sale_price              NUMERIC(19,4),
    reorder_point           NUMERIC(19,4),
    default_currency_code   TEXT NOT NULL DEFAULT 'CUP' REFERENCES currencies(code),
    tax_rate                NUMERIC(5,2) DEFAULT 0,
    unit_of_measure         TEXT DEFAULT 'UNIT',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version                 INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('spanish', name));

-- Imágenes de productos
CREATE TABLE product_images (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sort_order          INT NOT NULL DEFAULT 0,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    content_type        TEXT NOT NULL,
    file_path           TEXT NOT NULL UNIQUE,
    thumbnail_path      TEXT,
    original_filename   TEXT,
    size_bytes          BIGINT NOT NULL CHECK (size_bytes <= 10485760), -- 10 MiB max
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
-- Garantizar una sola imagen primaria por producto
CREATE UNIQUE INDEX idx_product_images_primary ON product_images(product_id) WHERE is_primary = TRUE;

-- Auditoría general
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES users(id),
    actor_name  TEXT,
    entity_type TEXT NOT NULL,
    entity_id   UUID NOT NULL,
    action      TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE')),
    before_data JSONB,
    after_data  JSONB,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- Keys de idempotencia para operaciones
CREATE TABLE idempotency_keys (
    key             TEXT PRIMARY KEY,
    scope           TEXT NOT NULL,
    request_hash    TEXT NOT NULL,
    response_json   JSONB,
    status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours')
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Sync log para offline
CREATE TABLE sync_log (
    id              BIGSERIAL PRIMARY KEY,
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    payload         JSONB NOT NULL,
    warehouse_id    UUID REFERENCES warehouses(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_warehouse ON sync_log(warehouse_id) WHERE warehouse_id IS NOT NULL;
