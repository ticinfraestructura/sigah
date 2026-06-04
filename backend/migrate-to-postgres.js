const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Cliente SQLite (actual)
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

// Cliente PostgreSQL (nuevo)
const pgClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/sigah'
    }
  }
});

async function migrateToPostgres() {
  try {
    console.log('🔄 Iniciando migración de SQLite a PostgreSQL...');

    // 1. Migrar Roles y Permisos
    console.log('📋 Creando roles y permisos...');
    
    // Crear rol de administrador
    const adminRole = await pgClient.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrador del sistema con acceso completo'
      }
    });

    // Crear permisos básicos
    const permissions = [
      { module: 'dashboard', action: 'view', description: 'Ver dashboard' },
      { module: 'inventory', action: 'view', description: 'Ver inventario' },
      { module: 'inventory', action: 'create', description: 'Crear productos' },
      { module: 'inventory', action: 'edit', description: 'Editar productos' },
      { module: 'inventory', action: 'delete', description: 'Eliminar productos' },
      { module: 'inventory', action: 'export', description: 'Exportar inventario' },
      { module: 'inventory', action: 'adjust', description: 'Ajustar stock' },
      { module: 'kits', action: 'view', description: 'Ver kits' },
      { module: 'kits', action: 'create', description: 'Crear kits' },
      { module: 'kits', action: 'edit', description: 'Editar kits' },
      { module: 'kits', action: 'delete', description: 'Eliminar kits' },
      { module: 'beneficiaries', action: 'view', description: 'Ver beneficiarios' },
      { module: 'beneficiaries', action: 'create', description: 'Crear beneficiarios' },
      { module: 'beneficiaries', action: 'edit', description: 'Editar beneficiarios' },
      { module: 'beneficiaries', action: 'delete', description: 'Eliminar beneficiarios' },
      { module: 'beneficiaries', action: 'export', description: 'Exportar beneficiarios' },
      { module: 'requests', action: 'view', description: 'Ver solicitudes' },
      { module: 'requests', action: 'create', description: 'Crear solicitudes' },
      { module: 'requests', action: 'edit', description: 'Editar solicitudes' },
      { module: 'requests', action: 'delete', description: 'Eliminar solicitudes' },
      { module: 'requests', action: 'approve', description: 'Aprobar solicitudes' },
      { module: 'requests', action: 'reject', description: 'Rechazar solicitudes' },
      { module: 'deliveries', action: 'view', description: 'Ver entregas' },
      { module: 'deliveries', action: 'create', description: 'Crear entregas' },
      { module: 'deliveries', action: 'authorize', description: 'Autorizar entregas' },
      { module: 'deliveries', action: 'prepare', description: 'Preparar entregas' },
      { module: 'deliveries', action: 'dispatch', description: 'Despachar entregas' },
      { module: 'reports', action: 'view', description: 'Ver reportes' },
      { module: 'reports', action: 'export', description: 'Exportar reportes' },
      { module: 'users', action: 'view', description: 'Ver usuarios' },
      { module: 'users', action: 'create', description: 'Crear usuarios' },
      { module: 'users', action: 'edit', description: 'Editar usuarios' },
      { module: 'users', action: 'delete', description: 'Eliminar usuarios' },
      { module: 'roles', action: 'view', description: 'Ver roles' },
      { module: 'roles', action: 'create', description: 'Crear roles' },
      { module: 'roles', action: 'edit', description: 'Editar roles' },
      { module: 'roles', action: 'delete', description: 'Eliminar roles' }
    ];

    const createdPermissions = await Promise.all(
      permissions.map(p => pgClient.permission.create({ data: p }))
    );

    // Asignar todos los permisos al rol de administrador
    await Promise.all(
      createdPermissions.map(p => 
        pgClient.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: p.id
          }
        })
      )
    );

    // 2. Migrar Categorías
    console.log('📂 Migrando categorías...');
    const sqliteCategories = await sqliteClient.category.findMany();
    const categoryMap = new Map();

    for (const cat of sqliteCategories) {
      const newCat = await pgClient.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          isActive: cat.isActive
        }
      });
      categoryMap.set(cat.id, newCat.id);
    }

    // 3. Migrar Productos
    console.log('📦 Migrando productos...');
    const sqliteProducts = await sqliteClient.product.findMany();
    const productMap = new Map();

    for (const prod of sqliteProducts) {
      const newProd = await pgClient.product.create({
        data: {
          code: prod.code,
          name: prod.name,
          description: prod.description,
          categoryId: categoryMap.get(prod.categoryId),
          unit: prod.unit,
          isPerishable: prod.isPerishable,
          minStock: prod.minStock,
          isActive: prod.isActive
        }
      });
      productMap.set(prod.id, newProd.id);
    }

    // 4. Migrar Lotes de Productos
    console.log('📋 Migrando lotes de productos...');
    const sqliteLots = await sqliteClient.productLot.findMany();
    const lotMap = new Map();

    for (const lot of sqliteLots) {
      const newLot = await pgClient.productLot.create({
        data: {
          productId: productMap.get(lot.productId),
          lotNumber: lot.lotNumber,
          quantity: lot.quantity,
          expiryDate: lot.expiryDate,
          isActive: lot.isActive
        }
      });
      lotMap.set(lot.id, newLot.id);
    }

    // 5. Migrar Usuarios
    console.log('👥 Migrando usuarios...');
    const sqliteUsers = await sqliteClient.user.findMany();
    const userMap = new Map();

    for (const user of sqliteUsers) {
      const newUser = await pgClient.user.create({
        data: {
          email: user.email,
          password: user.password, // Ya está hasheado
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: adminRole.id, // Todos los usuarios existentes serán administradores
          isActive: user.isActive
        }
      });
      userMap.set(user.id, newUser.id);
    }

    // 6. Migrar Beneficiarios
    console.log('👨‍👩‍👧‍👦 Migrando beneficiarios...');
    const sqliteBeneficiaries = await sqliteClient.beneficiary.findMany();
    const beneficiaryMap = new Map();

    for (const ben of sqliteBeneficiaries) {
      const newBen = await pgClient.beneficiary.create({
        data: {
          documentType: ben.documentType,
          documentNumber: ben.documentNumber,
          firstName: ben.firstName,
          lastName: ben.lastName,
          phone: ben.phone,
          email: ben.email,
          address: ben.address,
          city: ben.city,
          populationType: ben.populationType,
          familySize: ben.familySize,
          notes: ben.notes,
          isActive: ben.isActive
        }
      });
      beneficiaryMap.set(ben.id, newBen.id);
    }

    // 7. Migrar Kits
    console.log('📦 Migrando kits...');
    const sqliteKits = await sqliteClient.kit.findMany();
    const kitMap = new Map();

    for (const kit of sqliteKits) {
      const newKit = await pgClient.kit.create({
        data: {
          code: kit.code,
          name: kit.name,
          description: kit.description,
          isActive: kit.isActive
        }
      });
      kitMap.set(kit.id, newKit.id);
    }

    // 8. Migrar Productos de Kits
    console.log('🔗 Migrando productos de kits...');
    const sqliteKitProducts = await sqliteClient.kitProduct.findMany();

    for (const kp of sqliteKitProducts) {
      await pgClient.kitProduct.create({
        data: {
          kitId: kitMap.get(kp.kitId),
          productId: productMap.get(kp.productId),
          quantity: kp.quantity
        }
      });
    }

    // 9. Migrar Movimientos de Stock
    console.log('📊 Migrando movimientos de stock...');
    const sqliteMovements = await sqliteClient.stockMovement.findMany();

    for (const mov of sqliteMovements) {
      await pgClient.stockMovement.create({
        data: {
          productId: productMap.get(mov.productId),
          lotId: mov.lotId ? lotMap.get(mov.lotId) : null,
          type: mov.type,
          quantity: mov.quantity,
          reason: mov.reason,
          reference: mov.reference,
          userId: userMap.get(mov.userId)
        }
      });
    }

    // 10. Crear inventario inicial de kits
    console.log('📦 Creando inventario de kits...');
    for (const kitId of kitMap.values()) {
      await pgClient.kitInventory.create({
        data: {
          kitId: kitId,
          quantity: Math.floor(Math.random() * 20) + 5, // 5-25 kits
          kitBatchId: `BATCH-${Date.now()}`
        }
      });
    }

    console.log('✅ Migración completada exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   Categorías: ${categoryMap.size}`);
    console.log(`   Productos: ${productMap.size}`);
    console.log(`   Lotes: ${lotMap.size}`);
    console.log(`   Usuarios: ${userMap.size}`);
    console.log(`   Beneficiarios: ${beneficiaryMap.size}`);
    console.log(`   Kits: ${kitMap.size}`);
    console.log(`   Permisos: ${createdPermissions.length}`);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
    await pgClient.$disconnect();
  }
}

// Ejecutar migración
migrateToPostgres().catch(console.error);
