-- Cargar datos paso a paso
TRUNCATE TABLE users, categories, products, kits, beneficiaries CASCADE;

\copy users(id, "firstName", "lastName", email, password, "roleId", "isActive") FROM '/tmp/users_sample.csv' CSV HEADER
\copy categories FROM '/tmp/categories.csv' CSV HEADER
\copy products(id, code, name, "categoryId", unit, "minStock", "isActive") FROM '/tmp/products.csv' CSV HEADER
\copy kits(id, code, name, "isActive") FROM '/tmp/kits.csv' CSV HEADER
\copy beneficiaries(id, "firstName", "lastName", "documentNumber", city, "familySize", "isActive") FROM '/tmp/beneficiaries.csv' CSV HEADER

SELECT 'Datos cargados:' as info;
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Categories: ' || count(*) FROM categories;
SELECT 'Products: ' || count(*) FROM products;
SELECT 'Kits: ' || count(*) FROM kits;
SELECT 'Beneficiaries: ' || count(*) FROM beneficiaries;
