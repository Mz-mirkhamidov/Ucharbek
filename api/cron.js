const { triggerReportNow } = require('../server/cron');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const result = await triggerReportNow();
    return res.status(200).json(result);
  } catch (err) {
    console.error('Cron report error:', err);
    return res.status(500).json({ error: err.message });
  }
};
