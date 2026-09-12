// Telegram Bot Integration for Real-time Leads & Daily Reports
// Uses native Node.js fetch

const { getDailyStats } = require('./database');

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

// Legacy default chat IDs, kept only as a fallback for local dev when the
// env vars below aren't set — these are NOT secrets (a chat/group ID on its
// own can't be used to control the bot). The bot token, by contrast, IS a
// credential and must never be hardcoded: it is read from
// TELEGRAM_BOT_TOKEN (Vercel → Settings → Environment Variables) only. If
// it's missing, we fail loudly instead of silently using a stale/exposed
// token.
const MAIN_GROUP_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1004491595905'; // Leadlar guruhi (Group ID: 1004491595905)
const PERSONAL_ADMIN_CHAT_ID = process.env.TELEGRAM_REPORT_CHAT_ID || '6399335791'; // Admin shaxsiy lichkasi — faqat kunlik hisobotlar uchun

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send raw message to a Telegram Chat ID via Bot API.
 * Retries once on network/API failure so a single transient blip
 * (timeout, Telegram 5xx) doesn't drop a lead notification.
 */
async function sendTelegramMessage(text, customChatId = null, replyMarkup = null, attempt = 1) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customChatId || MAIN_GROUP_CHAT_ID;

  if (!token) {
    console.error('[TELEGRAM] TELEGRAM_BOT_TOKEN is not set in the environment — message NOT sent. Set it in Vercel → Settings → Environment Variables.');
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {})
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error response:', data);
      return { success: false, error: data.description };
    }
    return { success: true, messageId: data.result.message_id };
  } catch (err) {
    console.error(`Failed to send Telegram message (attempt ${attempt}):`, err.message);
    if (attempt < 2) {
      await sleep(700);
      return sendTelegramMessage(text, customChatId, replyMarkup, attempt + 1);
    }
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
    lead.suspicious ? `<b>⚠️ Diqqat: tez to'ldirilgan/shubhali ariza (bot bo'lishi mumkin, tekshiring)</b>\n` : null,
    `<b>🆕 Yangi ariza — Ucharbek</b>`,
    ``,
    `👤 <b>Ism:</b> ${escapeHtml(lead.name)}`,
    `📞 <b>Tel:</b> <code>${escapeHtml(lead.phone)}</code>`,
    `🌍 <b>Yo'nalish:</b> ${escapeHtml(lead.destination)}`,
    `🕐 <b>Vaqt:</b> ${timeStr}`,
    `🔗 <b>Manba:</b> ${escapeHtml(sourceStr)}`
  ].filter(line => line !== null).join('\n');

  // ASOSIY: guruhga yuboriladi. Agar guruhga yuborish muvaffaqiyatsiz
  // bo'lsa (bot chiqarib yuborilgan, chat ID noto'g'ri va h.k.), lead
  // hech qachon "yo'qolmasligi" uchun adminning shaxsiy chatiga zaxira
  // sifatida yuboriladi — shu bilan admin har doim xabardor bo'ladi.
  const groupRes = await sendTelegramMessage(message, MAIN_GROUP_CHAT_ID);

  if (!groupRes.success) {
    console.error('[TELEGRAM] Lead guruhga yuborilmadi:', groupRes.error);
    const fallbackMessage = `⚠️ <b>Guruhga yuborib bo'lmadi</b> (${escapeHtml(groupRes.error || 'unknown error')}), shu sabab shaxsiy chatga yuborildi:\n\n${message}`;
    const fallbackRes = await sendTelegramMessage(fallbackMessage, PERSONAL_ADMIN_CHAT_ID);
    if (!fallbackRes.success) {
      console.error('[TELEGRAM] Zaxira (shaxsiy chat) yuborish ham muvaffaqiyatsiz:', fallbackRes.error);
    }
    return fallbackRes.success ? fallbackRes : groupRes;
  }

  return groupRes;
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

  // Har bir kunlik hisobot ostiga "joriy holatni olish" tugmasi qo'shiladi —
  // admin istalgan vaqtda bosib, ayni damgacha bo'lgan (bugungi, hali
  // tugamagan kun uchun) statistikani so'rab olishi mumkin.
  const replyMarkup = {
    inline_keyboard: [[
      { text: '🔄 Joriy holatni olish', callback_data: 'get_current_report' }
    ]]
  };

  // Kunlik hisobot FAQAT admin shaxsiy lichkasiga boradi (guruhga yubormaymiz)
  const personalRes = await sendTelegramMessage(message, PERSONAL_ADMIN_CHAT_ID, replyMarkup);

  if (!personalRes.success) {
    console.error('[TELEGRAM] Hisobot shaxsiy lichkaga yuborilmadi:', personalRes.error);
  }

  return personalRes;
}

/**
 * Bugungi (hali tugamagan) kun uchun Toshkent sanasi — "shu vaqtgacha" hisobot uchun
 */
function getTodayTashkentDate() {
  const nowUtc5 = new Date(Date.now() + 5 * 3600 * 1000);
  return nowUtc5.toISOString().split('T')[0];
}

/**
 * "Joriy holat" hisoboti — bugungi kun hali tugamagan bo'lsa ham,
 * shu daqiqagacha to'plangan statistikani yuboradi. Bot tugmasi yoki
 * /hisobot buyrug'i orqali chaqiriladi (qarang: api/telegram-webhook.js)
 */
async function sendCurrentStatusReport(chatId = null) {
  const dateStr = getTodayTashkentDate();
  const stats = await getDailyStats(dateStr);
  const [datePart, timePart] = getTashkentTimeString().split(', ');

  const message = [
    `<b>📊 Joriy holat — ${datePart}</b>`,
    `<i>Bugun soat ${timePart} holatiga (kun hali tugamagan, to'liq emas)</i>`,
    ``,
    `👀 <b>Sahifaga tashrif:</b> ${stats.visitsCount.toLocaleString()}`,
    `✅ <b>Ariza qoldirganlar:</b> ${stats.leadsCount.toLocaleString()}`,
    `❌ <b>Kirib, ariza qoldirmaganlar:</b> ${stats.nonConvertedCount.toLocaleString()}`,
    `📈 <b>Konversiya:</b> ${stats.conversionRate}%`
  ].join('\n');

  const replyMarkup = {
    inline_keyboard: [[
      { text: '🔄 Yangilash', callback_data: 'get_current_report' }
    ]]
  };

  return sendTelegramMessage(message, chatId || PERSONAL_ADMIN_CHAT_ID, replyMarkup);
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
  sendCurrentStatusReport,
  getTashkentTimeString,
  MAIN_GROUP_CHAT_ID,
  PERSONAL_ADMIN_CHAT_ID
};
