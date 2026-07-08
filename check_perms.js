const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  const perms = await prisma.permission.findMany();
  const rolePerms = await prisma.rolePermission.findMany({
    include: { role: true, permission: true }
  });

  console.log('ROLES:', roles.map(r => ({ id: r.id, name: r.name })));
  console.log('PERMISSIONS COUNT:', perms.length);
  console.log('ROLE_PERMISSIONS COUNT:', rolePerms.length);
  console.log('ADMIN PERMS:', rolePerms
    .filter(rp => rp.role.name === 'ADMIN')
    .map(rp => rp.permission.module + ':' + rp.permission.action)
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
