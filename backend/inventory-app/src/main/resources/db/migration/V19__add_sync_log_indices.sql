-- V19: Add indices for sync_log performance optimization
-- Critical for A7.4+ delta sync performance (filtering + ordering on large tables)

-- A7.4+: delta sync filters by entity_type + orders by id. Without this index = sequential scan.
CREATE INDEX IF NOT EXISTS idx_sync_log_entity_type_id ON sync_log(entity_type, id);

-- For cleanup by created_at in SyncLogRetentionService (DELETE by date range)
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON sync_log(created_at DESC);

-- For incident/dead letter queries by entity_id (to find what operations failed for a specific entity)
CREATE INDEX IF NOT EXISTS idx_sync_log_entity_id ON sync_log(entity_id);

-- For querying by warehouse_id (multi-tenant queries)
CREATE INDEX IF NOT EXISTS idx_sync_log_warehouse_id ON sync_log(warehouse_id);

-- For querying by action (e.g., find all CREATE operations for reconciliation)
CREATE INDEX IF NOT EXISTS idx_sync_log_action ON sync_log(action);

-- Combined index for the most common delta sync query:
-- SELECT * FROM sync_log WHERE entity_type = ? AND id > ? ORDER BY id LIMIT ?
CREATE INDEX IF NOT EXISTS idx_sync_log_entity_delta ON sync_log(entity_type, id DESC);
