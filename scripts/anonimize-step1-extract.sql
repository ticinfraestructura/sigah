-- Paso 1: Extraer datos anonimizados de producción a archivo temporal
\copy (SELECT id, 'Usuario' || ROW_NUMBER() OVER (ORDER BY created_at) as first_name, 'Test' || ROW_NUMBER() OVER (ORDER BY created_at) as last_name, 'user' || ROW_NUMBER() OVER (ORDER BY created_at) || '@test.com' as email, password, role_id, is_active, email_verified, last_login, created_at, updated_at, '3000000000' as phone, 'Direccion anonimizada' as address, 'Ciudad' as city, 0 as failed_login_attempts, null as locked_until FROM users) TO '/tmp/users_anon.csv' CSV HEADER

\copy (SELECT id, 'PROD' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0') as code, name, description, category_id, unit, min_stock, is_perishable, is_active, created_at, updated_at FROM products) TO '/tmp/products_anon.csv' CSV HEADER

\copy (SELECT id, 'KIT' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0') as code, name, description, is_active, created_at, updated_at FROM kits) TO '/tmp/kits_anon.csv' CSV HEADER

\copy (SELECT id, document_type, LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 10, '0') as document_number, 'Beneficiario' || ROW_NUMBER() OVER (ORDER BY created_at) as first_name, 'Apellido' || ROW_NUMBER() OVER (ORDER BY created_at) as last_name, '3000000000' as phone, 'Direccion anonimizada' as address, city, family_size, vulnerability_type, is_active, 'benef' || ROW_NUMBER() OVER (ORDER BY created_at) || '@test.com' as email, notes, created_at, updated_at FROM beneficiaries) TO '/tmp/beneficiaries_anon.csv' CSV HEADER

\copy (SELECT * FROM categories) TO '/tmp/categories.csv' CSV HEADER
\copy (SELECT * FROM product_lots) TO '/tmp/product_lots.csv' CSV HEADER
\copy (SELECT * FROM kit_products) TO '/tmp/kit_products.csv' CSV HEADER
\copy (SELECT * FROM kit_inventory) TO '/tmp/kit_inventory.csv' CSV HEADER
\copy (SELECT * FROM requests) TO '/tmp/requests.csv' CSV HEADER
\copy (SELECT * FROM request_kits) TO '/tmp/request_kits.csv' CSV HEADER
\copy (SELECT * FROM request_products) TO '/tmp/request_products.csv' CSV HEADER
\copy (SELECT * FROM deliveries) TO '/tmp/deliveries.csv' CSV HEADER
\copy (SELECT * FROM delivery_details) TO '/tmp/delivery_details.csv' CSV HEADER
\copy (SELECT * FROM delivery_status_history) TO '/tmp/delivery_status_history.csv' CSV HEADER
\copy (SELECT * FROM stock_movements) TO '/tmp/stock_movements.csv' CSV HEADER
\copy (SELECT * FROM kit_inventory_movements) TO '/tmp/kit_inventory_movements.csv' CSV HEADER
\copy (SELECT id, type, 'Notificacion de prueba' as title, 'Mensaje de prueba' as message, recipient_id, sender_id, is_read, read_at, data, created_at, updated_at FROM notifications) TO '/tmp/notifications_anon.csv' CSV HEADER
\copy (SELECT * FROM roles) TO '/tmp/roles.csv' CSV HEADER
\copy (SELECT * FROM returns) TO '/tmp/returns.csv' CSV HEADER
\copy (SELECT * FROM return_details) TO '/tmp/return_details.csv' CSV HEADER
