const crypto = require('node:crypto');
const { recordVisit } = require('../server/database');

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
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const visitorHash = crypto.createHash('sha256').update(ip + userAgent).digest('hex').substring(0, 16);

    try {
      recordVisit({
        visitorHash,
        utmSource: data.utm_source,
        utmCampaign: data.utm_campaign,
        referrer: data.referrer
      });
    } catch (dbErr) {
      // Ephemeral on serverless
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
