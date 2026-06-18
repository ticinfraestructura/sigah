-- Extracción con nombres de columnas correctos
\copy (SELECT id, "firstName", "lastName", email, password, "roleId", "isActive" FROM users LIMIT 3) TO '/tmp/users_sample.csv' CSV HEADER
\copy (SELECT * FROM categories) TO '/tmp/categories.csv' CSV HEADER
\copy (SELECT id, code, name, "categoryId", unit, "minStock", "isActive" FROM products LIMIT 20) TO '/tmp/products.csv' CSV HEADER
\copy (SELECT id, code, name, "isActive" FROM kits LIMIT 10) TO '/tmp/kits.csv' CSV HEADER
\copy (SELECT id, "firstName", "lastName", "documentNumber", city, "familySize", "isActive" FROM beneficiaries LIMIT 10) TO '/tmp/beneficiaries.csv' CSV HEADER
