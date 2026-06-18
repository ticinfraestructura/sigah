INSERT INTO roles (id, name, description, "isActive", "createdAt", "updatedAt") VALUES
  ('r0000000-0000-0000-0000-000000000001', 'Administrador', 'Acceso total', true, NOW(), NOW()),
  ('r0000000-0000-0000-0000-000000000002', 'Operador', 'Operaciones', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO users (id, "firstName", "lastName", email, password, "roleId", "isActive", "emailVerified", "createdAt", "updatedAt") VALUES
  ('u0000000-0000-0000-0000-000000000001', 'Admin', 'Test', 'admin@test.com', '$2b$10$test_hash', 'r0000000-0000-0000-0000-000000000001', true, true, NOW(), NOW()),
  ('u0000000-0000-0000-0000-000000000002', 'Operador', 'Test', 'operador@test.com', '$2b$10$test_hash', 'r0000000-0000-0000-0000-000000000002', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT 'Roles: ' || count(*) FROM roles;
SELECT 'Users: ' || count(*) FROM users;
