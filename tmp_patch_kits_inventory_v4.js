const fs = require('fs');
const routesPath = '/app/dist/routes/kit.routes.js';
const content = fs.readFileSync(routesPath, 'utf8');

const lines = content.split('\n');
let result = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  result.push(line);
  
  if (line.includes('kitProducts: {')) {
    let depth = 1;
    i++;
    while (i < lines.length && depth > 0) {
      const currentLine = lines[i];
      result.push(currentLine);
      if (currentLine.includes('{')) depth++;
      if (currentLine.includes('}')) depth--;
      i++;
    }
    if (depth === 0) {
      result.push('                inventory: true');
    }
  } else {
    i++;
  }
}

fs.writeFileSync(routesPath, result.join('\n'));
console.log('PATCH APLICADO: inventory agregado al include de kits');
