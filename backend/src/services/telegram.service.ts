/**
 * Servicio de Notificaciones por Telegram
 * 
 * Telegram es 100% GRATIS y sin límites de mensajes.
 * 
 * Para configurar:
 * 1. Busca @BotFather en Telegram
 * 2. Envía /newbot y sigue las instrucciones
 * 3. Copia el token que te da
 * 4. Agrégalo al .env como TELEGRAM_BOT_TOKEN
 * 
 * Para obtener tu Chat ID:
 * 1. Busca tu bot en Telegram y envíale un mensaje
 * 2. Visita: https://api.telegram.org/bot<TU_TOKEN>/getUpdates
 * 3. Busca "chat":{"id": TU_CHAT_ID }
 */

import logger from './logger.service';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Iconos por tipo de mensaje
const ICONS: Record<string, string> = {
  INFO: 'ℹ️',
  ALERT: '⚠️',
  DELIVERY: '📦',
  REQUEST: '📋',
  SYSTEM: '⚙️',
  REMINDER: '🔔',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚡',
};

// Iconos por criticidad
const CRITICALITY_ICONS: Record<string, string> = {
  INFORMATIVE: '💡',
  LOW: '🔵',
  NORMAL: '🟢',
  MEDIUM: '🟡',
  HIGH: '🟠',
  CRITICAL: '🔴',
};

const CRITICALITY_LABELS: Record<string, string> = {
  INFORMATIVE: 'Informativo',
  LOW: 'Bajo',
  NORMAL: 'Normal',
  MEDIUM: 'Medio',
  HIGH: 'Prioritario',
  CRITICAL: 'Crítico',
};

export interface TelegramMessage {
  chatId: string;              // Chat ID del destinatario
  type: string;                // Tipo de notificación
  criticality: string;         // Nivel de criticidad
  title: string;               // Título del mensaje
  message: string;             // Contenido del mensaje
  senderName: string;          // Nombre del remitente
  receiverName: string;        // Nombre del destinatario
  traceCode: string;           // Código de trazabilidad
  referenceType?: string;      // Tipo de referencia
  referenceId?: string;        // ID de referencia
  actionUrl?: string;          // URL de acción
  timestamp?: Date;            // Fecha/hora del mensaje
}

export interface TelegramResponse {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Construye el mensaje formateado para Telegram con emojis y estructura
 * Usa formato Markdown de Telegram
 */
export function buildTelegramMessage(data: TelegramMessage): string {
  const typeIcon = ICONS[data.type] || 'ℹ️';
  const critIcon = CRITICALITY_ICONS[data.criticality] || '🟢';
  const critLabel = CRITICALITY_LABELS[data.criticality] || 'Normal';
  const timestamp = data.timestamp || new Date();
  
  const formattedDate = timestamp.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = timestamp.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let message = `
━━━━━━━━━━━━━━━━━━━━━━
${typeIcon} *SIGAH \\- Notificación*
━━━━━━━━━━━━━━━━━━━━━━

*${escapeMarkdown(data.title)}*

${escapeMarkdown(data.message)}

━━━━━━━━━━━━━━━━━━━━━━
📊 *Información de Trazabilidad*
━━━━━━━━━━━━━━━━━━━━━━
${critIcon} Criticidad: *${critLabel}*
👤 De: ${escapeMarkdown(data.senderName)}
👥 Para: ${escapeMarkdown(data.receiverName)}
🆔 Código: \`${data.traceCode}\`
📅 Fecha: ${escapeMarkdown(formattedDate)}
🕐 Hora: ${formattedTime}
`;

  if (data.referenceType && data.referenceId) {
    message += `📎 Referencia: ${data.referenceType} \\#${data.referenceId}\n`;
  }

  if (data.actionUrl) {
    message += `\n🔗 [Ir a la acción](${data.actionUrl})\n`;
  }

  message += `
━━━━━━━━━━━━━━━━━━━━━━
🏥 *Sistema SIGAH*
_Gestión de Ayudas Humanitarias_
━━━━━━━━━━━━━━━━━━━━━━`;

  return message.trim();
}

/**
 * Escapa caracteres especiales para MarkdownV2 de Telegram
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Envía un mensaje a través de Telegram Bot API
 */
export async function sendTelegramMessage(data: TelegramMessage): Promise<TelegramResponse> {
  try {
    // Verificar configuración
    if (!TELEGRAM_BOT_TOKEN) {
      logger.warn('[TELEGRAM] Bot no configurado, mensaje simulado');
      
      // En desarrollo, simular envío exitoso
      const simulatedId = Date.now();
      logger.info(`[TELEGRAM] Mensaje simulado enviado a chat ${data.chatId}`, {
        messageId: simulatedId,
        title: data.title
      });
      
      // Log del mensaje que se enviaría
      console.log('\n📱 MENSAJE TELEGRAM (SIMULADO):');
      console.log('─'.repeat(50));
      console.log(`Chat ID: ${data.chatId}`);
      console.log(buildTelegramMessage(data).replace(/\\/g, ''));
      console.log('─'.repeat(50));
      
      return {
        success: true,
        messageId: simulatedId
      };
    }

    const messageText = buildTelegramMessage(data);

    // Llamar a la API de Telegram
    const response = await fetch(
      `${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: data.chatId,
          text: messageText,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: false
        })
      }
    );

    const responseData: any = await response.json();
    
    if (!responseData.ok) {
      throw new Error(responseData.description || 'Error en API de Telegram');
    }

    const messageId = responseData.result?.message_id;
    
    logger.info(`[TELEGRAM] Mensaje enviado exitosamente`, {
      chatId: data.chatId,
      messageId,
      type: data.type,
      criticality: data.criticality
    });

    return {
      success: true,
      messageId
    };

  } catch (error: any) {
    const errorMessage = error.message;
    
    logger.error(`[TELEGRAM] Error al enviar mensaje`, {
      chatId: data.chatId,
      error: errorMessage
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Envía un mensaje de prueba para verificar la configuración
 */
export async function sendTestMessage(chatId: string): Promise<TelegramResponse> {
  return sendTelegramMessage({
    chatId,
    type: 'SYSTEM',
    criticality: 'INFORMATIVE',
    title: '🧪 Mensaje de Prueba',
    message: 'Este es un mensaje de prueba del sistema SIGAH para verificar la configuración de notificaciones Telegram.',
    senderName: 'Sistema SIGAH',
    receiverName: 'Administrador',
    traceCode: `TEST_${Date.now()}`,
    timestamp: new Date()
  });
}

/**
 * Obtiene información del bot
 */
export async function getBotInfo(): Promise<any> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { error: 'Bot no configurado' };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/getMe`);
    const data = await response.json();
    return data;
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Obtiene las actualizaciones recientes (útil para obtener chat IDs)
 */
export async function getUpdates(): Promise<any> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { error: 'Bot no configurado' };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/getUpdates`);
    const data = await response.json();
    return data;
  } catch (error: any) {
    return { error: error.message };
  }
}

export default {
  sendTelegramMessage,
  sendTestMessage,
  buildTelegramMessage,
  getBotInfo,
  getUpdates,
  ICONS,
  CRITICALITY_ICONS,
  CRITICALITY_LABELS
};
