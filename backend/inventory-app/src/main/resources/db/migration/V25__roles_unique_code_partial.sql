-- Cambiar UNIQUE constraint en roles.code a partial unique index
-- para permitir reutilizar códigos de roles desactivados (soft-delete)
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_code_active ON roles(code) WHERE is_active = TRUE;
