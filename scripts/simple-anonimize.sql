-- Script simplificado de anonimización
-- Extraer y cargar solo datos esenciales para pruebas

-- Conectar a producción y extraer
\c sigah

-- Crear archivo con datos básicos
\copy (SELECT id, first_name, last_name, email, password, role_id, is_active FROM users LIMIT 5) TO '/tmp/users_sample.csv' CSV HEADER
\copy (SELECT * FROM categories) TO '/tmp/categories.csv' CSV HEADER
\copy (SELECT id, code, name, category_id, unit, min_stock, is_active FROM products) TO '/tmp/products.csv' CSV HEADER
\copy (SELECT id, code, name, is_active FROM kits) TO '/tmp/kits.csv' CSV HEADER
\copy (SELECT id, first_name, last_name, document_number, city, family_size, is_active FROM beneficiaries LIMIT 10) TO '/tmp/beneficiaries.csv' CSV HEADER
\copy (SELECT * FROM kit_products) TO '/tmp/kit_products.csv' CSV HEADER
\copy (SELECT * FROM kit_inventory) TO '/tmp/kit_inventory.csv' CSV HEADER
\copy (SELECT * FROM product_lots LIMIT 50) TO '/tmp/lots.csv' CSV HEADER
\copy (SELECT id, code, beneficiary_id, status, created_at FROM requests) TO '/tmp/requests.csv' CSV HEADER
\copy (SELECT id, request_id, code, status, delivery_date FROM deliveries) TO '/tmp/deliveries.csv' CSV HEADER

-- Conectar a test y cargar
\c sigah_test

TRUNCATE TABLE users, categories, products, kits, kit_products, kit_inventory, 
               beneficiaries, requests, deliveries, product_lots CASCADE;

\copy users FROM '/tmp/users_sample.csv' CSV HEADER
\copy categories FROM '/tmp/categories.csv' CSV HEADER
\copy products FROM '/tmp/products.csv' CSV HEADER
\copy kits FROM '/tmp/kits.csv' CSV HEADER
\copy kit_products FROM '/tmp/kit_products.csv' CSV HEADER
\copy kit_inventory FROM '/tmp/kit_inventory.csv' CSV HEADER
\copy beneficiaries FROM '/tmp/beneficiaries.csv' CSV HEADER
\copy requests FROM '/tmp/requests.csv' CSV HEADER
\copy deliveries FROM '/tmp/deliveries.csv' CSV HEADER
\copy product_lots FROM '/tmp/lots.csv' CSV HEADER

SELECT 'Datos cargados:' as info;
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Products: ' || count(*) FROM products;
SELECT 'Kits: ' || count(*) FROM kits;
SELECT 'Beneficiaries: ' || count(*) FROM beneficiaries;
