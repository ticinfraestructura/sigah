-- Seed completo para sigah_test
-- Crear datos de prueba desde cero

-- 1. Roles
INSERT INTO roles (id, name, description, permissions, "isActive") VALUES
  (gen_random_uuid(), 'Administrador', 'Acceso total', '["*"]', true),
  (gen_random_uuid(), 'Operador', 'Operaciones básicas', '["inventory:read", "kits:read", "deliveries:read", "requests:read"]', true),
  (gen_random_uuid(), 'Auditor', 'Solo lectura', '["reports:read", "audit:read"]', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Usuarios de prueba (contraseña: test123)
INSERT INTO users (id, "firstName", "lastName", email, password, "roleId", "isActive", "emailVerified") VALUES
  (gen_random_uuid(), 'Admin', 'Test', 'admin@test.com', '$2b$10$test_hash', (SELECT id FROM roles WHERE name='Administrador'), true, true),
  (gen_random_uuid(), 'Operador', 'Test', 'operador@test.com', '$2b$10$test_hash', (SELECT id FROM roles WHERE name='Operador'), true, true),
  (gen_random_uuid(), 'Auditor', 'Test', 'auditor@test.com', '$2b$10$test_hash', (SELECT id FROM roles WHERE name='Auditor'), true, true)
ON CONFLICT (email) DO NOTHING;

-- 3. Categorías
INSERT INTO categories (id, name, description, "isActive") VALUES
  (gen_random_uuid(), 'Alimentos', 'Productos alimenticios no perecederos', true),
  (gen_random_uuid(), 'Higiene', 'Productos de higiene personal', true),
  (gen_random_uuid(), 'Ropa', 'Vestimenta básica', true),
  (gen_random_uuid(), 'Hogar', 'Artículos para el hogar', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Productos
INSERT INTO products (id, code, name, description, "categoryId", unit, "minStock", "isActive") VALUES
  (gen_random_uuid(), 'ARROZ001', 'Arroz 1kg', 'Arroz blanco grano largo', (SELECT id FROM categories WHERE name='Alimentos'), 'UNIT', 50, true),
  (gen_random_uuid(), 'ACEI001', 'Aceite 1L', 'Aceite vegetal 1 litro', (SELECT id FROM categories WHERE name='Alimentos'), 'UNIT', 30, true),
  (gen_random_uuid(), 'JABO001', 'Jabón 3un', 'Jabón de tocador 3 unidades', (SELECT id FROM categories WHERE name='Higiene'), 'BOX', 20, true),
  (gen_random_uuid(), 'PAÑA001', 'Pañuelos', 'Pañuelos desechables x100', (SELECT id FROM categories WHERE name='Higiene'), 'UNIT', 40, true),
  (gen_random_uuid(), 'CAMI001', 'Camiseta', 'Camiseta básica talla M', (SELECT id FROM categories WHERE name='Ropa'), 'UNIT', 25, true)
ON CONFLICT (code) DO NOTHING;

-- 5. Kits
INSERT INTO kits (id, code, name, description, "isActive") VALUES
  (gen_random_uuid(), 'KIT01', 'Kit Alimentación Básica', 'Incluye arroz y aceite', true),
  (gen_random_uuid(), 'KIT02', 'Kit Higiene Personal', 'Incluye jabón y pañuelos', true),
  (gen_random_uuid(), 'KIT03', 'Kit Completo', 'Alimentos + higiene', true)
ON CONFLICT (code) DO NOTHING;

-- 6. Composición de kits
INSERT INTO "kitProducts" (id, "kitId", "productId", quantity) VALUES
  (gen_random_uuid(), (SELECT id FROM kits WHERE code='KIT01'), (SELECT id FROM products WHERE code='ARROZ001'), 2),
  (gen_random_uuid(), (SELECT id FROM kits WHERE code='KIT01'), (SELECT id FROM products WHERE code='ACEI001'), 1),
  (gen_random_uuid(), (SELECT id FROM kits WHERE code='KIT02'), (SELECT id FROM products WHERE code='JABO001'), 1),
  (gen_random_uuid(), (SELECT id FROM kits WHERE code='KIT02'), (SELECT id FROM products WHERE code='PAÑA001'), 2)
ON CONFLICT DO NOTHING;

-- 7. Beneficiarios
INSERT INTO beneficiaries (id, "firstName", "lastName", "documentNumber", city, "familySize", "vulnerabilityType", "isActive") VALUES
  (gen_random_uuid(), 'Juan', 'Perez', '1234567890', 'Bogotá', 4, 'ALTA', true),
  (gen_random_uuid(), 'Maria', 'Garcia', '0987654321', 'Medellín', 3, 'MEDIA', true),
  (gen_random_uuid(), 'Carlos', 'Lopez', '5678901234', 'Cali', 5, 'ALTA', true)
ON CONFLICT DO NOTHING;

-- Verificar
SELECT 'Datos de prueba creados:' as info;
SELECT 'Roles: ' || count(*) FROM roles;
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Categories: ' || count(*) FROM categories;
SELECT 'Products: ' || count(*) FROM products;
SELECT 'Kits: ' || count(*) FROM kits;
SELECT 'Beneficiaries: ' || count(*) FROM beneficiaries;
