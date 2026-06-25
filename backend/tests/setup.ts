import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar .env.test si existe, sino continuar sin error
config({ path: resolve(process.cwd(), '.env.test') });
