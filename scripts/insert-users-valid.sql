INSERT INTO roles (id, name, description, "isActive", "createdAt", "updatedAt") VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Administrador', 'Acceso total', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Operador', 'Operaciones', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO users (id, "firstName", "lastName", email, password, "roleId", "isActive", "createdAt", "updatedAt") VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Admin', 'Test', 'admin@test.com', '$2b$10$test_hash', '550e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440002', 'Operador', 'Test', 'operador@test.com', '$2b$10$test_hash', '550e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT 'Roles: ' || count(*) FROM roles;
SELECT 'Users: ' || count(*) FROM users;
