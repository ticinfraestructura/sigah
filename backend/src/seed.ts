import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Definición de permisos por módulo
const PERMISSIONS = [
  // Dashboard
  { module: 'dashboard', action: 'view', description: 'Ver dashboard' },
  
  // Inventario
  { module: 'inventory', action: 'view', description: 'Ver inventario' },
  { module: 'inventory', action: 'create', description: 'Crear productos' },
  { module: 'inventory', action: 'edit', description: 'Editar productos' },
  { module: 'inventory', action: 'delete', description: 'Eliminar productos' },
  { module: 'inventory', action: 'export', description: 'Exportar inventario' },
  { module: 'inventory', action: 'adjust', description: 'Ajustar stock' },
  
  // Kits
  { module: 'kits', action: 'view', description: 'Ver kits' },
  { module: 'kits', action: 'create', description: 'Crear kits' },
  { module: 'kits', action: 'edit', description: 'Editar kits' },
  { module: 'kits', action: 'delete', description: 'Eliminar kits' },
  
  // Beneficiarios
  { module: 'beneficiaries', action: 'view', description: 'Ver beneficiarios' },
  { module: 'beneficiaries', action: 'create', description: 'Crear beneficiarios' },
  { module: 'beneficiaries', action: 'edit', description: 'Editar beneficiarios' },
  { module: 'beneficiaries', action: 'delete', description: 'Eliminar beneficiarios' },
  { module: 'beneficiaries', action: 'export', description: 'Exportar beneficiarios' },
  
  // Solicitudes
  { module: 'requests', action: 'view', description: 'Ver solicitudes' },
  { module: 'requests', action: 'create', description: 'Crear solicitudes' },
  { module: 'requests', action: 'edit', description: 'Editar solicitudes' },
  { module: 'requests', action: 'delete', description: 'Eliminar solicitudes' },
  { module: 'requests', action: 'approve', description: 'Aprobar solicitudes' },
  { module: 'requests', action: 'reject', description: 'Rechazar solicitudes' },
  
  // Entregas
  { module: 'deliveries', action: 'view', description: 'Ver entregas' },
  { module: 'deliveries', action: 'create', description: 'Crear entregas' },
  { module: 'deliveries', action: 'authorize', description: 'Autorizar entregas' },
  { module: 'deliveries', action: 'receive', description: 'Recibir en bodega' },
  { module: 'deliveries', action: 'prepare', description: 'Preparar entregas' },
  { module: 'deliveries', action: 'deliver', description: 'Realizar entregas' },
  { module: 'deliveries', action: 'cancel', description: 'Cancelar entregas' },
  
  // Devoluciones
  { module: 'returns', action: 'view', description: 'Ver devoluciones' },
  { module: 'returns', action: 'create', description: 'Crear devoluciones' },
  { module: 'returns', action: 'process', description: 'Procesar devoluciones' },
  
  // Reportes
  { module: 'reports', action: 'view', description: 'Ver reportes' },
  { module: 'reports', action: 'export', description: 'Exportar reportes' },
  
  // Usuarios
  { module: 'users', action: 'view', description: 'Ver usuarios' },
  { module: 'users', action: 'create', description: 'Crear usuarios' },
  { module: 'users', action: 'edit', description: 'Editar usuarios' },
  { module: 'users', action: 'delete', description: 'Eliminar usuarios' },
  { module: 'users', action: 'activate', description: 'Activar/desactivar usuarios' },
  
  // Roles
  { module: 'roles', action: 'view', description: 'Ver roles' },
  { module: 'roles', action: 'create', description: 'Crear roles' },
  { module: 'roles', action: 'edit', description: 'Editar roles' },
  { module: 'roles', action: 'delete', description: 'Eliminar roles' },
  { module: 'roles', action: 'assign', description: 'Asignar roles' },
  
  // Configuración
  { module: 'settings', action: 'view', description: 'Ver configuración' },
  { module: 'settings', action: 'edit', description: 'Editar configuración' }
];

// Definición de roles del sistema con sus permisos
const SYSTEM_ROLES = {
  Administrador: {
    description: 'Acceso total al sistema',
    isSystem: true,
    permissions: PERMISSIONS.map(p => ({ module: p.module, action: p.action }))
  },
  Autorizador: {
    description: 'Autoriza entregas y aprueba solicitudes',
    isSystem: true,
    permissions: [
      { module: 'dashboard', action: 'view' },
      { module: 'requests', action: 'view' },
      { module: 'requests', action: 'approve' },
      { module: 'requests', action: 'reject' },
      { module: 'deliveries', action: 'view' },
      { module: 'deliveries', action: 'authorize' },
      { module: 'beneficiaries', action: 'view' },
      { module: 'reports', action: 'view' }
    ]
  },
  Bodega: {
    description: 'Gestiona inventario y prepara entregas',
    isSystem: true,
    permissions: [
      { module: 'dashboard', action: 'view' },
      { module: 'inventory', action: 'view' },
      { module: 'inventory', action: 'create' },
      { module: 'inventory', action: 'edit' },
      { module: 'inventory', action: 'adjust' },
      { module: 'kits', action: 'view' },
      { module: 'deliveries', action: 'view' },
      { module: 'deliveries', action: 'receive' },
      { module: 'deliveries', action: 'prepare' },
      { module: 'returns', action: 'view' },
      { module: 'returns', action: 'create' },
      { module: 'returns', action: 'process' },
      { module: 'reports', action: 'view' }
    ]
  },
  Despachador: {
    description: 'Realiza entregas a beneficiarios',
    isSystem: true,
    permissions: [
      { module: 'dashboard', action: 'view' },
      { module: 'deliveries', action: 'view' },
      { module: 'deliveries', action: 'deliver' },
      { module: 'beneficiaries', action: 'view' },
      { module: 'reports', action: 'view' }
    ]
  },
  Consulta: {
    description: 'Solo lectura de información',
    isSystem: true,
    permissions: [
      { module: 'dashboard', action: 'view' },
      { module: 'inventory', action: 'view' },
      { module: 'kits', action: 'view' },
      { module: 'beneficiaries', action: 'view' },
      { module: 'requests', action: 'view' },
      { module: 'deliveries', action: 'view' },
      { module: 'returns', action: 'view' },
      { module: 'reports', action: 'view' }
    ]
  },
  Operador: {
    description: 'Crea solicitudes y gestiona beneficiarios',
    isSystem: true,
    permissions: [
      { module: 'dashboard', action: 'view' },
      { module: 'beneficiaries', action: 'view' },
      { module: 'beneficiaries', action: 'create' },
      { module: 'beneficiaries', action: 'edit' },
      { module: 'requests', action: 'view' },
      { module: 'requests', action: 'create' },
      { module: 'requests', action: 'edit' },
      { module: 'deliveries', action: 'view' },
      { module: 'deliveries', action: 'create' },
      { module: 'kits', action: 'view' },
      { module: 'reports', action: 'view' }
    ]
  }
};

async function main() {
  console.log('🌱 Seeding database...');

  // ============ CREAR PERMISOS ============
  console.log('📋 Creating permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: { description: perm.description },
      create: perm
    });
  }
  console.log(`✅ ${PERMISSIONS.length} permissions created`);

  // ============ CREAR ROLES ============
  console.log('👥 Creating roles...');
  const roleMap: Record<string, string> = {};
  
  for (const [roleName, roleData] of Object.entries(SYSTEM_ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: roleData.description },
      create: {
        name: roleName,
        description: roleData.description,
        isSystem: roleData.isSystem
      }
    });
    roleMap[roleName] = role.id;

    // Eliminar permisos existentes del rol
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    // Asignar permisos al rol
    for (const perm of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { module_action: { module: perm.module, action: perm.action } }
      });
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      }
    }
  }
  console.log(`✅ ${Object.keys(SYSTEM_ROLES).length} roles created with permissions`);

  // ============ CREAR USUARIOS ============
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sigah.com' },
    update: { roleId: roleMap['Administrador'] },
    create: {
      email: 'admin@sigah.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      roleId: roleMap['Administrador']
    }
  });

  await prisma.user.upsert({
    where: { email: 'autorizador@sigah.com' },
    update: { roleId: roleMap['Autorizador'] },
    create: {
      email: 'autorizador@sigah.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Autorizador',
      roleId: roleMap['Autorizador']
    }
  });

  const warehouse = await prisma.user.upsert({
    where: { email: 'bodega@sigah.com' },
    update: { roleId: roleMap['Bodega'] },
    create: {
      email: 'bodega@sigah.com',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Bodega',
      roleId: roleMap['Bodega']
    }
  });

  await prisma.user.upsert({
    where: { email: 'despachador@sigah.com' },
    update: { roleId: roleMap['Despachador'] },
    create: {
      email: 'despachador@sigah.com',
      password: hashedPassword,
      firstName: 'Pedro',
      lastName: 'Despachador',
      roleId: roleMap['Despachador']
    }
  });

  await prisma.user.upsert({
    where: { email: 'operador@sigah.com' },
    update: { roleId: roleMap['Operador'] },
    create: {
      email: 'operador@sigah.com',
      password: hashedPassword,
      firstName: 'Ana',
      lastName: 'Operadora',
      roleId: roleMap['Operador']
    }
  });

  await prisma.user.upsert({
    where: { email: 'consulta@sigah.com' },
    update: { roleId: roleMap['Consulta'] },
    create: {
      email: 'consulta@sigah.com',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'Consulta',
      roleId: roleMap['Consulta']
    }
  });

  console.log('✅ Users created with roles assigned');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Alimentos' },
      update: {},
      create: { name: 'Alimentos', description: 'Productos alimenticios no perecederos y perecederos' }
    }),
    prisma.category.upsert({
      where: { name: 'Aseo Personal' },
      update: {},
      create: { name: 'Aseo Personal', description: 'Productos de higiene y aseo personal' }
    }),
    prisma.category.upsert({
      where: { name: 'Aseo Hogar' },
      update: {},
      create: { name: 'Aseo Hogar', description: 'Productos de limpieza del hogar' }
    }),
    prisma.category.upsert({
      where: { name: 'Ropa' },
      update: {},
      create: { name: 'Ropa', description: 'Prendas de vestir y calzado' }
    }),
    prisma.category.upsert({
      where: { name: 'Medicamentos' },
      update: {},
      create: { name: 'Medicamentos', description: 'Medicamentos básicos y de venta libre' }
    }),
    prisma.category.upsert({
      where: { name: 'Emergencia' },
      update: {},
      create: { name: 'Emergencia', description: 'Artículos de emergencia y supervivencia' }
    })
  ]);

  console.log('✅ Categories created');

  // Create products
  const products = await Promise.all([
    // Alimentos
    prisma.product.upsert({
      where: { code: 'ALI-001' },
      update: {},
      create: {
        code: 'ALI-001',
        name: 'Arroz 1kg',
        description: 'Arroz blanco de primera calidad',
        categoryId: categories[0].id,
        unit: 'KG',
        isPerishable: false,
        minStock: 100
      }
    }),
    prisma.product.upsert({
      where: { code: 'ALI-002' },
      update: {},
      create: {
        code: 'ALI-002',
        name: 'Frijoles 500g',
        description: 'Frijoles rojos secos',
        categoryId: categories[0].id,
        unit: 'PACK',
        isPerishable: false,
        minStock: 80
      }
    }),
    prisma.product.upsert({
      where: { code: 'ALI-003' },
      update: {},
      create: {
        code: 'ALI-003',
        name: 'Aceite 1L',
        description: 'Aceite vegetal para cocinar',
        categoryId: categories[0].id,
        unit: 'LITER',
        isPerishable: true,
        minStock: 50
      }
    }),
    prisma.product.upsert({
      where: { code: 'ALI-004' },
      update: {},
      create: {
        code: 'ALI-004',
        name: 'Leche en polvo 400g',
        description: 'Leche en polvo entera',
        categoryId: categories[0].id,
        unit: 'PACK',
        isPerishable: true,
        minStock: 60
      }
    }),
    prisma.product.upsert({
      where: { code: 'ALI-005' },
      update: {},
      create: {
        code: 'ALI-005',
        name: 'Atún en lata 170g',
        description: 'Atún en aceite enlatado',
        categoryId: categories[0].id,
        unit: 'UNIT',
        isPerishable: true,
        minStock: 100
      }
    }),
    // Aseo Personal
    prisma.product.upsert({
      where: { code: 'ASE-001' },
      update: {},
      create: {
        code: 'ASE-001',
        name: 'Jabón de baño',
        description: 'Jabón antibacterial de 120g',
        categoryId: categories[1].id,
        unit: 'UNIT',
        isPerishable: false,
        minStock: 100
      }
    }),
    prisma.product.upsert({
      where: { code: 'ASE-002' },
      update: {},
      create: {
        code: 'ASE-002',
        name: 'Pasta dental',
        description: 'Crema dental con flúor 100ml',
        categoryId: categories[1].id,
        unit: 'UNIT',
        isPerishable: false,
        minStock: 80
      }
    }),
    prisma.product.upsert({
      where: { code: 'ASE-003' },
      update: {},
      create: {
        code: 'ASE-003',
        name: 'Cepillo dental',
        description: 'Cepillo de dientes adulto',
        categoryId: categories[1].id,
        unit: 'UNIT',
        isPerishable: false,
        minStock: 80
      }
    }),
    prisma.product.upsert({
      where: { code: 'ASE-004' },
      update: {},
      create: {
        code: 'ASE-004',
        name: 'Toallas sanitarias',
        description: 'Paquete de 10 unidades',
        categoryId: categories[1].id,
        unit: 'PACK',
        isPerishable: false,
        minStock: 50
      }
    }),
    // Aseo Hogar
    prisma.product.upsert({
      where: { code: 'HOG-001' },
      update: {},
      create: {
        code: 'HOG-001',
        name: 'Detergente 1kg',
        description: 'Detergente en polvo para ropa',
        categoryId: categories[2].id,
        unit: 'KG',
        isPerishable: false,
        minStock: 40
      }
    }),
    prisma.product.upsert({
      where: { code: 'HOG-002' },
      update: {},
      create: {
        code: 'HOG-002',
        name: 'Jabón en barra',
        description: 'Jabón para lavar ropa',
        categoryId: categories[2].id,
        unit: 'UNIT',
        isPerishable: false,
        minStock: 60
      }
    }),
    // Emergencia
    prisma.product.upsert({
      where: { code: 'EME-001' },
      update: {},
      create: {
        code: 'EME-001',
        name: 'Manta térmica',
        description: 'Manta de emergencia reflectante',
        categoryId: categories[5].id,
        unit: 'UNIT',
        isPerishable: false,
        minStock: 30
      }
    }),
    prisma.product.upsert({
      where: { code: 'EME-002' },
      update: {},
      create: {
        code: 'EME-002',
        name: 'Linterna',
        description: 'Linterna LED con pilas',
        categoryId: categories[5].id,
        unit: 'UNIT',
        isPerishable: false,
        minStock: 20
      }
    }),
    prisma.product.upsert({
      where: { code: 'EME-003' },
      update: {},
      create: {
        code: 'EME-003',
        name: 'Botiquín básico',
        description: 'Kit de primeros auxilios',
        categoryId: categories[5].id,
        unit: 'UNIT',
        isPerishable: true,
        minStock: 15
      }
    })
  ]);

  console.log('✅ Products created');

  // Add inventory lots
  for (const product of products) {
    const baseQuantity = Math.floor(Math.random() * 100) + 50;
    
    await prisma.productLot.create({
      data: {
        productId: product.id,
        lotNumber: `LOT-${product.code}-001`,
        quantity: baseQuantity,
        expiryDate: product.isPerishable 
          ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000)
          : null
      }
    });

    // Add second lot for some products
    if (product.isPerishable) {
      await prisma.productLot.create({
        data: {
          productId: product.id,
          lotNumber: `LOT-${product.code}-002`,
          quantity: Math.floor(baseQuantity / 2),
          expiryDate: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // Record entry movement
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: 'ENTRY',
        quantity: baseQuantity,
        reason: 'Inventario inicial',
        userId: admin.id
      }
    });
  }

  console.log('✅ Inventory lots created');

  // Create kits
  const kitAlimentario = await prisma.kit.upsert({
    where: { code: 'KIT-ALI' },
    update: {},
    create: {
      code: 'KIT-ALI',
      name: 'Kit Alimentario Familiar',
      description: 'Kit de alimentos básicos para una familia de 4 personas por 15 días'
    }
  });

  await Promise.all([
    prisma.kitProduct.create({ data: { kitId: kitAlimentario.id, productId: products[0].id, quantity: 3 } }),
    prisma.kitProduct.create({ data: { kitId: kitAlimentario.id, productId: products[1].id, quantity: 2 } }),
    prisma.kitProduct.create({ data: { kitId: kitAlimentario.id, productId: products[2].id, quantity: 1 } }),
    prisma.kitProduct.create({ data: { kitId: kitAlimentario.id, productId: products[3].id, quantity: 2 } }),
    prisma.kitProduct.create({ data: { kitId: kitAlimentario.id, productId: products[4].id, quantity: 4 } })
  ]);

  const kitAseo = await prisma.kit.upsert({
    where: { code: 'KIT-ASE' },
    update: {},
    create: {
      code: 'KIT-ASE',
      name: 'Kit de Aseo Personal',
      description: 'Kit de higiene personal básico'
    }
  });

  await Promise.all([
    prisma.kitProduct.create({ data: { kitId: kitAseo.id, productId: products[5].id, quantity: 3 } }),
    prisma.kitProduct.create({ data: { kitId: kitAseo.id, productId: products[6].id, quantity: 2 } }),
    prisma.kitProduct.create({ data: { kitId: kitAseo.id, productId: products[7].id, quantity: 4 } }),
    prisma.kitProduct.create({ data: { kitId: kitAseo.id, productId: products[8].id, quantity: 2 } })
  ]);

  const kitEmergencia = await prisma.kit.upsert({
    where: { code: 'KIT-EME' },
    update: {},
    create: {
      code: 'KIT-EME',
      name: 'Kit de Emergencia',
      description: 'Kit básico de supervivencia y emergencia'
    }
  });

  await Promise.all([
    prisma.kitProduct.create({ data: { kitId: kitEmergencia.id, productId: products[11].id, quantity: 2 } }),
    prisma.kitProduct.create({ data: { kitId: kitEmergencia.id, productId: products[12].id, quantity: 1 } }),
    prisma.kitProduct.create({ data: { kitId: kitEmergencia.id, productId: products[13].id, quantity: 1 } })
  ]);

  console.log('✅ Kits created');

  // Create beneficiaries
  const beneficiaries = await Promise.all([
    prisma.beneficiary.upsert({
      where: { documentType_documentNumber: { documentType: 'CC', documentNumber: '1234567890' } },
      update: {},
      create: {
        documentType: 'CC',
        documentNumber: '1234567890',
        firstName: 'Carlos',
        lastName: 'García Pérez',
        phone: '3001234567',
        address: 'Calle 10 #20-30',
        city: 'Bogotá',
        populationType: 'DISPLACED',
        familySize: 4
      }
    }),
    prisma.beneficiary.upsert({
      where: { documentType_documentNumber: { documentType: 'CC', documentNumber: '0987654321' } },
      update: {},
      create: {
        documentType: 'CC',
        documentNumber: '0987654321',
        firstName: 'María',
        lastName: 'López Rodríguez',
        phone: '3109876543',
        address: 'Carrera 5 #15-20',
        city: 'Medellín',
        populationType: 'VULNERABLE',
        familySize: 3
      }
    }),
    prisma.beneficiary.upsert({
      where: { documentType_documentNumber: { documentType: 'TI', documentNumber: '1122334455' } },
      update: {},
      create: {
        documentType: 'TI',
        documentNumber: '1122334455',
        firstName: 'Ana',
        lastName: 'Martínez Silva',
        phone: '3205551234',
        address: 'Avenida 8 #12-45',
        city: 'Cali',
        populationType: 'REFUGEE',
        familySize: 5
      }
    }),
    prisma.beneficiary.upsert({
      where: { documentType_documentNumber: { documentType: 'CC', documentNumber: '5566778899' } },
      update: {},
      create: {
        documentType: 'CC',
        documentNumber: '5566778899',
        firstName: 'Pedro',
        lastName: 'Sánchez Gómez',
        phone: '3151112233',
        address: 'Calle 25 #10-15',
        city: 'Barranquilla',
        populationType: 'ELDERLY',
        familySize: 2
      }
    })
  ]);

  console.log('✅ Beneficiaries created');

  // Create sample requests
  const request1 = await prisma.request.create({
    data: {
      code: 'SOL-2024-000001',
      beneficiaryId: beneficiaries[0].id,
      status: 'DELIVERED',
      priority: 1,
      notes: 'Familia desplazada recién llegada',
      createdById: admin.id,
      requestKits: {
        create: [
          { kitId: kitAlimentario.id, quantityRequested: 1, quantityDelivered: 1 },
          { kitId: kitAseo.id, quantityRequested: 1, quantityDelivered: 1 }
        ]
      },
      histories: {
        create: [
          { toStatus: 'REGISTERED', userId: admin.id, notes: 'Solicitud creada' },
          { fromStatus: 'REGISTERED', toStatus: 'APPROVED', userId: admin.id, notes: 'Aprobada por urgencia' },
          { fromStatus: 'APPROVED', toStatus: 'DELIVERED', userId: warehouse.id, notes: 'Entrega completada' }
        ]
      }
    }
  });

  const request2 = await prisma.request.create({
    data: {
      code: 'SOL-2024-000002',
      beneficiaryId: beneficiaries[1].id,
      status: 'APPROVED',
      priority: 0,
      createdById: warehouse.id,
      requestKits: {
        create: [
          { kitId: kitAlimentario.id, quantityRequested: 1, quantityDelivered: 0 }
        ]
      },
      requestProducts: {
        create: [
          { productId: products[5].id, quantityRequested: 5, quantityDelivered: 0 }
        ]
      },
      histories: {
        create: [
          { toStatus: 'REGISTERED', userId: warehouse.id, notes: 'Solicitud creada' },
          { fromStatus: 'REGISTERED', toStatus: 'IN_REVIEW', userId: admin.id },
          { fromStatus: 'IN_REVIEW', toStatus: 'APPROVED', userId: admin.id }
        ]
      }
    }
  });

  const request3 = await prisma.request.create({
    data: {
      code: 'SOL-2024-000003',
      beneficiaryId: beneficiaries[2].id,
      status: 'IN_REVIEW',
      priority: 2,
      notes: 'Familia refugiada con niños',
      createdById: warehouse.id,
      requestKits: {
        create: [
          { kitId: kitAlimentario.id, quantityRequested: 2, quantityDelivered: 0 },
          { kitId: kitEmergencia.id, quantityRequested: 1, quantityDelivered: 0 }
        ]
      },
      histories: {
        create: [
          { toStatus: 'REGISTERED', userId: warehouse.id, notes: 'Solicitud creada' },
          { fromStatus: 'REGISTERED', toStatus: 'IN_REVIEW', userId: admin.id }
        ]
      }
    }
  });

  const request4 = await prisma.request.create({
    data: {
      code: 'SOL-2024-000004',
      beneficiaryId: beneficiaries[3].id,
      status: 'REGISTERED',
      priority: 0,
      createdById: warehouse.id,
      requestProducts: {
        create: [
          { productId: products[0].id, quantityRequested: 2, quantityDelivered: 0 },
          { productId: products[2].id, quantityRequested: 1, quantityDelivered: 0 }
        ]
      },
      histories: {
        create: [
          { toStatus: 'REGISTERED', userId: warehouse.id, notes: 'Solicitud creada' }
        ]
      }
    }
  });

  console.log('✅ Requests created');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Test accounts:');
  console.log('   Admin: admin@sigah.com / admin123');
  console.log('   Bodega: bodega@sigah.com / admin123');
  console.log('   Consulta: consulta@sigah.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
