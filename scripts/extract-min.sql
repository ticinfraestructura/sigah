-- Extraer datos mínimos para pruebas
\copy (SELECT id, email, "roleId", "isActive" FROM users WHERE "isActive" = true LIMIT 2) TO '/tmp/users_min.csv' CSV HEADER
\copy (SELECT id, code, name, "isActive" FROM kits WHERE "isActive" = true LIMIT 5) TO '/tmp/kits_min.csv' CSV HEADER
\copy (SELECT id, code, name, unit, "isActive" FROM products WHERE "isActive" = true LIMIT 10) TO '/tmp/products_min.csv' CSV HEADER
