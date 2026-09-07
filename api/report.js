const { triggerReportNow, getYesterdayTashkentDate } = require('../server/cron');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const isForce = req.query && (req.query.force === 'true' || req.query.test === 'true');

  const nowUtc5 = new Date(Date.now() + 5 * 3600 * 1000);
  const hours = nowUtc5.getUTCHours();
  const minutes = nowUtc5.getUTCMinutes();

  if (!isForce && (hours !== 0 || minutes > 15)) {
    return res.status(200).json({
      success: false,
      message: 'Kunlik hisobot faqat Toshkent vaqti bilan 00:01 da kechagi kun uchun yuboriladi. Istalgan vaqtda sinash uchun ?force=true qo\'shing.',
      currentTashkentTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    });
  }

  try {
    const targetDate = req.query?.date || getYesterdayTashkentDate();
    const result = await triggerReportNow(targetDate);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: err.message });
  }
};
