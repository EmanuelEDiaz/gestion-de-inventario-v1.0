-- V18: Add device_cursors table for tracking sync cursors per device
-- Used by SyncService to manage delta sync per device (mobile app, multiple browsers, etc.)

CREATE TABLE IF NOT EXISTS device_cursors (
    device_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_cursor BIGINT NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_device_cursors_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_device_cursors_user_id ON device_cursors(user_id);
CREATE INDEX IF NOT EXISTS idx_device_cursors_last_cursor ON device_cursors(last_cursor);
CREATE INDEX IF NOT EXISTS idx_device_cursors_last_seen_at ON device_cursors(last_seen_at);

-- Flujo:
-- 1. Cliente móvil hace GET /sync/pull?deviceId=X&cursor=Y
-- 2. Backend actualiza device_cursors.last_cursor = X (id de la última entrada sync_log retornada)
-- 3. Otros dispositivos leen este cursor para determinar hasta dónde pueden limpiar sync_log
-- 4. SyncLogRetentionService busca MIN(last_cursor) para saber qué registros pueden eliminarse
