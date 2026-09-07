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
    return res.status(200).json(stats);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
