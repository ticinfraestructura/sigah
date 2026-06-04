const fs = require('fs');

const tsSource = fs.readFileSync('backend/src/routes/kit.routes.ts', 'utf8');

let jsContent = tsSource
  .replace(/import \{([^}]+)\} from '([^']+)';/g, (match, imports, module) => {
    const importArray = imports.split(',').map(i => i.trim());
    const requireStatements = importArray.map(imp => `const ${imp} = require("${module}");`).join('\n');
    return requireStatements;
  })
  .replace(/import \* as ([^ ]+) from '([^']+)';/g, 'const $1 = require("$2");')
  .replace(/import ([^ ]+) from '([^']+)';/g, 'const $1 = require("$2");')
  .replace(/export default router;/, 'module.exports = router;')
  .replace(/: Request/g, '')
  .replace(/: Response/g, '')
  .replace(/: NextFunction/g, '')
  .replace(/: PrismaClient/g, '')
  .replace(/: AuthRequest/g, '')
  .replace(/async \(([^)]+)\)/g, 'async function($1)')
  .replace(/const router = Router\(\);/, '');

jsContent = `const express = require("express");
const { Router, Request, Response, NextFunction } = express;
const { PrismaClient } = require("@prisma/client");
const { AppError } = require("../middleware/error.middleware");
const { authenticate, authorize, AuthRequest } = require("../middleware/auth.middleware");
const { AuditService } = require("../services/audit.service");
const { InventoryService } = require("../services/inventory.service");
const { CodeGenerator } = require("../services/codeGenerator");
const { kitZodSchemas, validateZodRequest } = require("../middleware/validation.middleware");

const router = Router();

` + jsContent;

fs.writeFileSync('tmp_kit_routes.js', jsContent);
console.log('Archivo kit.routes.js generado desde fuente TypeScript');
