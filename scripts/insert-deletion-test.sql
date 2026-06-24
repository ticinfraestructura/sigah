INSERT INTO stock_movements (id, "productId", "lotId", type, quantity, reason, reference, "userId", "createdAt")
SELECT 
  gen_random_uuid(),
  p.id,
  pl.id,
  'EXIT',
  -5,
  'Eliminación de prueba para reporte histórico',
  'ELIMINACION-TEST-001',
  u.id,
  NOW()
FROM products p
JOIN product_lots pl ON pl."productId" = p.id
JOIN users u ON u.email = 'admin@sigah.com'
WHERE p.code = 'HOG-001'
LIMIT 1;
