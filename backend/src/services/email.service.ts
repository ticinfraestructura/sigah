/**
 * Servicio de Email
 * 
 * Proporciona:
 * - Envío de emails transaccionales
 * - Templates HTML con Handlebars
 * - Cola de emails con reintentos
 * - Logs de envíos
 */

import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import logger from './logger.service';

// ============ CONFIGURACIÓN ============

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

const getEmailConfig = (): EmailConfig => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  from: process.env.SMTP_FROM || 'SIGAH <noreply@sigah.com>'
});

// Crear transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    const config = getEmailConfig();
    
    if (!config.auth.user || !config.auth.pass) {
      logger.warn('[EMAIL] SMTP credentials not configured, using ethereal for testing');
      // Crear cuenta de prueba con Ethereal
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test'
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth
      });
    }
  }
  return transporter;
};

// ============ TEMPLATES ============

const templates: Record<string, Handlebars.TemplateDelegate> = {};

// Registrar helpers de Handlebars
Handlebars.registerHelper('formatDate', (date: Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

Handlebars.registerHelper('formatCurrency', (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount);
});

// Template base HTML
const baseTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; color: #333; line-height: 1.6; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .button:hover { background-color: #1d4ed8; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .alert { padding: 15px; border-radius: 5px; margin: 15px 0; }
    .alert-warning { background-color: #fef3cd; border: 1px solid #ffc107; color: #856404; }
    .alert-success { background-color: #d4edda; border: 1px solid #28a745; color: #155724; }
    .alert-danger { background-color: #f8d7da; border: 1px solid #dc3545; color: #721c24; }
    .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .table th, .table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
    .table th { background-color: #f8f9fa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤝 SIGAH</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestión de Ayudas Humanitarias</p>
    </div>
    <div class="content">
      {{{body}}}
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del sistema SIGAH.</p>
      <p>Por favor no responda a este correo.</p>
      <p>&copy; {{year}} SIGAH - Todos los derechos reservados</p>
    </div>
  </div>
</body>
</html>
`;

// Compilar template base
const compiledBaseTemplate = Handlebars.compile(baseTemplate);

// ============ TIPOS DE EMAIL ============

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

// ============ TEMPLATES ESPECÍFICOS ============

const emailTemplates: Record<string, string> = {
  // Recuperación de contraseña
  passwordReset: `
    <h2>Recuperación de Contraseña</h2>
    <p>Hola <strong>{{userName}}</strong>,</p>
    <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
    <p style="text-align: center;">
      <a href="{{resetLink}}" class="button">Restablecer Contraseña</a>
    </p>
    <p>Este enlace expirará en <strong>{{expiresIn}}</strong>.</p>
    <div class="alert alert-warning">
      <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este correo.
    </div>
  `,

  // Bienvenida
  welcome: `
    <h2>¡Bienvenido a SIGAH!</h2>
    <p>Hola <strong>{{userName}}</strong>,</p>
    <p>Tu cuenta ha sido creada exitosamente.</p>
    <p><strong>Datos de acceso:</strong></p>
    <ul>
      <li>Email: {{email}}</li>
      <li>Rol: {{roleName}}</li>
    </ul>
    <p style="text-align: center;">
      <a href="{{loginUrl}}" class="button">Iniciar Sesión</a>
    </p>
  `,

  // Alerta de stock bajo
  lowStock: `
    <h2>⚠️ Alerta de Stock Bajo</h2>
    <p>Los siguientes productos tienen stock por debajo del mínimo:</p>
    <table class="table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Producto</th>
          <th>Stock Actual</th>
          <th>Stock Mínimo</th>
        </tr>
      </thead>
      <tbody>
        {{#each products}}
        <tr>
          <td>{{this.code}}</td>
          <td>{{this.name}}</td>
          <td style="color: #dc3545; font-weight: bold;">{{this.currentStock}}</td>
          <td>{{this.minStock}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
    <p style="text-align: center;">
      <a href="{{inventoryUrl}}" class="button">Ver Inventario</a>
    </p>
  `,

  // Nueva solicitud
  newRequest: `
    <h2>📋 Nueva Solicitud Registrada</h2>
    <p>Se ha registrado una nueva solicitud de ayuda humanitaria:</p>
    <table class="table">
      <tr><th>Código</th><td>{{requestCode}}</td></tr>
      <tr><th>Beneficiario</th><td>{{beneficiaryName}}</td></tr>
      <tr><th>Documento</th><td>{{beneficiaryDocument}}</td></tr>
      <tr><th>Fecha</th><td>{{formatDate requestDate}}</td></tr>
      <tr><th>Prioridad</th><td>{{priority}}</td></tr>
    </table>
    {{#if notes}}
    <p><strong>Notas:</strong> {{notes}}</p>
    {{/if}}
    <p style="text-align: center;">
      <a href="{{requestUrl}}" class="button">Ver Solicitud</a>
    </p>
  `,

  // Solicitud aprobada
  requestApproved: `
    <h2>✅ Solicitud Aprobada</h2>
    <p>La solicitud <strong>{{requestCode}}</strong> ha sido aprobada.</p>
    <p><strong>Beneficiario:</strong> {{beneficiaryName}}</p>
    <p><strong>Aprobado por:</strong> {{approvedBy}}</p>
    <p><strong>Fecha:</strong> {{formatDate approvalDate}}</p>
    {{#if notes}}
    <p><strong>Notas:</strong> {{notes}}</p>
    {{/if}}
    <div class="alert alert-success">
      La entrega será programada próximamente.
    </div>
  `,

  // Entrega lista
  deliveryReady: `
    <h2>📦 Entrega Lista para Recoger</h2>
    <p>La entrega <strong>{{deliveryCode}}</strong> está lista.</p>
    <table class="table">
      <tr><th>Solicitud</th><td>{{requestCode}}</td></tr>
      <tr><th>Beneficiario</th><td>{{beneficiaryName}}</td></tr>
      <tr><th>Preparado por</th><td>{{preparedBy}}</td></tr>
    </table>
    <p style="text-align: center;">
      <a href="{{deliveryUrl}}" class="button">Ver Entrega</a>
    </p>
  `,

  // Entrega completada
  deliveryCompleted: `
    <h2>✅ Entrega Completada</h2>
    <p>La entrega <strong>{{deliveryCode}}</strong> ha sido completada exitosamente.</p>
    <table class="table">
      <tr><th>Beneficiario</th><td>{{beneficiaryName}}</td></tr>
      <tr><th>Recibido por</th><td>{{receivedBy}}</td></tr>
      <tr><th>Documento</th><td>{{receiverDocument}}</td></tr>
      <tr><th>Fecha</th><td>{{formatDate deliveryDate}}</td></tr>
    </table>
    <div class="alert alert-success">
      ¡Gracias por su labor humanitaria!
    </div>
  `,

  // Productos próximos a vencer
  expiringProducts: `
    <h2>⏰ Productos Próximos a Vencer</h2>
    <p>Los siguientes productos vencerán en los próximos <strong>{{days}} días</strong>:</p>
    <table class="table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Lote</th>
          <th>Cantidad</th>
          <th>Fecha Vencimiento</th>
        </tr>
      </thead>
      <tbody>
        {{#each products}}
        <tr>
          <td>{{this.productName}}</td>
          <td>{{this.lotNumber}}</td>
          <td>{{this.quantity}}</td>
          <td style="color: #dc3545;">{{formatDate this.expiryDate}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
    <p style="text-align: center;">
      <a href="{{inventoryUrl}}" class="button">Ver Inventario</a>
    </p>
  `
};

// Compilar templates
Object.entries(emailTemplates).forEach(([name, template]) => {
  templates[name] = Handlebars.compile(template);
});

// ============ FUNCIONES PRINCIPALES ============

/**
 * Enviar email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const config = getEmailConfig();
    const transport = getTransporter();

    // Compilar template del body
    const bodyTemplate = templates[options.template];
    if (!bodyTemplate) {
      throw new Error(`Template '${options.template}' not found`);
    }

    const bodyHtml = bodyTemplate(options.data);

    // Compilar template completo
    const html = compiledBaseTemplate({
      subject: options.subject,
      body: bodyHtml,
      year: new Date().getFullYear()
    });

    // Enviar email
    const info = await transport.sendMail({
      from: config.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html,
      attachments: options.attachments
    });

    logger.info('[EMAIL] Sent successfully', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
      template: options.template
    });

    // En desarrollo, mostrar URL de preview (Ethereal)
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`[EMAIL] Preview URL: ${previewUrl}`);
      }
    }

    return true;
  } catch (error) {
    logger.error('[EMAIL] Failed to send', {
      error: (error as Error).message,
      to: options.to,
      template: options.template
    });
    return false;
  }
};

// ============ FUNCIONES HELPER ============

/**
 * Enviar email de recuperación de contraseña
 */
export const sendPasswordResetEmail = async (
  email: string,
  userName: string,
  resetToken: string
): Promise<boolean> => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  return sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña - SIGAH',
    template: 'passwordReset',
    data: {
      userName,
      resetLink,
      expiresIn: '1 hora'
    }
  });
};

/**
 * Enviar email de bienvenida
 */
export const sendWelcomeEmail = async (
  email: string,
  userName: string,
  roleName: string
): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: '¡Bienvenido a SIGAH!',
    template: 'welcome',
    data: {
      userName,
      email,
      roleName,
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
    }
  });
};

/**
 * Enviar alerta de stock bajo
 */
export const sendLowStockAlert = async (
  emails: string[],
  products: Array<{ code: string; name: string; currentStock: number; minStock: number }>
): Promise<boolean> => {
  return sendEmail({
    to: emails,
    subject: '⚠️ Alerta de Stock Bajo - SIGAH',
    template: 'lowStock',
    data: {
      products,
      inventoryUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/inventory`
    }
  });
};

/**
 * Enviar notificación de nueva solicitud
 */
export const sendNewRequestNotification = async (
  emails: string[],
  requestData: {
    requestCode: string;
    beneficiaryName: string;
    beneficiaryDocument: string;
    requestDate: Date;
    priority: string;
    notes?: string;
  }
): Promise<boolean> => {
  return sendEmail({
    to: emails,
    subject: `📋 Nueva Solicitud ${requestData.requestCode} - SIGAH`,
    template: 'newRequest',
    data: {
      ...requestData,
      requestUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests`
    }
  });
};

/**
 * Enviar notificación de entrega completada
 */
export const sendDeliveryCompletedNotification = async (
  email: string,
  deliveryData: {
    deliveryCode: string;
    beneficiaryName: string;
    receivedBy: string;
    receiverDocument: string;
    deliveryDate: Date;
  }
): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: `✅ Entrega Completada ${deliveryData.deliveryCode} - SIGAH`,
    template: 'deliveryCompleted',
    data: deliveryData
  });
};

/**
 * Enviar alerta de productos próximos a vencer
 */
export const sendExpiringProductsAlert = async (
  emails: string[],
  days: number,
  products: Array<{ productName: string; lotNumber: string; quantity: number; expiryDate: Date }>
): Promise<boolean> => {
  return sendEmail({
    to: emails,
    subject: `⏰ Productos Próximos a Vencer (${days} días) - SIGAH`,
    template: 'expiringProducts',
    data: {
      days,
      products,
      inventoryUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/inventory`
    }
  });
};

/**
 * Verificar configuración de email
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transport = getTransporter();
    await transport.verify();
    logger.info('[EMAIL] Configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('[EMAIL] Configuration verification failed', { error: (error as Error).message });
    return false;
  }
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLowStockAlert,
  sendNewRequestNotification,
  sendDeliveryCompletedNotification,
  sendExpiringProductsAlert,
  verifyEmailConfig
};
