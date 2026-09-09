const { saveLead } = require('../server/database');
const { notifyNewLead } = require('../server/telegram');
const { appendLeadToGoogleSheet } = require('../server/googlesheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // Anti-spam check: same combined logic as the client (honeypot filled
    // AND implausibly fast submission). A honeypot value alone is not
    // enough to reject a real lead, since mobile/in-app-browser autofill
    // can fill it for genuine users too.
    const honeypotFilled = !!(data.hp_check_x7q && String(data.hp_check_x7q).trim() !== '');
    const msSinceRender = data.form_rendered_at ? (Date.now() - Number(data.form_rendered_at)) : Infinity;
    const submittedTooFast = msSinceRender < 1500;
    if (honeypotFilled && submittedTooFast) {
      console.warn('[SECURITY] Bot detected via honeypot field + fast submit.');
      return res.status(200).json({ success: true, message: 'Received' });
    }

    if (!data.name || !data.phone || !data.destination) {
      return res.status(400).json({
        success: false,
        error: "Barcha majburiy maydonlarni to'ldiring (Ism, Telefon, Yo'nalish)"
      });
    }

    // Save to DB (best-effort)
    try {
      saveLead(data);
    } catch (dbErr) {
      console.warn('[DB] SQLite error on serverless:', dbErr.message);
    }

    // Await Telegram & Google Sheets so serverless lambda does not freeze before completion
    const [tgResult, sheetResult] = await Promise.allSettled([
      notifyNewLead(data),
      appendLeadToGoogleSheet(data)
    ]);

    if (tgResult.status === 'rejected') {
      console.error('[TELEGRAM] Error sending notification:', tgResult.reason);
    }
    if (sheetResult.status === 'rejected') {
      console.error('[GOOGLE SHEETS] Error syncing lead:', sheetResult.reason);
    }

    return res.status(200).json({
      success: true,
      message: "Arizangiz qabul qilindi, tez orada bog'lanamiz!"
    });
  } catch (err) {
    console.error('Lead route error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
