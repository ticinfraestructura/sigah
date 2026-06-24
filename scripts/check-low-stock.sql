SELECT 
  p.code, 
  p.name, 
  p."minStock", 
  COALESCE(SUM(pl.quantity), 0) as stock,
  p."minStock" - COALESCE(SUM(pl.quantity), 0) as deficit
FROM products p 
LEFT JOIN product_lots pl ON pl."productId" = p.id 
WHERE p."isActive" = true 
GROUP BY p.id, p.code, p.name, p."minStock" 
HAVING COALESCE(SUM(pl.quantity), 0) <= p."minStock" 
ORDER BY deficit DESC 
LIMIT 10;
