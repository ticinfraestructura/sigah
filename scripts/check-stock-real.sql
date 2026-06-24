SELECT 
  p.code,
  p.name,
  p."isActive",
  COALESCE(SUM(pl.quantity), 0) as stock_total,
  COUNT(pl.id) as numero_lotes
FROM products p
LEFT JOIN product_lots pl ON pl."productId" = p.id
WHERE p.name ILIKE '%arroz%' OR p.name ILIKE '%aceite%' OR p.name ILIKE '%leche%'
GROUP BY p.id, p.code, p.name, p."isActive"
ORDER BY p.code;
