/**
 * Configuración de Swagger/OpenAPI
 * 
 * Documentación automática de la API
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SIGAH API',
      version: '1.0.0',
      description: 'Sistema de Gestión de Ayudas Humanitarias - API Documentation',
      contact: {
        name: 'SIGAH Support',
        email: 'support@sigah.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 50 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 2 }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            roleId: { type: 'string', format: 'uuid' },
            roleName: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            categoryId: { type: 'string', format: 'uuid' },
            unit: { type: 'string' },
            minStock: { type: 'integer' },
            isPerishable: { type: 'boolean' },
            isActive: { type: 'boolean' }
          }
        },
        Beneficiary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            documentType: { type: 'string', enum: ['CC', 'TI', 'CE', 'PA', 'RC', 'NIT'] },
            documentNumber: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            populationType: { type: 'string' }
          }
        },
        Request: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            beneficiaryId: { type: 'string', format: 'uuid' },
            status: { 
              type: 'string', 
              enum: ['REGISTERED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED'] 
            },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@sigah.com' },
            password: { type: 'string', example: 'admin123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Products', description: 'Product management' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Beneficiaries', description: 'Beneficiary management' },
      { name: 'Requests', description: 'Request management' },
      { name: 'Deliveries', description: 'Delivery management' },
      { name: 'Inventory', description: 'Inventory management' },
      { name: 'Reports', description: 'Reports and analytics' },
      { name: 'Roles', description: 'Role and permission management' }
    ]
  },
  apis: ['./src/routes/*.ts', './src/docs/*.yaml']
};

export const swaggerSpec = swaggerJsdoc(options);
