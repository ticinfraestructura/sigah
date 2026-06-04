const fs = require('fs');
const p = '/app/dist/routes/delivery.routes.js';
let s = fs.readFileSync(p, 'utf8');
const needle = "        if (detail.kitId) {\n                    const requestKit = delivery.request.requestKits.find((rk) => rk.kitId === detail.kitId);\n                    if (requestKit?.kit) {\n                        for (const kp of requestKit.kit.kitProducts) {";
const insert = "        if (detail.kitId) {\n                    const requestKit = delivery.request.requestKits.find((rk) => rk.kitId === detail.kitId);\n                    if (requestKit?.kit) {\n                        const kitInventory = await tx.kitInventory.upsert({\n                            where: { kitId: detail.kitId },\n                            update: { quantity: { decrement: detail.quantity } },\n                            create: { kitId: detail.kitId, quantity: -detail.quantity }\n                        });\n                        await tx.kitInventoryMovement.create({\n                            data: {\n                                kitInventoryId: kitInventory.id,\n                                type: 'EXIT',\n                                quantity: -detail.quantity,\n                                reason: `Entrega ${delivery.code} - Kit ${requestKit.kit.code}`,\n                                reference: delivery.id,\n                                userId: req.user.id\n                            }\n                        });\n                        await tx.auditLog.create({\n                            data: {\n                                entity: 'KitInventoryMovement',\n                                entityId: kitInventory.id,\n                                action: 'EXIT',\n                                userId: req.user.id,\n                                oldValues: null,\n                                newValues: JSON.stringify({\n                                    kitId: detail.kitId,\n                                    kitCode: requestKit.kit.code,\n                                    kitName: requestKit.kit.name,\n                                    quantity: detail.quantity,\n                                    deliveryCode: delivery.code,\n                                    reference: delivery.id\n                                })\n                            }\n                        });\n                        for (const kp of requestKit.kit.kitProducts) {";
if (!s.includes(needle)) {
  if (s.includes('entity: \'KitInventoryMovement\'')) {
    console.log('Patch already applied');
    process.exit(0);
  }
  console.error('needle not found');
  process.exit(1);
}
fs.writeFileSync(p, s.replace(needle, insert));
console.log('Patch applied');
