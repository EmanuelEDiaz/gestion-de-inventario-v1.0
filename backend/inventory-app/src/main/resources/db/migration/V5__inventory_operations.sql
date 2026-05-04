-- =====================================================
-- V5: Inventario - Stock, Movimientos, Operaciones
-- =====================================================

-- Balances de stock por almacén/producto
CREATE TABLE stock_balances (
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    on_hand         NUMERIC(19,4) NOT NULL DEFAULT 0,
    reserved        NUMERIC(19,4) NOT NULL DEFAULT 0,
    available       NUMERIC(19,4) GENERATED ALWAYS AS (on_hand - reserved) STORED,
    avg_cost        NUMERIC(19,4),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (warehouse_id, product_id)
);

CREATE INDEX idx_stock_balances_product ON stock_balances(product_id);

-- Estado de costo por producto/almacén (para WAC)
CREATE TABLE product_cost_state (
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    avg_cost        NUMERIC(19,4),
    total_qty       NUMERIC(19,4) NOT NULL DEFAULT 0,
    total_value     NUMERIC(19,4) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (warehouse_id, product_id)
);

-- Capas FIFO para costeo
CREATE TABLE fifo_layers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id            UUID NOT NULL REFERENCES warehouses(id),
    product_id              UUID NOT NULL REFERENCES products(id),
    qty_remaining           NUMERIC(19,4) NOT NULL CHECK (qty_remaining >= 0),
    unit_cost               NUMERIC(19,4) NOT NULL,
    source_doc_type         TEXT NOT NULL,
    source_doc_id           UUID NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fifo_layers_product ON fifo_layers(warehouse_id, product_id, created_at);
CREATE INDEX idx_fifo_layers_remaining ON fifo_layers(warehouse_id, product_id) WHERE qty_remaining > 0;

-- Movimientos de inventario (inmutable - ledger)
CREATE TABLE inventory_movements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id        UUID NOT NULL REFERENCES warehouses(id),
    product_id          UUID NOT NULL REFERENCES products(id),
    movement_type       TEXT NOT NULL CHECK (movement_type IN (
        'PURCHASE', 'SALE', 'SALE_RETURN', 'PURCHASE_RETURN',
        'ADJUSTMENT_IN', 'ADJUSTMENT_OUT',
        'TRANSFER_IN', 'TRANSFER_OUT',
        'INITIAL'
    )),
    quantity            NUMERIC(19,4) NOT NULL,
    unit_cost           NUMERIC(19,4),
    unit_price          NUMERIC(19,4),
    total_cost          NUMERIC(19,4),
    total_price         NUMERIC(19,4),
    currency_code       TEXT NOT NULL DEFAULT 'CUP' REFERENCES currencies(code),
    exchange_rate       NUMERIC(19,6) DEFAULT 1,
    balance_after       NUMERIC(19,4) NOT NULL,
    source_doc_type     TEXT NOT NULL,
    source_doc_id       UUID NOT NULL,
    notes               TEXT,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movements_warehouse_product ON inventory_movements(warehouse_id, product_id);
CREATE INDEX idx_movements_source ON inventory_movements(source_doc_type, source_doc_id);
CREATE INDEX idx_movements_occurred ON inventory_movements(occurred_at);
CREATE INDEX idx_movements_type ON inventory_movements(movement_type);

-- =====================================================
-- Operaciones
-- =====================================================

-- Compras
CREATE TABLE purchases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_number     TEXT NOT NULL UNIQUE,
    supplier_id         UUID REFERENCES suppliers(id),
    warehouse_id        UUID NOT NULL REFERENCES warehouses(id),
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'RECEIVED', 'CANCELLED')),
    currency_code       TEXT NOT NULL DEFAULT 'CUP' REFERENCES currencies(code),
    exchange_rate       NUMERIC(19,6) DEFAULT 1,
    subtotal            NUMERIC(19,4) NOT NULL DEFAULT 0,
    tax_amount          NUMERIC(19,4) NOT NULL DEFAULT 0,
    total               NUMERIC(19,4) NOT NULL DEFAULT 0,
    notes               TEXT,
    purchase_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    received_date       DATE,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version             INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_purchases_number ON purchases(purchase_number);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);

CREATE TABLE purchase_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id     UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        NUMERIC(19,4) NOT NULL CHECK (quantity > 0),
    unit_cost       NUMERIC(19,4) NOT NULL CHECK (unit_cost >= 0),
    total_cost      NUMERIC(19,4) NOT NULL,
    received_qty    NUMERIC(19,4) NOT NULL DEFAULT 0,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_lines_purchase ON purchase_lines(purchase_id);
CREATE INDEX idx_purchase_lines_product ON purchase_lines(product_id);

-- Ventas
CREATE TABLE sales (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number         TEXT NOT NULL UNIQUE,
    customer_id         UUID REFERENCES customers(id),
    warehouse_id        UUID NOT NULL REFERENCES warehouses(id),
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'VOIDED')),
    currency_code       TEXT NOT NULL DEFAULT 'CUP' REFERENCES currencies(code),
    exchange_rate       NUMERIC(19,6) DEFAULT 1,
    subtotal            NUMERIC(19,4) NOT NULL DEFAULT 0,
    discount_amount     NUMERIC(19,4) NOT NULL DEFAULT 0,
    tax_amount          NUMERIC(19,4) NOT NULL DEFAULT 0,
    total               NUMERIC(19,4) NOT NULL DEFAULT 0,
    amount_paid         NUMERIC(19,4) NOT NULL DEFAULT 0,
    payment_method      TEXT,
    notes               TEXT,
    sale_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version             INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_sales_number ON sales(sale_number);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_date ON sales(sale_date);

CREATE TABLE sale_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        NUMERIC(19,4) NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(19,4) NOT NULL CHECK (unit_price >= 0),
    unit_cost       NUMERIC(19,4),
    discount_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_price     NUMERIC(19,4) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sale_lines_sale ON sale_lines(sale_id);
CREATE INDEX idx_sale_lines_product ON sale_lines(product_id);

-- Transferencias entre almacenes
CREATE TABLE transfers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number         TEXT NOT NULL UNIQUE,
    from_warehouse_id       UUID NOT NULL REFERENCES warehouses(id),
    to_warehouse_id         UUID NOT NULL REFERENCES warehouses(id),
    status                  TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    notes                   TEXT,
    transfer_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_date          DATE,
    created_by              UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version                 INT NOT NULL DEFAULT 0,
    
    CONSTRAINT transfers_different_warehouses CHECK (from_warehouse_id != to_warehouse_id)
);

CREATE INDEX idx_transfers_number ON transfers(transfer_number);
CREATE INDEX idx_transfers_status ON transfers(status);

CREATE TABLE transfer_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id     UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        NUMERIC(19,4) NOT NULL CHECK (quantity > 0),
    unit_cost       NUMERIC(19,4),
    received_qty    NUMERIC(19,4) NOT NULL DEFAULT 0,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transfer_lines_transfer ON transfer_lines(transfer_id);

-- Ajustes de inventario
CREATE TABLE adjustments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_number   TEXT NOT NULL UNIQUE,
    warehouse_id        UUID NOT NULL REFERENCES warehouses(id),
    adjustment_type     TEXT NOT NULL CHECK (adjustment_type IN ('COUNT', 'DAMAGE', 'LOSS', 'FOUND', 'CORRECTION', 'OTHER')),
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'CANCELLED')),
    reason              TEXT,
    notes               TEXT,
    adjustment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version             INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_adjustments_number ON adjustments(adjustment_number);
CREATE INDEX idx_adjustments_warehouse ON adjustments(warehouse_id);
CREATE INDEX idx_adjustments_status ON adjustments(status);

CREATE TABLE adjustment_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id       UUID NOT NULL REFERENCES adjustments(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id),
    quantity_change     NUMERIC(19,4) NOT NULL,
    unit_cost           NUMERIC(19,4),
    reason              TEXT,
    sort_order          INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adjustment_lines_adjustment ON adjustment_lines(adjustment_id);

-- Secuencias para números de documento
CREATE SEQUENCE purchase_number_seq START 1;
CREATE SEQUENCE sale_number_seq START 1;
CREATE SEQUENCE transfer_number_seq START 1;
CREATE SEQUENCE adjustment_number_seq START 1;
