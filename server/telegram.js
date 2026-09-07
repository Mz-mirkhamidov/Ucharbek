// Telegram Bot Integration for Real-time Leads & Daily Reports
// Uses native Node.js fetch

/**
 * Format current timestamp in Tashkent Time (+5)
 */
function getTashkentTimeString() {
  const date = new Date(Date.now() + 5 * 3600 * 1000);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

const DEFAULT_BOT_TOKEN = '8470184237:AAEt5xECCzVrUOqZF2mF8GdlPkE78oP8_ng';
const DEFAULT_LEAD_CHAT_ID = '-1004491595905'; // Ucharbek leadlar (BR) group
const DEFAULT_REPORT_CHAT_ID = '552003748'; // Bobur personal ID

/**
 * Send raw message to a Telegram Chat ID via Bot API
 */
async function sendTelegramMessage(text, customChatId = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || DEFAULT_LEAD_CHAT_ID;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error response:', data);
      return { success: false, error: data.description };
    }
    return { success: true, messageId: data.result.message_id };
  } catch (err) {
    console.error('Failed to send Telegram message:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send New Lead Notification (Format strictly matching TZ)
 */
async function notifyNewLead(lead) {
  const timeStr = getTashkentTimeString();
  
  // Construct UTM / Source string
  let sourceStr = lead.utm_source || 'To\'g\'ridan-to\'g\'ri (Direct)';
  if (lead.utm_campaign) {
    sourceStr += ` / kampaniya: ${lead.utm_campaign}`;
  }
  if (lead.referrer && lead.referrer !== 'direct') {
    sourceStr += ` (ref: ${lead.referrer})`;
  }

  const message = [
    `<b>🆕 Yangi ariza — Ucharbek</b>`,
    ``,
    `👤 <b>Ism:</b> ${escapeHtml(lead.name)}`,
    `📞 <b>Tel:</b> <code>${escapeHtml(lead.phone)}</code>`,
    `🌍 <b>Yo'nalish:</b> ${escapeHtml(lead.destination)}`,
    `🕐 <b>Vaqt:</b> ${timeStr}`,
    `🔗 <b>Manba:</b> ${escapeHtml(sourceStr)}`
  ].join('\n');

  return await sendTelegramMessage(message);
}

/**
 * Send Daily Statistical Summary (Format strictly matching TZ)
 */
async function sendDailyReport(stats) {
  const targetChatId = process.env.TELEGRAM_REPORT_CHAT_ID || DEFAULT_REPORT_CHAT_ID;
  const dateParts = (stats.date || '').split('-');
  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : stats.date;

  const message = [
    `<b>📊 Kunlik hisobot — ${formattedDate}</b> (To'liq 24 soatlik natija)`,
    ``,
    `👀 <b>Sahifaga tashrif:</b> ${stats.visitsCount.toLocaleString()}`,
    `✅ <b>Ariza qoldirganlar:</b> ${stats.leadsCount.toLocaleString()}`,
    `❌ <b>Kirib, ariza qoldirmaganlar:</b> ${stats.nonConvertedCount.toLocaleString()}`,
    `📈 <b>Konversiya:</b> ${stats.conversionRate}%`
  ].join('\n');

  const result = await sendTelegramMessage(message, targetChatId);

  // If sending to user's private chat ID failed, fallback to main group
  if (!result.success) {
    const fallbackGroup = process.env.TELEGRAM_CHAT_ID || DEFAULT_LEAD_CHAT_ID;
    console.warn(`[TELEGRAM] Failed to send report to personal ID ${targetChatId} (${result.error}). Falling back to main group ${fallbackGroup}...`);
    return await sendTelegramMessage(message, fallbackGroup);
  }

  return result;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  sendTelegramMessage,
  notifyNewLead,
  sendDailyReport,
  getTashkentTimeString
};
