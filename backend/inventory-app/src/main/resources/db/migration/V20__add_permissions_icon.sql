-- Add icon column to permissions table
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

-- Seed: assign all existing permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id LIMIT 1)
ON CONFLICT DO NOTHING;

-- Seed: assign permissions to MANAGER role (exclude admin-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'MANAGER'
  AND p.code NOT IN ('admin:full', 'finance:delete', 'settings:write', 'audit:delete', 'users:delete')
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id LIMIT 1)
ON CONFLICT DO NOTHING;

-- Seed: assign limited permissions to SELLER role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SELLER'
  AND p.code IN ('products:read', 'customers:read', 'customers:create', 'sales:create', 'sales:read', 'stock:read', 'dashboard:read')
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id LIMIT 1)
ON CONFLICT DO NOTHING;
