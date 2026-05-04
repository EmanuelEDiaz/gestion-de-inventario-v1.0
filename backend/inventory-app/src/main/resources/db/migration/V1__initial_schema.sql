-- =====================================================
-- V1__initial_schema.sql
-- Esquema base: RBAC dinamico, usuarios, tokens
-- =====================================================
-- Sistema de permisos:
--   roles           -> tipos de usuario (ADMIN, SELLER, y cualquier custom)
--   permissions     -> acciones granulares posibles
--   role_permissions -> que permisos tiene cada rol
--   users.role_id   -> FK al rol asignado
-- =====================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- RBAC - PERMISOS GRANULARES
-- =====================================================

CREATE TABLE permissions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code       VARCHAR(100) NOT NULL UNIQUE,
    name       VARCHAR(200) NOT NULL,
    category   VARCHAR(50)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version     INT NOT NULL DEFAULT 0
);

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- =====================================================
-- USUARIOS
-- =====================================================

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(200) NOT NULL,
    role_id       UUID NOT NULL REFERENCES roles(id),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version       INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email    ON users(email)    WHERE email IS NOT NULL;
CREATE INDEX idx_users_role     ON users(role_id);
CREATE INDEX idx_users_active   ON users(is_active) WHERE is_active = TRUE;

CREATE TABLE user_images (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    content_type      VARCHAR(50)  NOT NULL,
    file_path         VARCHAR(500) NOT NULL UNIQUE,
    original_filename VARCHAR(255),
    size_bytes        BIGINT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_images_content_type CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
    CONSTRAINT chk_user_images_size         CHECK (size_bytes > 0 AND size_bytes <= 2097152)
);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens(user_id, revoked_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at)          WHERE revoked_at IS NULL;

-- =====================================================
-- MONEDAS Y CONFIGURACION GLOBAL
-- =====================================================

CREATE TABLE currencies (
    code      VARCHAR(3)   PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    symbol    VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO currencies (code, name, symbol, is_active) VALUES
    ('CUP', 'Peso Cubano',            '$', TRUE),
    ('USD', 'Dolar Estadounidense',   '$', TRUE),
    ('EUR', 'Euro',                   'E', TRUE);

CREATE TABLE app_settings (
    id                          VARCHAR(50) PRIMARY KEY DEFAULT 'global',
    default_cost_method         VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    default_currency_code       VARCHAR(3)  NOT NULL REFERENCES currencies(code) DEFAULT 'CUP',
    company_name                VARCHAR(200),
    low_stock_threshold_default NUMERIC(19,4),
    updated_by                  UUID REFERENCES users(id),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version                     INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_settings_cost_method CHECK (default_cost_method IN ('STANDARD','WAC','FIFO'))
);

-- =====================================================
-- AUDITORIA
-- =====================================================

CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID REFERENCES users(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    before_data JSONB,
    after_data  JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity  ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor   ON audit_log(actor_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- =====================================================
-- IDEMPOTENCIA
-- =====================================================

CREATE TABLE idempotency_keys (
    key           VARCHAR(100) PRIMARY KEY,
    scope         VARCHAR(50)  NOT NULL,
    request_hash  VARCHAR(64),
    response_json JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '72 hours'
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- =====================================================
-- SYNC LOG (offline cursor)
-- =====================================================

CREATE TABLE sync_log (
    id           BIGSERIAL PRIMARY KEY,
    entity_type  VARCHAR(100) NOT NULL,
    entity_id    UUID NOT NULL,
    action       VARCHAR(20)  NOT NULL,
    payload      JSONB,
    warehouse_id UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_log_cursor    ON sync_log(id);
CREATE INDEX idx_sync_log_warehouse ON sync_log(warehouse_id, id) WHERE warehouse_id IS NOT NULL;

-- =====================================================
-- DATOS INICIALES - PERMISOS
-- =====================================================

INSERT INTO permissions (code, name, category) VALUES
    ('dashboard:read',        'Ver dashboard',                'dashboard'),
    ('users:read',            'Ver usuarios',                 'users'),
    ('users:create',          'Crear usuarios',               'users'),
    ('users:update',          'Editar usuarios',              'users'),
    ('users:deactivate',      'Desactivar usuarios',          'users'),
    ('roles:read',            'Ver roles',                    'roles'),
    ('roles:manage',          'Crear/editar roles',           'roles'),
    ('products:read',         'Ver productos',                'products'),
    ('products:create',       'Crear productos',              'products'),
    ('products:update',       'Editar productos',             'products'),
    ('products:archive',      'Archivar productos',           'products'),
    ('products:images',       'Gestionar imagenes producto',  'products'),
    ('categories:read',       'Ver categorias',               'categories'),
    ('categories:manage',     'Crear/editar categorias',      'categories'),
    ('warehouses:read',       'Ver almacenes',                'warehouses'),
    ('warehouses:manage',     'Crear/editar almacenes',       'warehouses'),
    ('stock:read',            'Ver stock',                    'stock'),
    ('movements:read',        'Ver movimientos',              'stock'),
    ('sales:read',            'Ver ventas',                   'sales'),
    ('sales:create',          'Crear ventas',                 'sales'),
    ('sales:cancel',          'Cancelar ventas',              'sales'),
    ('purchases:read',        'Ver compras',                  'purchases'),
    ('purchases:create',      'Crear compras',                'purchases'),
    ('purchases:cancel',      'Cancelar compras',             'purchases'),
    ('transfers:read',        'Ver transferencias',           'transfers'),
    ('transfers:create',      'Crear transferencias',         'transfers'),
    ('transfers:cancel',      'Cancelar transferencias',      'transfers'),
    ('adjustments:read',      'Ver ajustes',                  'adjustments'),
    ('adjustments:create',    'Crear ajustes',                'adjustments'),
    ('returns:read',          'Ver devoluciones',             'returns'),
    ('returns:create',        'Crear devoluciones',           'returns'),
    ('suppliers:read',        'Ver proveedores',              'suppliers'),
    ('suppliers:manage',      'Crear/editar proveedores',     'suppliers'),
    ('customers:read',        'Ver clientes',                 'customers'),
    ('customers:manage',      'Crear/editar clientes',        'customers'),
    ('currencies:read',       'Ver monedas',                  'finance'),
    ('currencies:manage',     'Crear/editar monedas',         'finance'),
    ('exchange_rates:read',   'Ver tasas de cambio',          'finance'),
    ('exchange_rates:manage', 'Crear tasas de cambio',        'finance'),
    ('settings:read',         'Ver configuracion',            'settings'),
    ('settings:update',       'Editar configuracion',         'settings'),
    ('reports:read',          'Ver reportes',                 'reports'),
    ('exports:run',           'Exportar datos',               'reports'),
    ('imports:run',           'Importar datos CSV',           'imports'),
    ('audit:read',            'Ver log de auditoria',         'audit');

-- =====================================================
-- DATOS INICIALES - ROLES DEL SISTEMA
-- =====================================================

INSERT INTO roles (id, code, name, description, is_system, is_active) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'ADMIN',  'Administrador',
     'Acceso completo al sistema. Puede gestionar usuarios, roles y configuracion.', TRUE, TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'SELLER', 'Vendedor',
     'Acceso al punto de venta y consulta de stock. No puede gestionar catalogo ni usuarios.', TRUE, TRUE);

-- ADMIN: todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM permissions;

-- SELLER: permisos basicos
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000002', p.id
FROM permissions p
WHERE p.code IN (
    'dashboard:read',
    'products:read',
    'categories:read',
    'warehouses:read',
    'stock:read',
    'movements:read',
    'sales:read',
    'sales:create',
    'customers:read',
    'customers:manage',
    'currencies:read',
    'exchange_rates:read',
    'reports:read'
);

-- =====================================================
-- USUARIO ADMIN POR DEFECTO
-- password: admin123  (bcrypt cost=12)
-- CAMBIAR EN PRODUCCION
-- =====================================================

INSERT INTO users (id, username, password_hash, display_name, role_id, is_active) VALUES
    ('b0000000-0000-0000-0000-000000000001',
     'admin',
     '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
     'Administrador',
     'a0000000-0000-0000-0000-000000000001',
     TRUE);

-- =====================================================
-- CONFIGURACION INICIAL
-- =====================================================

INSERT INTO app_settings (id, default_cost_method, default_currency_code, company_name)
VALUES ('global', 'STANDARD', 'CUP', 'Mi Empresa');
