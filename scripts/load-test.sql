-- Cargar datos en sigah_test
TRUNCATE TABLE users, categories, products, kits, kit_products, kit_inventory, 
               beneficiaries, requests, deliveries CASCADE;

\copy users FROM '/tmp/users_sample.csv' CSV HEADER
\copy categories FROM '/tmp/categories.csv' CSV HEADER
\copy products FROM '/tmp/products.csv' CSV HEADER
\copy kits FROM '/tmp/kits.csv' CSV HEADER
\copy kit_products FROM '/tmp/kit_products.csv' CSV HEADER
\copy kit_inventory FROM '/tmp/kit_inventory.csv' CSV HEADER
\copy beneficiaries FROM '/tmp/beneficiaries.csv' CSV HEADER
\copy requests FROM '/tmp/requests.csv' CSV HEADER
\copy deliveries FROM '/tmp/deliveries.csv' CSV HEADER
