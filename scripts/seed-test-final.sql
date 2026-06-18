-- Seed final para sigah_test con nombres de columnas correctos

-- 1. Roles
INSERT INTO roles (id, name, description, permissions, "isActive") VALUES
  (gen_random_uuid(), 'Administrador', 'Acceso total', '["*"]', true),
  (gen_random_uuid(), 'Operador', 'Operaciones basicas', '["inventory:read", "kits:read", "deliveries:read"]', true),
  (gen_random_uuid(), 'Auditor', 'Solo lectura', '["reports:read", "audit:read"]', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Usuarios de prueba
INSERT INTO users (id, "firstName", "lastName", email, password, "roleId", "isActive", "emailVerified") VALUES
  (gen_random_uuid(), 'Admin', 'Test', 'admin@test.com', '$2b$10$test_hash', (SELECT id FROM roles WHERE name='Administrador'), true, true),
  (gen_random_uuid(), 'Operador', 'Test', 'operador@test.com', '$2b$10$test_hash', (SELECT id FROM roles WHERE name='Operador'), true, true)
ON CONFLICT (email) DO NOTHING;

-- 3. Categorias
INSERT INTO categories (id, name, description, "isActive") VALUES
  (gen_random_uuid(), 'Alimentos', 'Productos alimenticios', true),
  (gen_random_uuid(), 'Higiene', 'Productos de higiene', true),
  (gen_random_uuid(), 'Ropa', 'Vestimenta', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Productos
INSERT INTO products (id, code, name, description, "categoryId", unit, "minStock", "isActive") VALUES
  (gen_random_uuid(), 'ARROZ001', 'Arroz 1kg', 'Arroz blanco', (SELECT id FROM categories WHERE name='Alimentos'), 'UNIT', 50, true),
  (gen_random_uuid(), 'ACEI001', 'Aceite 1L', 'Aceite vegetal', (SELECT id FROM categories WHERE name='Alimentos'), 'UNIT', 30, true),
  (gen_random_uuid(), 'JABO001', 'Jabon 3un', 'Jabon tocador', (SELECT id FROM categories WHERE name='Higiene'), 'BOX', 20, true),
  (gen_random_uuid(), 'PANA001', 'Panuelos', 'Panuelos x100', (SELECT id FROM categories WHERE name='Higiene'), 'UNIT', 40, true)
ON CONFLICT (code) DO NOTHING;

-- 5. Kits
INSERT INTO kits (id, code, name, description, "isActive") VALUES
  (gen_random_uuid(), 'KIT01', 'Kit Alimentacion Basica', 'Arroz y aceite', true),
  (gen_random_uuid(), 'KIT02', 'Kit Higiene Personal', 'Jabon y panuelos', true)
ON CONFLICT (code) DO NOTHING;

-- 6. Composicion de kits (kit_products)
INSERT INTO kit_products (id, "kitId", "productId", quantity) VALUES
  (gen_random_uuid(), (SELECT id FROM kits WHERE code='KIT01'), (SELECT id FROM products WHERE code='ARROZ001'), 2),
  (gen_random_uuid(), (SELECT id FROM kits WHERE code='KIT01'), (SELECT id FROM products WHERE code='ACEI001'), 1),
  (gen_random_uuid(), (SELECT id FROM kits WHERE code='KIT02'), (SELECT id FROM products WHERE code='JABO001'), 1),
  (gen_random_uuid(), (SELECT id FROM kits WHERE code='KIT02'), (SELECT id FROM products WHERE code='PANA001'), 2)
ON CONFLICT DO NOTHING;

-- 7. Beneficiarios (usando populationType en lugar de vulnerabilityType)
INSERT INTO beneficiaries (id, "firstName", "lastName", "documentNumber", city, "familySize", "populationType", "isActive") VALUES
  (gen_random_uuid(), 'Juan', 'Perez', '1234567890', 'Bogota', 4, 'VICTIMAS', true),
  (gen_random_uuid(), 'Maria', 'Garcia', '0987654321', 'Medellin', 3, 'MIGRANTES', true)
ON CONFLICT DO NOTHING;

-- Verificar
SELECT 'Datos de prueba creados:' as info;
SELECT 'Roles: ' || count(*) FROM roles;
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Categories: ' || count(*) FROM categories;
SELECT 'Products: ' || count(*) FROM products;
SELECT 'Kits: ' || count(*) FROM kits;
SELECT 'KitProducts: ' || count(*) FROM kit_products;
SELECT 'Beneficiaries: ' || count(*) FROM beneficiaries;
