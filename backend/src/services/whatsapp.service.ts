import logger from './logger.service';

// Configuración de WhatsApp Business API (oficial de Meta)
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// TextMeBot API (alternativa gratuita - recomendada por CallMeBot)
// Para activar: El usuario debe ir a https://textmebot.com/whatsapp y seguir instrucciones
const TEXTMEBOT_API_URL = 'https://api.textmebot.com/send.php';

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

// Etiquetas de criticidad en español
const CRITICALITY_LABELS: Record<string, string> = {
  INFORMATIVE: 'Informativo',
  LOW: 'Bajo',
  NORMAL: 'Normal',
  MEDIUM: 'Medio',
  HIGH: 'Prioritario',
  CRITICAL: 'Crítico',
};

export interface WhatsAppMessage {
  to: string;                    // Número de teléfono destino
  type: string;                  // Tipo de notificación
  criticality: string;           // Nivel de criticidad
  title: string;                 // Título del mensaje
  message: string;               // Contenido del mensaje
  senderName: string;            // Nombre del remitente
  receiverName: string;          // Nombre del destinatario
  traceCode: string;             // Código de trazabilidad
  referenceType?: string;        // Tipo de referencia (DELIVERY, REQUEST, etc.)
  referenceId?: string;          // ID de referencia
  actionUrl?: string;            // URL de acción
  timestamp?: Date;              // Fecha/hora del mensaje
  callmebotApiKey?: string;      // API Key de CallMeBot (si el usuario la tiene configurada)
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Formatea un número de teléfono para WhatsApp
 * Elimina espacios, guiones y asegura el formato internacional
 */
export function formatPhoneNumber(phone: string): string {
  // Eliminar espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si no empieza con +, agregar código de país (Colombia por defecto)
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('57')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '+57' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Construye el mensaje formateado para WhatsApp con emojis y estructura
 */
export function buildWhatsAppMessage(data: WhatsAppMessage): string {
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
${typeIcon} *SIGAH - Notificación*
━━━━━━━━━━━━━━━━━━━━━━

*${data.title}*

${data.message}

━━━━━━━━━━━━━━━━━━━━━━
📊 *Información de Trazabilidad*
━━━━━━━━━━━━━━━━━━━━━━
${critIcon} Criticidad: *${critLabel}*
👤 De: ${data.senderName}
👥 Para: ${data.receiverName}
🆔 Código: \`${data.traceCode}\`
📅 Fecha: ${formattedDate}
🕐 Hora: ${formattedTime}
`;

  if (data.referenceType && data.referenceId) {
    message += `📎 Referencia: ${data.referenceType} #${data.referenceId}\n`;
  }

  if (data.actionUrl) {
    message += `\n🔗 Ir a la acción: ${data.actionUrl}\n`;
  }

  message += `
━━━━━━━━━━━━━━━━━━━━━━
🏥 *Sistema SIGAH*
_Gestión de Ayudas Humanitarias_
━━━━━━━━━━━━━━━━━━━━━━`;

  return message.trim();
}

/**
 * Envía mensaje usando TextMeBot API (gratuita)
 * El usuario debe registrarse en https://textmebot.com/whatsapp
 */
async function sendViaTextMeBot(phone: string, message: string, apiKey: string): Promise<WhatsAppResponse> {
  try {
    // Formatear número (TextMeBot usa formato con código de país sin +)
    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleanPhone.startsWith('57') && cleanPhone.length === 10) {
      cleanPhone = '57' + cleanPhone;
    }

    logger.info(`[WHATSAPP-TEXTMEBOT] Enviando mensaje a ${cleanPhone}`);

    // TextMeBot usa POST con form data
    const formData = new URLSearchParams();
    formData.append('recipient', cleanPhone);
    formData.append('apikey', apiKey);
    formData.append('text', message);

    const response = await fetch(TEXTMEBOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const responseText = await response.text();

    if (response.ok && !responseText.toLowerCase().includes('error')) {
      const messageId = `TMB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.info(`[WHATSAPP-TEXTMEBOT] Mensaje enviado exitosamente`, { to: cleanPhone, messageId });
      return { success: true, messageId };
    } else {
      throw new Error(responseText || 'Error en TextMeBot API');
    }
  } catch (error: any) {
    logger.error(`[WHATSAPP-TEXTMEBOT] Error:`, { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Envía un mensaje de texto a través de WhatsApp
 * Prioridad: 1) TextMeBot (si hay apiKey), 2) WhatsApp Business API, 3) Simulación
 */
export async function sendWhatsAppMessage(data: WhatsAppMessage): Promise<WhatsAppResponse> {
  try {
    const formattedPhone = formatPhoneNumber(data.to);
    const messageText = buildWhatsAppMessage(data);

    // Opción 1: Usar TextMeBot si hay apiKey configurada
    if (data.callmebotApiKey) {
      logger.info('[WHATSAPP] Usando TextMeBot API');
      return await sendViaTextMeBot(formattedPhone, messageText, data.callmebotApiKey);
    }

    // Opción 2: Usar WhatsApp Business API oficial si está configurada
    if (WHATSAPP_PHONE_ID && WHATSAPP_ACCESS_TOKEN && 
        WHATSAPP_PHONE_ID !== 'TU_PHONE_NUMBER_ID_AQUI' && 
        WHATSAPP_ACCESS_TOKEN !== 'TU_ACCESS_TOKEN_AQUI') {
      
      logger.info('[WHATSAPP] Usando WhatsApp Business API oficial');

      const response = await fetch(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: { preview_url: true, body: messageText }
          })
        }
      );

      const responseData: any = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData?.error?.message || 'Error en API de WhatsApp');
      }

      const messageId = responseData?.messages?.[0]?.id;
      logger.info(`[WHATSAPP] Mensaje enviado exitosamente`, { to: formattedPhone, messageId });
      return { success: true, messageId };
    }

    // Opción 3: Modo simulación (desarrollo)
    logger.warn('[WHATSAPP] API no configurada - modo simulación');
    const simulatedId = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('\n📱 MENSAJE WHATSAPP (SIMULADO):');
    console.log('─'.repeat(50));
    console.log(`📞 Destino: ${formattedPhone}`);
    console.log('─'.repeat(50));
    console.log(messageText);
    console.log('─'.repeat(50));
    console.log('⚠️  Para enviar mensajes reales, configure CallMeBot:');
    console.log('    1. Envíe "I allow callmebot to send me messages"');
    console.log('       al número +34 644 52 74 88 en WhatsApp');
    console.log('    2. Recibirá un apikey, agréguela al perfil del usuario');
    console.log('─'.repeat(50));
    
    return { success: true, messageId: simulatedId };

  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    logger.error(`[WHATSAPP] Error al enviar mensaje`, { to: data.to, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Envía una notificación de prueba para verificar la configuración
 */
export async function sendTestMessage(phone: string): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to: phone,
    type: 'SYSTEM',
    criticality: 'INFORMATIVE',
    title: '🧪 Mensaje de Prueba',
    message: 'Este es un mensaje de prueba del sistema SIGAH para verificar la configuración de notificaciones WhatsApp.',
    senderName: 'Sistema SIGAH',
    receiverName: 'Administrador',
    traceCode: `TEST_${Date.now()}`,
    timestamp: new Date()
  });
}

export default {
  sendWhatsAppMessage,
  sendTestMessage,
  buildWhatsAppMessage,
  formatPhoneNumber,
  ICONS,
  CRITICALITY_ICONS,
  CRITICALITY_LABELS
};
