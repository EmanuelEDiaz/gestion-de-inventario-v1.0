CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, value_type, is_public, description) VALUES
  ('audit.retention-days-hot',     '90',   'integer', false, 'Días de retención en tabla caliente de auditoría'),
  ('audit.retention-days-archive', '365',  'integer', false, 'Días totales antes de eliminar logs de auditoría'),
  ('import.retention-days',        '7',    'integer', false, 'Días de retención de resultados de importación'),
  ('sync.outbox-limit',            '500',  'integer', false, 'Máximo de operaciones offline en cola'),
  ('sync.retention-days',          '30',   'integer', false, 'Días de retención del historial de sincronización'),
  ('sync.pull-interval-seconds',   '30',   'integer', true,  'Intervalo de pull de cambios en segundos');
