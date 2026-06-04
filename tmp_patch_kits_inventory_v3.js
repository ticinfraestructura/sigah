const fs = require('fs');
const routesPath = '/app/dist/routes/kit.routes.js';
const content = fs.readFileSync(routesPath, 'utf8');

const lines = content.split('\n');
let result = [];
let inKitProductsInclude = false;
let depth = 0;
let patched = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  result.push(line);
  
  if (line.includes('kitProducts: {')) {
    inKitProductsInclude = true;
    depth = 1;
  } else if (inKitProductsInclude) {
    if (line.includes('{')) depth++;
    if (line.includes('}')) depth--;
    
    if (depth === 0 && !patched) {
      result.push('                inventory: true');
      patched = true;
      inKitProductsInclude = false;
    }
  }
}

if (!patched) {
  console.log('ERROR: No se pudo aplicar el parche');
  process.exit(1);
}

fs.writeFileSync(routesPath, result.join('\n'));
console.log('PATCH APLICADO: inventory agregado al include de kits');
