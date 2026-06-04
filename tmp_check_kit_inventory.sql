SELECT k.code, k.name, ki.quantity 
FROM kits k 
LEFT JOIN kit_inventory ki ON k.id = ki."kitId" 
WHERE k."isActive" = true 
ORDER BY k.code;
