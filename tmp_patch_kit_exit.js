const fs = require('fs');
const path = require('path');

const routesPath = '/app/dist/routes/inventory.routes.js';
const content = fs.readFileSync(routesPath, 'utf8');

const marker = "router.post('/kit-entry', auth_middleware_1.authenticate";

if (!content.includes(marker)) {
  console.log('ERROR: No se encontró el marcador /kit-entry');
  process.exit(1);
}

const newRoute = `
router.post('/kit-exit', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN', 'WAREHOUSE'), async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { kitId, quantity, reason, reference } = req.body;
    const exitQuantity = Number(quantity);

    if (!kitId || !Number.isInteger(exitQuantity) || exitQuantity <= 0) {
      throw new AppError('Debe seleccionar un kit y una cantidad válida', 400);
    }

    const kit = await prisma.kit.findUnique({
      where: { id: kitId },
      include: {
        kitProducts: { include: { product: true } },
        inventory: true
      }
    });

    if (!kit || !kit.isActive) {
      throw new AppError('Kit no encontrado o inactivo', 404);
    }

    if (!kit.kitProducts.length) {
      throw new AppError('El kit no tiene productos asociados', 400);
    }

    const availableKits = kit.inventory?.quantity || 0;
    if (availableKits < exitQuantity) {
      throw new AppError('Stock insuficiente del kit. Disponibles: ' + availableKits, 400);
    }

    const exitReference = reference || 'KIT_EXIT:' + kit.code + ':' + Date.now();
    const exitReason = reason
      ? 'Egreso kit ' + kit.code + ' x' + exitQuantity + ' - ' + reason
      : 'Egreso kit ' + kit.code + ' x' + exitQuantity;

    await prisma.$transaction(async (tx) => {
      const kitInventory = await tx.kitInventory.update({
        where: { kitId: kit.id },
        data: { quantity: { decrement: exitQuantity } }
      });

      await tx.kitInventoryMovement.create({
        data: {
          kitInventoryId: kitInventory.id,
          type: 'EXIT',
          quantity: -exitQuantity,
          reason: exitReason,
          reference: exitReference,
          userId: req.user.id
        }
      });

      for (const kitProduct of kit.kitProducts) {
        await tx.stockMovement.create({
          data: {
            productId: kitProduct.product.id,
            type: 'EXIT',
            quantity: -(kitProduct.quantity * exitQuantity),
            reason: exitReason,
            reference: exitReference,
            userId: req.user.id
          }
        });
      }
    });

    await logAuditAction(
      'KitInventoryMovement',
      kit.id,
      'EXIT',
      req.user.id,
      null,
      {
        kitId: kit.id,
        kitCode: kit.code,
        kitName: kit.name,
        quantity: exitQuantity,
        reason: exitReason,
        reference: exitReference,
        exitedBy: req.user.firstName + ' ' + req.user.lastName
      }
    );

    res.json({
      success: true,
      data: {
        kit,
        quantity: exitQuantity,
        reason: exitReason,
        reference: exitReference,
        message: 'Egreso de kit registrado correctamente'
      }
    });
  } catch (error) {
    next(error);
  }
});
`;

const insertionPoint = content.indexOf(marker);
const closingIndex = content.indexOf('});', insertionPoint);
const afterKitEntry = content.substring(0, closingIndex + 3) + newRoute + content.substring(closingIndex + 3);

fs.writeFileSync(routesPath, afterKitEntry);
console.log('PATCH APLICADO: endpoint /kit-exit agregado a inventory.routes.js');
