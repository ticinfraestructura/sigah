const fs = require('fs');
const routesPath = '/app/dist/routes/kit.routes.js';
const content = fs.readFileSync(routesPath, 'utf8');

const lines = content.split('\n');
let patched = false;
let result = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  result.push(line);
  
  if (line.includes('include: { category: true }') && !patched) {
    const nextLine = lines[i + 1] || '';
    if (nextLine.trim() === '}') {
      result.push('                inventory: true');
      patched = true;
    }
  }
}

if (!patched) {
  console.log('ERROR: No se pudo aplicar el parche');
  process.exit(1);
}

fs.writeFileSync(routesPath, result.join('\n'));
console.log('PATCH APLICADO: inventory agregado al include de kits');
