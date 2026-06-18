INSERT INTO roles (id, name, description, permissions, "isActive", "createdAt", "updatedAt") VALUES
  ('r0000000-e29b-41d4-a716-000000000001', 'Administrador', 'Acceso total', '["*"]', true, NOW(), NOW()),
  ('r0000000-e29b-41d4-a716-000000000002', 'Operador', 'Operaciones basicas', '["inventory:read"]', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT name FROM roles;
