-- V27: Tablas de devoluciones (returns, return_lines)
-- =====================================================

CREATE TABLE IF NOT EXISTS returns (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number        TEXT NOT NULL UNIQUE,
    type                 TEXT NOT NULL,
    warehouse_id         UUID NOT NULL REFERENCES warehouses(id),
    original_document_id UUID,
    status               TEXT NOT NULL,
    reason               TEXT,
    notes                TEXT,
    return_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by           UUID REFERENCES users(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_returns_number ON returns(return_number);
CREATE INDEX idx_returns_warehouse ON returns(warehouse_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_returns_date ON returns(return_date);
CREATE INDEX idx_returns_original_doc ON returns(original_document_id);

CREATE TABLE IF NOT EXISTS return_lines (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id    UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    product_id   UUID NOT NULL REFERENCES products(id),
    quantity     NUMERIC(19,4) NOT NULL,
    unit_price   NUMERIC(19,4),
    unit_cost    NUMERIC(19,4),
    sort_order   INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_return_lines_return ON return_lines(return_id);
CREATE INDEX idx_return_lines_product ON return_lines(product_id);
