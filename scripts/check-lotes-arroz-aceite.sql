SELECT 
  p.code,
  p.name,
  pl."lotNumber",
  pl.quantity,
  COALESCE(pl."expiryDate"::text, 'sin fecha') as vencimiento,
  pl."createdAt"::date as creado
FROM products p
JOIN product_lots pl ON pl."productId" = p.id
WHERE p.name ILIKE '%arroz%' OR p.name ILIKE '%aceite%'
ORDER BY p.code, pl."expiryDate";
