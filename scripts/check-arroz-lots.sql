SELECT pl."lotNumber", pl.quantity, pl."expiryDate" FROM product_lots pl JOIN products p ON p.id = pl."productId" WHERE p.name ILIKE '%arroz%' ORDER BY pl."expiryDate";
