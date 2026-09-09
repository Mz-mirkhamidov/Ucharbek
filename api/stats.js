const { getDailyStats } = require('../server/database');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const targetDate = req.query?.date;
    const stats = await getDailyStats(targetDate);

    // Configuration diagnostics — lets you confirm in the browser whether
    // Vercel actually picked up the required env vars, instead of having
    // to dig through function logs. Visit /api/stats?config=1 to see this.
    if (req.query?.config === '1') {
      stats.config = {
        telegram_bot_token_set: !!process.env.TELEGRAM_BOT_TOKEN,
        telegram_chat_id_set: !!process.env.TELEGRAM_CHAT_ID,
        google_sheets_webhook_set: !!(process.env.GOOGLE_SHEETS_WEBHOOK_URL && !process.env.GOOGLE_SHEETS_WEBHOOK_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL')),
        note: 'true bo\'lishi kerak barchasi uchun. false bo\'lsa — Vercel Dashboard > Settings > Environment Variables da tekshiring va qayta deploy qiling.'
      };
    }

    return res.status(200).json(stats);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
