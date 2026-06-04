const fs = require('fs');
const sourcePath = '/tmp/kit.routes.ts';
const destPath = '/app/dist/routes/kit.routes.js';

const source = fs.readFileSync(sourcePath, 'utf8');

let js = source
  .replace(/import.*from.*;/g, '')
  .replace(/export default router;/, 'module.exports = router;')
  .replace(/: /g, ': ')
  .replace(/async \(([^)]+)\)/g, 'async function($1)')
  .replace(/const router = Router\(\);/, 'const express = require("express"); const router = express.Router();');

fs.writeFileSync(destPath, js);
console.log('Archivo kit.routes.js restaurado desde fuente TypeScript');
