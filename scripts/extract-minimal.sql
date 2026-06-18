-- Extracción mínima de datos de prueba
\copy (SELECT id, first_name, last_name, email, password, role_id, is_active FROM users LIMIT 3) TO '/tmp/users_sample.csv' CSV HEADER
\copy (SELECT * FROM categories) TO '/tmp/categories.csv' CSV HEADER
\copy (SELECT id, code, name, category_id, unit, min_stock, is_active FROM products LIMIT 20) TO '/tmp/products.csv' CSV HEADER
\copy (SELECT id, code, name, is_active FROM kits LIMIT 10) TO '/tmp/kits.csv' CSV HEADER
\copy (SELECT id, first_name, last_name, document_number, city, family_size, is_active FROM beneficiaries LIMIT 10) TO '/tmp/beneficiaries.csv' CSV HEADER
\copy (SELECT * FROM kit_products WHERE kit_id IN (SELECT id FROM kits LIMIT 10)) TO '/tmp/kit_products.csv' CSV HEADER
\copy (SELECT * FROM kit_inventory WHERE kit_id IN (SELECT id FROM kits LIMIT 10)) TO '/tmp/kit_inventory.csv' CSV HEADER
