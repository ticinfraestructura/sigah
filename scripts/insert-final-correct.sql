-- Insertar datos finales con columnas correctas

-- Lotes de productos (expiryDate no expirationDate)
INSERT INTO product_lots (id, "productId", quantity, "lotNumber", "expiryDate", "isActive", "createdAt", "updatedAt") VALUES
  ('770e8400-e29b-41d4-a716-446655440001', (SELECT id FROM products WHERE code='ARROZ001'), 100, 'L001', '2026-12-31', true, NOW(), NOW()),
  ('770e8400-e29b-41d4-a716-446655440002', (SELECT id FROM products WHERE code='ACEI001'), 50, 'L002', '2026-11-30', true, NOW(), NOW()),
  ('770e8400-e29b-41d4-a716-446655440003', (SELECT id FROM products WHERE code='JABO001'), 30, 'L003', '2027-01-31', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Inventario de kits
INSERT INTO kit_inventory (id, "kitId", quantity, "createdAt", "updatedAt") VALUES
  ('880e8400-e29b-41d4-a716-446655440001', (SELECT id FROM kits WHERE code='KIT01'), 10, NOW(), NOW()),
  ('880e8400-e29b-41d4-a716-446655440002', (SELECT id FROM kits WHERE code='KIT02'), 5, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Solicitudes
INSERT INTO requests (id, code, "beneficiaryId", status, priority, "createdById", "createdAt", "updatedAt") VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', 'SOL-001', (SELECT id FROM beneficiaries LIMIT 1), 'PENDING', 3, (SELECT id FROM users WHERE email='admin@test.com'), NOW(), NOW()),
  ('aa0e8400-e29b-41d4-a716-446655440002', 'SOL-002', (SELECT id FROM beneficiaries OFFSET 1 LIMIT 1), 'APPROVED', 2, (SELECT id FROM users WHERE email='admin@test.com'), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Detalle de solicitudes (sin createdAt/updatedAt)
INSERT INTO request_kits (id, "requestId", "kitId", "quantityRequested") VALUES
  ('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', (SELECT id FROM kits WHERE code='KIT01'), 2),
  ('bb0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440002', (SELECT id FROM kits WHERE code='KIT02'), 1)
ON CONFLICT DO NOTHING;

SELECT 'Datos finales creados:' as info;
SELECT 'Product Lots: ' || count(*) FROM product_lots;
SELECT 'Kit Inventory: ' || count(*) FROM kit_inventory;
SELECT 'Requests: ' || count(*) FROM requests;
SELECT 'Request Kits: ' || count(*) FROM request_kits;
