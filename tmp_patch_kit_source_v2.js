const fs = require('fs');
const sourcePath = '/tmp/kit.routes.ts';
const content = fs.readFileSync(sourcePath, 'utf8');

const marker = 'kitProducts: {\n          include: {\n            product: {\n              include: { category: true }\n            }\n          }\n        }';

if (!content.includes(marker)) {
  console.log('ERROR: No se encontró el marcador en kit.routes.ts');
  process.exit(1);
}

const newInclude = 'kitProducts: {\n          include: {\n            product: {\n              include: { category: true }\n            }\n          }\n        },\n        inventory: true';

const patched = content.replace(marker, newInclude);

fs.writeFileSync(sourcePath, patched);
console.log('PATCH APLICADO: inventory agregado al include de kits en fuente TypeScript');
