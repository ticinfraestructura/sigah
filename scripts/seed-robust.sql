-- Seed robusto con todos los campos requeridos

-- Limpiar primero
TRUNCATE TABLE kit_products, kit_inventory, beneficiaries, products, kits, categories, users, roles CASCADE;

-- 1. Roles
INSERT INTO roles (id, name, description, permissions, "isActive", "createdAt", "updatedAt") VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Administrador', 'Acceso total', '["*"]', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'Operador', 'Operaciones basicas', '["inventory:read", "kits:read", "deliveries:read"]', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Auditor', 'Solo lectura', '["reports:read", "audit:read"]', true, NOW(), NOW());

-- 2. Usuarios
INSERT INTO users (id, "firstName", "lastName", email, password, "roleId", "isActive", "emailVerified", "createdAt", "updatedAt") VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'Admin', 'Test', 'admin@test.com', '$2b$10$test_hash', '550e8400-e29b-41d4-a716-446655440000', true, true, NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440001', 'Operador', 'Test', 'operador@test.com', '$2b$10$test_hash', '550e8400-e29b-41d4-a716-446655440001', true, true, NOW(), NOW());

-- 3. Categorias
INSERT INTO categories (id, name, description, "isActive", "createdAt", "updatedAt") VALUES
  ('770e8400-e29b-41d4-a716-446655440000', 'Alimentos', 'Productos alimenticios', true, NOW(), NOW()),
  ('770e8400-e29b-41d4-a716-446655440001', 'Higiene', 'Productos de higiene', true, NOW(), NOW());

-- 4. Productos
INSERT INTO products (id, code, name, description, "categoryId", unit, "minStock", "isActive", "createdAt", "updatedAt") VALUES
  ('880e8400-e29b-41d4-a716-446655440000', 'ARROZ001', 'Arroz 1kg', 'Arroz blanco', '770e8400-e29b-41d4-a716-446655440000', 'UNIT', 50, true, NOW(), NOW()),
  ('880e8400-e29b-41d4-a716-446655440001', 'ACEI001', 'Aceite 1L', 'Aceite vegetal', '770e8400-e29b-41d4-a716-446655440000', 'UNIT', 30, true, NOW(), NOW()),
  ('880e8400-e29b-41d4-a716-446655440002', 'JABO001', 'Jabon 3un', 'Jabon tocador', '770e8400-e29b-41d4-a716-446655440001', 'BOX', 20, true, NOW(), NOW());

-- 5. Kits
INSERT INTO kits (id, code, name, description, "isActive", "createdAt", "updatedAt") VALUES
  ('990e8400-e29b-41d4-a716-446655440000', 'KIT01', 'Kit Alimentacion', 'Arroz y aceite', true, NOW(), NOW()),
  ('990e8400-e29b-41d4-a716-446655440001', 'KIT02', 'Kit Higiene', 'Jabon', true, NOW(), NOW());

-- 6. Kit Products
INSERT INTO kit_products (id, "kitId", "productId", quantity) VALUES
  (gen_random_uuid(), '990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440000', 2),
  (gen_random_uuid(), '990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440001', 1),
  (gen_random_uuid(), '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', 3);

-- 7. Inventario de kits
INSERT INTO kit_inventory (id, "kitId", quantity, "lotNumber", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), '990e8400-e29b-41d4-a716-446655440000', 10, 'L001', NOW(), NOW()),
  (gen_random_uuid(), '990e8400-e29b-41d4-a716-446655440001', 5, 'L002', NOW(), NOW());

-- 8. Beneficiarios (con documentType)
INSERT INTO beneficiaries (id, "firstName", "lastName", "documentType", "documentNumber", city, "familySize", "populationType", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'Juan', 'Perez', 'CC', '1234567890', 'Bogota', 4, 'VICTIMAS', true, NOW(), NOW()),
  (gen_random_uuid(), 'Maria', 'Garcia', 'CC', '0987654321', 'Medellin', 3, 'MIGRANTES', true, NOW(), NOW());

-- Verificacion
SELECT 'Datos de prueba creados:' as info;
SELECT 'Roles: ' || count(*) FROM roles;
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Categories: ' || count(*) FROM categories;
SELECT 'Products: ' || count(*) FROM products;
SELECT 'Kits: ' || count(*) FROM kits;
SELECT 'KitProducts: ' || count(*) FROM kit_products;
SELECT 'KitInventory: ' || count(*) FROM kit_inventory;
SELECT 'Beneficiaries: ' || count(*) FROM beneficiaries;
