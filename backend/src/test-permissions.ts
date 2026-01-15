/**
 * Script para probar el sistema de permisos
 * Ejecutar con: npx tsx src/test-permissions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPermissions() {
  console.log('🔍 Verificando sistema de permisos...\n');

  // 1. Verificar tablas de permisos
  const permissionCount = await prisma.permission.count();
  const roleCount = await prisma.role.count();
  const userCount = await prisma.user.count();
  const rolePermissionCount = await prisma.rolePermission.count();

  console.log('📊 Estado de las tablas:');
  console.log(`   - Permisos: ${permissionCount}`);
  console.log(`   - Roles: ${roleCount}`);
  console.log(`   - Usuarios: ${userCount}`);
  console.log(`   - Asignaciones rol-permiso: ${rolePermissionCount}`);
  console.log('');

  // 2. Verificar si hay roles del sistema
  const adminRole = await prisma.role.findFirst({ where: { name: 'Administrador' } });
  console.log(`✅ Rol Administrador: ${adminRole ? 'Existe' : '❌ NO EXISTE'}`);

  // 3. Verificar usuarios con roles
  const usersWithRoles = await prisma.user.findMany({
    include: { role: true }
  });

  console.log('\n👥 Usuarios y sus roles:');
  for (const user of usersWithRoles) {
    console.log(`   - ${user.email}: ${user.role?.name || '❌ SIN ROL'}`);
  }

  // 4. Verificar permisos por rol
  console.log('\n🔐 Permisos por rol:');
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  for (const role of roles) {
    console.log(`\n   📋 ${role.name} (${role.permissions.length} permisos):`);
    const modules = [...new Set(role.permissions.map(rp => rp.permission.module))];
    for (const module of modules) {
      const actions = role.permissions
        .filter(rp => rp.permission.module === module)
        .map(rp => rp.permission.action);
      console.log(`      - ${module}: ${actions.join(', ')}`);
    }
  }

  // 5. Verificar integridad
  console.log('\n\n🔍 Verificación de integridad:');
  
  // Usuarios sin rol
  const usersWithoutRole = await prisma.user.count({ where: { roleId: null } });
  console.log(`   - Usuarios sin rol: ${usersWithoutRole} ${usersWithoutRole > 0 ? '⚠️' : '✅'}`);

  // Roles sin permisos
  const rolesWithoutPermissions = await prisma.role.findMany({
    where: {
      permissions: { none: {} }
    }
  });
  console.log(`   - Roles sin permisos: ${rolesWithoutPermissions.length} ${rolesWithoutPermissions.length > 0 ? '⚠️' : '✅'}`);
  if (rolesWithoutPermissions.length > 0) {
    rolesWithoutPermissions.forEach(r => console.log(`      - ${r.name}`));
  }

  // 6. Resumen
  console.log('\n\n📝 RESUMEN:');
  if (permissionCount === 0 || roleCount === 0) {
    console.log('   ❌ Sistema NO inicializado. Ejecute: npx tsx src/seed.ts');
  } else if (!adminRole) {
    console.log('   ⚠️ Falta el rol Administrador. Ejecute el seed nuevamente.');
  } else if (usersWithoutRole > 0) {
    console.log('   ⚠️ Hay usuarios sin rol asignado. Asigne roles desde la administración.');
  } else {
    console.log('   ✅ Sistema de permisos configurado correctamente.');
  }
}

testPermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
