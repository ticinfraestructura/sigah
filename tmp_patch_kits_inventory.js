const fs = require('fs');
const routesPath = '/app/dist/routes/kit.routes.js';
const content = fs.readFileSync(routesPath, 'utf8');

const marker = "include: { category: true } } }";

if (!content.includes(marker)) {
  console.log('ERROR: No se encontró el marcador en kit.routes.js');
  process.exit(1);
}

const newInclude = "include: { category: true } },\n                inventory: true }";

const patched = content.replace(marker, newInclude);

fs.writeFileSync(routesPath, patched);
console.log('PATCH APLICADO: inventory agregado al include de kits');
