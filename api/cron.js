const { triggerReportNow, getYesterdayTashkentDate } = require('../server/cron');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const isVercelCron = req.headers['x-vercel-cron'] === '1' || (req.headers['user-agent'] || '').includes('vercel-cron');
  const isForce = req.query && (req.query.force === 'true' || req.query.test === 'true');

  const nowUtc5 = new Date(Date.now() + 5 * 3600 * 1000);
  const hours = nowUtc5.getUTCHours();
  const minutes = nowUtc5.getUTCMinutes();

  // If not vercel-cron and not explicit ?force=true:
  // Only allow running within the scheduled 00:01 window (00:00 - 00:15 Tashkent time)
  if (!isVercelCron && !isForce) {
    if (hours !== 0 || minutes > 15) {
      return res.status(200).json({
        success: false,
        message: 'Kunlik hisobot faqat Toshkent vaqti bilan 00:01 da kechagi kun uchun yuboriladi. Istalgan vaqtda sinash uchun ?force=true qo\'shing.',
        currentTashkentTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      });
    }
  }

  try {
    const targetDate = req.query?.date || getYesterdayTashkentDate();
    const result = await triggerReportNow(targetDate);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Cron report error:', err);
    return res.status(500).json({ error: err.message });
  }
};
