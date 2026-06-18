-- Cargar datos mínimos en sigah_test
TRUNCATE TABLE users, categories, products, kits, beneficiaries CASCADE;

-- Insertar datos de prueba básicos
INSERT INTO users (id, email, "roleId", "isActive") VALUES
  (gen_random_uuid(), 'admin@test.com', (SELECT id FROM roles WHERE name='Administrador' LIMIT 1), true),
  (gen_random_uuid(), 'operador@test.com', (SELECT id FROM roles WHERE name='Operador' LIMIT 1), true);

-- Insertar categorías básicas si no existen
INSERT INTO categories (id, name, "isActive") VALUES
  (gen_random_uuid(), 'Alimentos', true),
  (gen_random_uuid(), 'Higiene', true),
  (gen_random_uuid(), 'Ropa', true)
ON CONFLICT DO NOTHING;

-- Verificar carga
SELECT 'Datos de prueba cargados:' as info;
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Categories: ' || count(*) FROM categories;
SELECT 'Roles: ' || count(*) FROM roles;
