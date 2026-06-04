# Contributing to SIGAH

¡Gracias por tu interés en contribuir a SIGAH! Este documento contiene las pautas y procesos para contribuir al proyecto.

## Índice
1. [Código de Conducta](#código-de-conducta)
2. [Cómo Contribuir](#cómo-contribuir)
3. [Proceso de Desarrollo](#proceso-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Testing](#testing)
6. [Documentación](#documentación)
7. [Pull Requests](#pull-requests)
8. [Lanzamientos](#lanzamientos)

---

## Código de Conducta

### Nuestra Promesa
Nos comprometemos a proporcionar un ambiente acogedor e inclusivo para todas las personas, sin importar su nivel de experiencia, género, identidad y expresión de género, orientación sexual, discapacidad, apariencia personal, tamaño corporal, raza, etnia, edad, religión o nacionalidad.

### Estándares
- Usar lenguaje amable e inclusivo
- Respetar diferentes puntos de vista y experiencias
- Aceptar críticas constructivas
- Enfocarse en lo que es mejor para la comunidad
- Mostrar empatía hacia otros miembros de la comunidad

### Comportamiento Inaceptable
- Lenguaje sexualizado o imágenes en cualquier contexto
- Comentarios acosadores, despectivos o discriminatorios
- Ataques personales, políticos o de otro tipo
- Publicación de información privada de otros
- Cualquier otra conducta inapropiada en un entorno profesional

---

## Cómo Contribuir

### Reportar Bugs
Si encuentras un bug, por favor:
1. Verificar si ya fue reportado en [Issues](https://github.com/your-org/sigah/issues)
2. Si no, crear un nuevo issue con:
   - Título descriptivo
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Entorno (SO, navegador, versión)
   - Capturas de pantalla si aplica

### Sugerir Features
1. Abrir un issue con etiqueta `enhancement`
2. Describir la funcionalidad propuesta
3. Explicar el problema que resuelve
4. Incluir ejemplos de uso si es posible

### Contribuciones de Código
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Crea un Pull Request

---

## Proceso de Desarrollo

### Flujo de Trabajo
1. **Planificación**: Las features se planean en milestones
2. **Desarrollo**: Trabaja en tu rama feature
3. **Testing**: Asegura que todos los tests pasen
4. **Review**: Solicita code review
5. **Merge**: Merge a develop después de aprobación
6. **Release**: Deploy desde develop a main para releases

### Ramas
- `main`: Código de producción
- `develop`: Desarrollo integrado
- `feature/*`: Features en desarrollo
- `bugfix/*`: Correcciones de bugs
- `hotfix/*`: Fixes críticos para producción

### Commits
Usa [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

Tipos:
- `feat`: Nueva feature
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, sin cambios lógicos
- `refactor`: Refactorización
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

Ejemplos:
```
feat(auth): add JWT refresh token support
fix(inventory): resolve stock concurrency issue
docs(api): update authentication endpoints
```

---

## Estándares de Código

### General
- **Indentación**: 2 espacios
- **Quotes**: Single quotes en JavaScript, double quotes en HTML
- **Semicolones**: Usar siempre
- **Line Length**: Máximo 100 caracteres
- **Naming**: camelCase para variables/funciones, PascalCase para clases

### TypeScript
```typescript
// Interfaces
interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Funciones
async function createUser(userData: CreateUserDto): Promise<User> {
  // implementation
}

// Enums
enum UserRole {
  ADMIN = 'ADMIN',
  WAREHOUSE = 'WAREHOUSE',
  DISPATCHER = 'DISPATCHER'
}
```

### React
```typescript
// Componentes funcionales
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

export default function ProductForm({ title, onSubmit }: Props) {
  const [formData, setFormData] = useState<FormData>(initialState);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* JSX */}
    </form>
  );
}

// Hooks personalizados
function useInventory(productId: string) {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  
  // implementation
  
  return { inventory, loading, error };
}
```

### CSS/Tailwind
```css
/* Utilizar clases de Tailwind siempre que sea posible */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700;
}

/* CSS personalizado solo para casos especiales */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
```

### Backend (Node.js/Express)
```typescript
// Controladores
export class ProductController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await this.productService.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
}

// Servicios
export class ProductService {
  async create(data: CreateProductDto): Promise<Product> {
    // validation
    // business logic
    // persistence
  }
}

// Middleware
export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
  const { error } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
```

### Base de Datos (Prisma)
```prisma
model Product {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("products")
}
```

---

## Testing

### Tipos de Tests
- **Unit Tests**: Lógica aislada
- **Integration Tests**: Interacción entre componentes
- **E2E Tests**: Flujos completos de usuario
- **API Tests**: Endpoints del backend

### Frontend (Jest + React Testing Library)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ProductForm from './ProductForm';

describe('ProductForm', () => {
  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    
    render(<ProductForm title="Create Product" onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Product' }
    });
    
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Test Product'
    });
  });
});
```

### Backend (Jest + Supertest)
```typescript
import request from 'supertest';
import app from '../src/app';

describe('Products API', () => {
  it('POST /api/products should create product', async () => {
    const productData = {
      code: 'TEST-001',
      name: 'Test Product',
      categoryId: 'category-id'
    };
    
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productData)
      .expect(201);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(productData.name);
  });
});
```

### E2E (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('should create and deliver product', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'admin@sigah.com');
  await page.fill('[data-testid=password]', 'admin123');
  await page.click('[data-testid=login-button]');
  
  await page.goto('/inventory');
  await page.click('[data-testid=create-product]');
  await page.fill('[data-testid=product-name]', 'Test Product');
  await page.click('[data-testid=save]');
  
  await expect(page.locator('[data-testid=success-message]')).toBeVisible();
});
```

---

## Documentación

### Tipos de Documentación
- **API Docs**: Documentación de endpoints (OpenAPI/Swagger)
- **Code Comments**: Comentarios en código complejo
- **README.md**: Documentación de proyecto
- **User Docs**: Guías para usuarios finales
- **Developer Docs**: Guías técnicas

### Estándares de Documentación
```typescript
/**
 * Calcula el stock disponible de un producto considerando lotes próximos a vencer
 * @param productId - ID del producto a consultar
 * @param includeExpiring - Incluir lotes próximos a vencer (default: false)
 * @returns Promesa que resuelve con el stock disponible
 * @throws {ProductNotFoundError} Si el producto no existe
 * @example
 * ```typescript
 * const stock = await getAvailableStock('prod-123', true);
 * console.log(`Stock disponible: ${stock.quantity}`);
 * ```
 */
async function getAvailableStock(
  productId: string, 
  includeExpiring: boolean = false
): Promise<StockInfo> {
  // implementation
}
```

### Actualización de Docs
- Actualizar README.md para cambios significativos
- Agregar ejemplos de código para nuevas features
- Mantener CHANGELOG.md actualizado
- Documentar breaking changes

---

## Pull Requests

### Antes de Crear PR
1. Tests pasando
2. Código siguiendo estándares
3. Documentación actualizada
4. Commits siguiendo conventional commits
5. Rebase con develop si es necesario

### Estructura del PR
- **Título**: Descriptivo y siguiendo conventional commits
- **Descripción**: 
  - ¿Qué cambia?
  - ¿Por qué cambia?
  - ¿Cómo probar?
  - ¿Screenshots si aplica?
- **Tasks**: Checklist de tareas completadas
- **Linked Issues**: Issues relacionados

### Template de PR
```markdown
## Descripción
Breve descripción de los cambios implementados.

## Tipo de Cambio
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pasando
- [ ] Integration tests pasando
- [ ] Manual testing completado

## Checklist
- [ ] Código sigue estándares
- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] CHANGELOG.md actualizado

## Screenshots (si aplica)
<!-- Agregar screenshots para cambios UI -->

## Issues Relacionados
Closes #123, #456
```

### Proceso de Review
1. **Automático**: CI/CD checks (lint, tests, build)
2. **Peer Review**: Al menos otro desarrollador debe revisar
3. **Technical Review**: Arquitecto o tech lead para cambios grandes
4. **Approval**: Requerido approval de al menos 2 personas

---

## Lanzamientos

### Proceso de Release
1. **Preparación**:
   - Todos los tests pasando
   - Documentación actualizada
   - CHANGELOG.md actualizado
   - Versión actualizada en package.json

2. **Creación**:
   - Crear release tag: `git tag v1.2.3`
   - Push tag: `git push origin v1.2.3`
   - GitHub Actions crea release automáticamente

3. **Post-Release**:
   - Deploy a producción
   - Monitorear por 24 horas
   - Anunciar en canales correspondientes

### Versionado
- **Major**: Breaking changes
- **Minor**: Nuevas features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

### Release Notes
Generar automáticamente desde CHANGELOG.md:
```bash
npm run release:notes 1.2.3
```

---

## Comunidad

### Canales de Comunicación
- **GitHub Issues**: Bugs y features
- **GitHub Discussions**: Preguntas y discusiones
- **Slack**: Chat en tiempo real (invitación requerida)
- **Email**: Para asuntos privados

### Eventos
- **Sprint Planning**: Cada 2 semanas
- **Demo Day**: Fin de cada sprint
- **Community Call**: Mensual

### Reconocimientos
- **Contributors**: Lista de contribuidores en README
- **Hall of Fame**: Contribuidores destacados
- **Swag**: Stickers y camisetas para contribuidores activos

---

## Recursos

### Herramientas
- **IDE**: VS Code (configuración incluida)
- **Git**: GitHub Desktop o CLI
- **Docker**: Docker Desktop
- **Testing**: Jest, Playwright
- **CI/CD**: GitHub Actions

### Aprendizaje
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)**
- **[React Documentation](https://react.dev/)**
- **[Prisma Docs](https://www.prisma.io/docs/)**
- **[TailwindCSS Docs](https://tailwindcss.com/docs)**

### Soporte
- **New Contributors**: Mentoring disponible
- **Questions**: GitHub Discussions
- **Urgent Issues**: Email al maintainers

---

¡Gracias por contribuir a SIGAH! Tu ayuda hace que el sistema sea mejor para todos. 🚀
