// Telegram Webhook — bot tugmasi va buyruqlarini qabul qiladi
// (masalan: "🔄 Joriy holatni olish" tugmasi yoki /hisobot buyrug'i)
const { sendCurrentStatusReport, PERSONAL_ADMIN_CHAT_ID } = require('../server/telegram');

module.exports = async (req, res) => {
  // Telegram har doim 200 javobni kutadi — aks holda qayta-qayta urinishda davom etadi
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  // Ixtiyoriy xavfsizlik: agar TELEGRAM_WEBHOOK_SECRET o'rnatilgan bo'lsa,
  // faqat shu maxfiy tokenni o'z ichiga olgan so'rovlar qabul qilinadi
  // (setWebhook chaqirilganda secret_token parametri bilan birga o'rnatiladi).
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (receivedSecret !== expectedSecret) {
      console.warn('[TELEGRAM WEBHOOK] Noto\'g\'ri maxfiy token bilan so\'rov rad etildi.');
      return res.status(200).json({ ok: true });
    }
  }

  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const adminId = String(PERSONAL_ADMIN_CHAT_ID);

    // 1) Tugma bosilganda keladigan callback_query
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = String(cq.message?.chat?.id || '');
      const fromId = String(cq.from?.id || '');

      // Faqat admin va faqat shu tugma uchun ishlaydi — boshqa hamma e'tiborsiz qoldiriladi
      if (fromId === adminId && cq.data === 'get_current_report') {
        // Tugmadagi "yuklanmoqda" aylanuvchini to'xtatish uchun darhol javob beramiz
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (token) {
          fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: cq.id, text: 'Hisobot tayyorlanmoqda...' })
          }).catch(() => {});
        }

        await sendCurrentStatusReport(chatId);
      }

      return res.status(200).json({ ok: true });
    }

    // 2) Yozma buyruq: /hisobot yoki /report
    if (update.message && update.message.text) {
      const chatId = String(update.message.chat?.id || '');
      const fromId = String(update.message.from?.id || '');
      const text = update.message.text.trim().toLowerCase();

      if (fromId === adminId && (text === '/hisobot' || text === '/report' || text.startsWith('/hisobot@'))) {
        await sendCurrentStatusReport(chatId);
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[TELEGRAM WEBHOOK] Xatolik:', err);
    return res.status(200).json({ ok: true });
  }
};
