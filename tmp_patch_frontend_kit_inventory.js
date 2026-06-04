const fs = require('fs');
const path = '/usr/share/nginx/html/assets';
const files = fs.readdirSync(path);

for (const file of files) {
  if (file.endsWith('.js')) {
    const filePath = `${path}/${file}`;
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('inventory?.quantity')) {
      const patched = content.replace(/inventory\?\.quantity/g, 'inventory?.[0]?.quantity');
      fs.writeFileSync(filePath, patched);
      console.log(`Parcheado: ${file}`);
    }
  }
}
console.log('Parche completado');
