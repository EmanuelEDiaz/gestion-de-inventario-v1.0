-- V2: Asegurar que existe el usuario admin
-- =====================================================
-- Este script verifica y corrige los datos iniciales

-- Insertar rol ADMIN si no existe
INSERT INTO roles (id, code, name, description, is_system, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'ADMIN', 'Administrador', 'Acceso completo al sistema', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insertar rol SELLER si no existe  
INSERT INTO roles (id, code, name, description, is_system, is_active)
VALUES ('a0000000-0000-0000-0000-000000000002', 'SELLER', 'Vendedor', 'Gestión de ventas e inventario básico', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insertar permisos básicos si no existen
INSERT INTO permissions (id, code, name, category)
SELECT * FROM (VALUES
    ('c0000000-0000-0000-0000-000000000001'::UUID, 'USERS_READ', 'Ver usuarios', 'users'),
    ('c0000000-0000-0000-0000-000000000002'::UUID, 'USERS_WRITE', 'Crear/editar usuarios', 'users'),
    ('c0000000-0000-0000-0000-000000000003'::UUID, 'USERS_DELETE', 'Eliminar usuarios', 'users'),
    ('c0000000-0000-0000-0000-000000000004'::UUID, 'ROLES_READ', 'Ver roles', 'roles'),
    ('c0000000-0000-0000-0000-000000000005'::UUID, 'ROLES_WRITE', 'Crear/editar roles', 'roles'),
    ('c0000000-0000-0000-0000-000000000006'::UUID, 'ROLES_DELETE', 'Eliminar roles', 'roles'),
    ('c0000000-0000-0000-0000-000000000010'::UUID, 'PRODUCTS_READ', 'Ver productos', 'products'),
    ('c0000000-0000-0000-0000-000000000011'::UUID, 'PRODUCTS_WRITE', 'Crear/editar productos', 'products'),
    ('c0000000-0000-0000-0000-000000000012'::UUID, 'PRODUCTS_DELETE', 'Eliminar productos', 'products'),
    ('c0000000-0000-0000-0000-000000000020'::UUID, 'INVENTORY_READ', 'Ver inventario', 'inventory'),
    ('c0000000-0000-0000-0000-000000000021'::UUID, 'INVENTORY_ADJUST', 'Ajustar inventario', 'inventory'),
    ('c0000000-0000-0000-0000-000000000030'::UUID, 'SALES_READ', 'Ver ventas', 'sales'),
    ('c0000000-0000-0000-0000-000000000031'::UUID, 'SALES_CREATE', 'Crear ventas', 'sales'),
    ('c0000000-0000-0000-0000-000000000032'::UUID, 'SALES_VOID', 'Anular ventas', 'sales'),
    ('c0000000-0000-0000-0000-000000000040'::UUID, 'REPORTS_READ', 'Ver reportes', 'reports'),
    ('c0000000-0000-0000-0000-000000000041'::UUID, 'REPORTS_EXPORT', 'Exportar reportes', 'reports'),
    ('c0000000-0000-0000-0000-000000000050'::UUID, 'SETTINGS_READ', 'Ver configuración', 'settings'),
    ('c0000000-0000-0000-0000-000000000051'::UUID, 'SETTINGS_WRITE', 'Modificar configuración', 'settings')
) AS v(id, code, name, category)
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE id = v.id);

-- Asignar todos los permisos al rol ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000001'::UUID, id FROM permissions
ON CONFLICT DO NOTHING;

-- Asignar permisos de vendedor al rol SELLER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000002'::UUID, id FROM permissions
WHERE code IN ('PRODUCTS_READ', 'INVENTORY_READ', 'SALES_READ', 'SALES_CREATE')
ON CONFLICT DO NOTHING;

-- Insertar/Actualizar usuario admin
-- Password: password (bcrypt hash)
INSERT INTO users (id, username, password_hash, display_name, role_id, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'Administrador',
    'a0000000-0000-0000-0000-000000000001',
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role_id = EXCLUDED.role_id,
    is_active = EXCLUDED.is_active;
