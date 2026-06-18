-- Cargar datos desactivando triggers temporalmente
BEGIN;

-- Desactivar triggers de foreign keys temporalmente
ALTER TABLE users DISABLE TRIGGER ALL;
ALTER TABLE categories DISABLE TRIGGER ALL;
ALTER TABLE products DISABLE TRIGGER ALL;
ALTER TABLE kits DISABLE TRIGGER ALL;
ALTER TABLE beneficiaries DISABLE TRIGGER ALL;

TRUNCATE TABLE users, categories, products, kits, beneficiaries CASCADE;

\copy users FROM '/tmp/users_sample.csv' CSV HEADER
\copy categories FROM '/tmp/categories.csv' CSV HEADER
\copy products FROM '/tmp/products.csv' CSV HEADER
\copy kits FROM '/tmp/kits.csv' CSV HEADER
\copy beneficiaries FROM '/tmp/beneficiaries.csv' CSV HEADER

-- Reactivar triggers
ALTER TABLE users ENABLE TRIGGER ALL;
ALTER TABLE categories ENABLE TRIGGER ALL;
ALTER TABLE products ENABLE TRIGGER ALL;
ALTER TABLE kits ENABLE TRIGGER ALL;
ALTER TABLE beneficiaries ENABLE TRIGGER ALL;

COMMIT;

SELECT 'Datos cargados:' as info;
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Categories: ' || count(*) FROM categories;
SELECT 'Products: ' || count(*) FROM products;
SELECT 'Kits: ' || count(*) FROM kits;
SELECT 'Beneficiaries: ' || count(*) FROM beneficiaries;
