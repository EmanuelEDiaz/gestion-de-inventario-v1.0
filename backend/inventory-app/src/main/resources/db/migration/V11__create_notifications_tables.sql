-- V10: Crear tablas de notificaciones (backup por si V9 no se ejecutó correctamente)
-- Tablas: notifications, notification_reads

-- Notificaciones internas
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

-- Lecturas de notificaciones
CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id uuid NOT NULL REFERENCES notifications(id),
    user_id uuid NOT NULL REFERENCES users(id),
    read_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (notification_id, user_id)
);