-- Cargar datos en sigah_test
TRUNCATE TABLE users, categories, products, kits, beneficiaries CASCADE;

\copy users FROM '/tmp/users_sample.csv' CSV HEADER
\copy categories FROM '/tmp/categories.csv' CSV HEADER
\copy products FROM '/tmp/products.csv' CSV HEADER
\copy kits FROM '/tmp/kits.csv' CSV HEADER
\copy beneficiaries FROM '/tmp/beneficiaries.csv' CSV HEADER

SELECT 'Datos cargados en sigah_test:' as info;
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Categories: ' || count(*) FROM categories;
SELECT 'Products: ' || count(*) FROM products;
SELECT 'Kits: ' || count(*) FROM kits;
SELECT 'Beneficiaries: ' || count(*) FROM beneficiaries;
