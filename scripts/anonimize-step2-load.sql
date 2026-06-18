-- Paso 2: Cargar datos anonimizados en sigah_test
-- Limpiar tablas primero
TRUNCATE TABLE audit_logs, delivery_details, delivery_status_history, 
               deliveries, kit_inventory_movements, kit_inventory, kit_products, 
               kits, notifications, product_lots, request_kits, request_products, 
               requests, returns, return_details, stock_movements, 
               beneficiaries, products, categories, users, roles CASCADE;

-- Cargar datos
\copy roles FROM '/tmp/roles.csv' CSV HEADER
\copy users FROM '/tmp/users_anon.csv' CSV HEADER
\copy categories FROM '/tmp/categories.csv' CSV HEADER
\copy products FROM '/tmp/products_anon.csv' CSV HEADER
\copy product_lots FROM '/tmp/product_lots.csv' CSV HEADER
\copy kits FROM '/tmp/kits_anon.csv' CSV HEADER
\copy kit_products FROM '/tmp/kit_products.csv' CSV HEADER
\copy kit_inventory FROM '/tmp/kit_inventory.csv' CSV HEADER
\copy beneficiaries FROM '/tmp/beneficiaries_anon.csv' CSV HEADER
\copy requests FROM '/tmp/requests.csv' CSV HEADER
\copy request_kits FROM '/tmp/request_kits.csv' CSV HEADER
\copy request_products FROM '/tmp/request_products.csv' CSV HEADER
\copy deliveries FROM '/tmp/deliveries.csv' CSV HEADER
\copy delivery_details FROM '/tmp/delivery_details.csv' CSV HEADER
\copy delivery_status_history FROM '/tmp/delivery_status_history.csv' CSV HEADER
\copy stock_movements FROM '/tmp/stock_movements.csv' CSV HEADER
\copy kit_inventory_movements FROM '/tmp/kit_inventory_movements.csv' CSV HEADER
\copy notifications FROM '/tmp/notifications_anon.csv' CSV HEADER
\copy returns FROM '/tmp/returns.csv' CSV HEADER
\copy return_details FROM '/tmp/return_details.csv' CSV HEADER

-- Verificar conteos
SELECT 'RESUMEN DE DATOS ANONIMIZADOS' as info;
SELECT 'users: ' || COUNT(*)::text as total FROM users;
SELECT 'products: ' || COUNT(*)::text as total FROM products;
SELECT 'kits: ' || COUNT(*)::text as total FROM kits;
SELECT 'beneficiaries: ' || COUNT(*)::text as total FROM beneficiaries;
SELECT 'requests: ' || COUNT(*)::text as total FROM requests;
SELECT 'deliveries: ' || COUNT(*)::text as total FROM deliveries;
