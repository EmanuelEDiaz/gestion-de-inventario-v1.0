-- V14: Enhance notifications with source, priority, preferences, and schedules
-- Extends: notifications table with source, priority, actionUrl, tags, deliveryChannel
-- Creates: notification_preferences (per-user notification settings)
-- Creates: notification_schedules (per-user quiet hours)

-- 0. Ensure notifications table exists (idempotent - covers fresh DB or missing V9/V11)
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    body text,
    target_type text NOT NULL,
    target_user_id uuid REFERENCES users(id),
    created_by uuid REFERENCES users(id),
    entity_type text,
    entity_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id uuid NOT NULL REFERENCES notifications(id),
    user_id uuid NOT NULL REFERENCES users(id),
    read_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (notification_id, user_id)
);

-- 1. Extend notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'SYSTEM'
  CHECK (source IN ('SYSTEM', 'USER', 'INTEGRATION', 'SCHEDULED_TASK'));

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM'
  CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS action_url TEXT;

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS delivery_channel VARCHAR(50) NOT NULL DEFAULT 'SSE'
  CHECK (delivery_channel IN ('SSE', 'TOAST', 'PUSH'));

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

-- 2. Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Global toggles
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Per-category group toggles
    low_stock_enabled BOOLEAN DEFAULT TRUE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    operations_enabled BOOLEAN DEFAULT TRUE,
    debt_enabled BOOLEAN DEFAULT TRUE,
    user_actions_enabled BOOLEAN DEFAULT TRUE,
    system_enabled BOOLEAN DEFAULT TRUE,
    
    -- Delivery channels
    push_notifications_enabled BOOLEAN DEFAULT FALSE,
    toast_notifications_enabled BOOLEAN DEFAULT TRUE,
    sse_enabled BOOLEAN DEFAULT TRUE,
    
    -- Sound & visual
    sound_enabled BOOLEAN DEFAULT TRUE,
    desktop_notification_enabled BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
    ON notification_preferences(user_id);

-- 3. Create notification_schedules table (quiet hours)
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Quiet hours (e.g., 22:00-08:00)
    quiet_hours_start TIME NOT NULL DEFAULT '22:00:00',
    quiet_hours_end TIME NOT NULL DEFAULT '08:00:00',
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    
    -- Quiet days (0=MON, 6=SUN)
    quiet_days_list INT[] DEFAULT ARRAY[]::INT[],
    
    -- Exceptions (critical notifications still alert even during quiet hours)
    bypass_on_critical BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_schedules_user_id 
    ON notification_schedules(user_id);

-- 4. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_notifications_source 
    ON notifications(source);

CREATE INDEX IF NOT EXISTS idx_notifications_priority 
    ON notifications(priority);

CREATE INDEX IF NOT EXISTS idx_notifications_category 
    ON notifications(category);

CREATE INDEX IF NOT EXISTS idx_notifications_target_user_created 
    ON notifications(target_user_id, created_at DESC);
