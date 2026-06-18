-- Extraer datos de producción
\copy (SELECT id, first_name, last_name, email, password, role_id, is_active FROM users LIMIT 5) TO '/tmp/users_sample.csv' CSV HEADER
\copy (SELECT * FROM categories) TO '/tmp/categories.csv' CSV HEADER
\copy (SELECT id, code, name, category_id, unit, min_stock, is_active FROM products) TO '/tmp/products.csv' CSV HEADER
\copy (SELECT id, code, name, is_active FROM kits) TO '/tmp/kits.csv' CSV HEADER
\copy (SELECT id, first_name, last_name, document_number, city, family_size, is_active FROM beneficiaries LIMIT 10) TO '/tmp/beneficiaries.csv' CSV HEADER
\copy (SELECT * FROM kit_products) TO '/tmp/kit_products.csv' CSV HEADER
\copy (SELECT * FROM kit_inventory) TO '/tmp/kit_inventory.csv' CSV HEADER
\copy (SELECT id, code, beneficiary_id, status, created_at FROM requests LIMIT 20) TO '/tmp/requests.csv' CSV HEADER
\copy (SELECT id, request_id, code, status, delivery_date FROM deliveries LIMIT 15) TO '/tmp/deliveries.csv' CSV HEADER
