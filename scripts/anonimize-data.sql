-- Script de anonimización de datos SIGAH
-- Copia datos de producción a sigah_test removiendo información sensible

-- Truncar tablas primero (limpieza)
TRUNCATE TABLE audit_logs, delivery_details, delivery_status_history, 
               deliveries, kit_inventory_movements, kit_inventory, kit_products, 
               kits, notifications, product_lots, request_kits, request_products, 
               requests, return_details, returns, stock_movements, 
               beneficiary_family_members, beneficiaries, products, categories,
               user_sessions, users, roles CASCADE;

-- Copiar roles (sin cambios, no son sensibles)
INSERT INTO sigah_test.roles SELECT * FROM sigah.roles;

-- Copiar usuarios con datos anonimizados
INSERT INTO sigah_test.users (id, first_name, last_name, email, password, 
    role_id, is_active, email_verified, last_login, created_at, updated_at,
    phone, address, city, failed_login_attempts, locked_until)
SELECT 
    id,
    'Usuario' || ROW_NUMBER() OVER (ORDER BY created_at) as first_name,
    'Test' || ROW_NUMBER() OVER (ORDER BY created_at) as last_name,
    'user' || ROW_NUMBER() OVER (ORDER BY created_at) || '@test.com' as email,
    password, -- mantener hash para poder loguear
    role_id,
    is_active,
    email_verified,
    last_login,
    created_at,
    updated_at,
    '3000000000'::text as phone,
    'Dirección de prueba'::text as address,
    'Ciudad'::text as city,
    0 as failed_login_attempts,
    null as locked_until
FROM sigah.users;

-- Copiar categorías (no sensibles)
INSERT INTO sigah_test.categories SELECT * FROM sigah.categories;

-- Copiar productos con códigos anonimizados
INSERT INTO sigah_test.products (id, code, name, description, category_id, unit, 
    min_stock, is_perishable, is_active, created_at, updated_at)
SELECT 
    id,
    'PROD' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0') as code,
    name,
    description,
    category_id,
    unit,
    min_stock,
    is_perishable,
    is_active,
    created_at,
    updated_at
FROM sigah.products;

-- Copiar lotes de productos (referenciando productos anonimizados por ID)
INSERT INTO sigah_test.product_lots SELECT * FROM sigah.product_lots;

-- Copiar kits con códigos anonimizados
INSERT INTO sigah_test.kits (id, code, name, description, is_active, created_at, updated_at)
SELECT 
    id,
    'KIT' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0') as code,
    name,
    description,
    is_active,
    created_at,
    updated_at
FROM sigah.kits;

-- Copiar composición de kits
INSERT INTO sigah_test.kit_products SELECT * FROM sigah.kit_products;

-- Copiar inventario de kits
INSERT INTO sigah_test.kit_inventory SELECT * FROM sigah.kit_inventory;

-- Copiar beneficiarios anonimizados
INSERT INTO sigah_test.beneficiaries (id, document_type, document_number, first_name, 
    last_name, phone, address, city, family_size, vulnerability_type, is_active, 
    email, notes, created_at, updated_at)
SELECT 
    id,
    document_type,
    LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 10, '0') as document_number,
    'Beneficiario' || ROW_NUMBER() OVER (ORDER BY created_at) as first_name,
    'Apellido' || ROW_NUMBER() OVER (ORDER BY created_at) as last_name,
    '3000000000'::text as phone,
    'Dirección anonimizada'::text as address,
    city,
    family_size,
    vulnerability_type,
    is_active,
    'benef' || ROW_NUMBER() OVER (ORDER BY created_at) || '@test.com' as email,
    notes,
    created_at,
    updated_at
FROM sigah.beneficiaries;

-- Copiar solicitudes
INSERT INTO sigah_test.requests SELECT * FROM sigah.requests;

-- Copiar detalles de solicitudes
INSERT INTO sigah_test.request_kits SELECT * FROM sigah.request_kits;
INSERT INTO sigah_test.request_products SELECT * FROM sigah.request_products;

-- Copiar entregas
INSERT INTO sigah_test.deliveries SELECT * FROM sigah.deliveries;
INSERT INTO sigah_test.delivery_details SELECT * FROM sigah.delivery_details;
INSERT INTO sigah_test.delivery_status_history SELECT * FROM sigah.delivery_status_history;

-- Copiar devoluciones
INSERT INTO sigah_test.returns SELECT * FROM sigah.returns;
INSERT INTO sigah_test.return_details SELECT * FROM sigah.return_details;

-- Copiar movimientos de stock
INSERT INTO sigah_test.stock_movements SELECT * FROM sigah.stock_movements;

-- Copiar movimientos de inventario de kits
INSERT INTO sigah_test.kit_inventory_movements SELECT * FROM sigah.kit_inventory_movements;

-- Copiar notificaciones (anonimizando contenido)
INSERT INTO sigah_test.notifications (id, type, title, message, recipient_id, 
    sender_id, is_read, read_at, data, created_at, updated_at)
SELECT 
    id,
    type,
    'Notificación de prueba'::text as title,
    'Mensaje de prueba'::text as message,
    recipient_id,
    sender_id,
    is_read,
    read_at,
    data,
    created_at,
    updated_at
FROM sigah.notifications;

-- Verificar conteos
SELECT 'Tabla' as tabla, 'Producción' as prod, 'Test' as test
UNION ALL
SELECT 'users', (SELECT COUNT(*)::text FROM sigah.users), (SELECT COUNT(*)::text FROM sigah_test.users)
UNION ALL
SELECT 'products', (SELECT COUNT(*)::text FROM sigah.products), (SELECT COUNT(*)::text FROM sigah_test.products)
UNION ALL
SELECT 'kits', (SELECT COUNT(*)::text FROM sigah.kits), (SELECT COUNT(*)::text FROM sigah_test.kits)
UNION ALL
SELECT 'beneficiaries', (SELECT COUNT(*)::text FROM sigah.beneficiaries), (SELECT COUNT(*)::text FROM sigah_test.beneficiaries)
UNION ALL
SELECT 'requests', (SELECT COUNT(*)::text FROM sigah.requests), (SELECT COUNT(*)::text FROM sigah_test.requests)
UNION ALL
SELECT 'deliveries', (SELECT COUNT(*)::text FROM sigah.deliveries), (SELECT COUNT(*)::text FROM sigah_test.deliveries);
