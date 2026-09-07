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
const MAIN_GROUP_CHAT_ID = '-1004491595905'; // "Ucharbek leadlar (BR)" Supergroup
const PERSONAL_ADMIN_CHAT_ID = '552003748'; // Bobur personal chat

/**
 * Send raw message to a Telegram Chat ID via Bot API
 */
async function sendTelegramMessage(text, customChatId = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const chatId = customChatId || MAIN_GROUP_CHAT_ID;

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

  // 1. ASOSIY MANZIL: Guruh ("Ucharbek leadlar (BR)")
  const groupRes = await sendTelegramMessage(message, MAIN_GROUP_CHAT_ID);

  // 2. NUSXA: Shaxsiy lichka (Bobur)
  const personalRes = await sendTelegramMessage(message, PERSONAL_ADMIN_CHAT_ID);

  return groupRes.success ? groupRes : personalRes;
}

/**
 * Send Daily Statistical Summary (Format strictly matching TZ)
 */
async function sendDailyReport(stats) {
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

  // Send daily report to personal chat
  const personalRes = await sendTelegramMessage(message, PERSONAL_ADMIN_CHAT_ID);

  // Also send daily report to main group
  const groupRes = await sendTelegramMessage(message, MAIN_GROUP_CHAT_ID);

  return personalRes.success ? personalRes : groupRes;
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
