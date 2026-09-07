let db = null;

try {
  const { DatabaseSync } = require('node:sqlite');
  const path = require('node:path');
  const fs = require('node:fs');

  // In Vercel serverless functions, project directory is read-only. Use /tmp for writable storage.
  const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  const DB_DIR = isVercel ? '/tmp' : path.join(__dirname, '../data');

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const DB_PATH = path.join(DB_DIR, 'ucharbek.db');
  db = new DatabaseSync(DB_PATH);

  // Initialize Tables
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_hash TEXT,
      utm_source TEXT,
      utm_campaign TEXT,
      referrer TEXT,
      created_at TEXT DEFAULT (datetime('now', '+5 hours'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      destination TEXT NOT NULL,
      language TEXT DEFAULT 'uz',
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      referrer TEXT,
      created_at TEXT DEFAULT (datetime('now', '+5 hours'))
    );

    CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
  `);
} catch (initErr) {
  console.warn('[DATABASE] SQLite not available in this environment or failed to init:', initErr.message);
  db = null;
}

/**
 * Record a unique or returning visit
 */
function recordVisit({ visitorHash, utmSource, utmCampaign, referrer }) {
  const dateStr = new Date(Date.now() + 5 * 3600 * 1000).toISOString().split('T')[0];
  // Increment persistent cloud counter for serverless environments
  fetch(`https://abacus.jasoncameron.dev/hit/ucharbek_prod/visits_${dateStr}`).catch(() => {});

  if (!db) return true;
  try {
    const stmt = db.prepare(`
      INSERT INTO visits (visitor_hash, utm_source, utm_campaign, referrer)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(visitorHash || 'unknown', utmSource || 'direct', utmCampaign || '', referrer || '');
    return true;
  } catch (err) {
    console.error('Error recording visit:', err);
    return false;
  }
}

/**
 * Save new lead application
 */
function saveLead(lead) {
  const dateStr = new Date(Date.now() + 5 * 3600 * 1000).toISOString().split('T')[0];
  // Increment persistent cloud counter for serverless environments
  fetch(`https://abacus.jasoncameron.dev/hit/ucharbek_prod/leads_${dateStr}`).catch(() => {});

  if (!db) return { success: true, id: Date.now() };
  try {
    const stmt = db.prepare(`
      INSERT INTO leads (name, phone, destination, language, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      lead.name,
      lead.phone,
      lead.destination,
      lead.language || 'uz',
      lead.utm_source || 'direct',
      lead.utm_medium || '',
      lead.utm_campaign || '',
      lead.utm_content || '',
      lead.utm_term || '',
      lead.referrer || ''
    );
    return { success: true, id: result.lastInsertRowid };
  } catch (err) {
    console.error('Error saving lead:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Calculate Daily Conversion Statistics
 * Uses Tashkent time (+5 hours).
 * By default, calculates stats for the PREVIOUS COMPLETED 24h DAY.
 */
async function getDailyStats(targetDate) {
  // Format: YYYY-MM-DD
  // Default to yesterday in Tashkent time (the full completed 24 hours)
  const nowUtc5 = new Date(Date.now() + 5 * 3600 * 1000);
  const yesterdayUtc5 = new Date(nowUtc5.getTime() - 24 * 3600 * 1000);
  const dateStr = targetDate || yesterdayUtc5.toISOString().split('T')[0];

  let visitsCount = 0;
  let leadsCount = 0;

  if (db) {
    try {
      const visitsStmt = db.prepare(`
        SELECT COUNT(*) as count FROM visits 
        WHERE date(created_at) = ?
      `);
      const visitsRow = visitsStmt.get(dateStr);
      if (visitsRow) visitsCount = visitsRow.count;

      const leadsStmt = db.prepare(`
        SELECT COUNT(*) as count FROM leads 
        WHERE date(created_at) = ?
      `);
      const leadsRow = leadsStmt.get(dateStr);
      if (leadsRow) leadsCount = leadsRow.count;
    } catch (e) {
      console.warn('[DB] SQLite getDailyStats error:', e.message);
    }
  }

  // Fallback to persistent cloud counter if local SQLite has 0 (e.g. on Vercel serverless)
  if (visitsCount === 0 && leadsCount === 0) {
    try {
      const [vRes, lRes] = await Promise.allSettled([
        fetch(`https://abacus.jasoncameron.dev/get/ucharbek_prod/visits_${dateStr}`),
        fetch(`https://abacus.jasoncameron.dev/get/ucharbek_prod/leads_${dateStr}`)
      ]);
      if (vRes.status === 'fulfilled' && vRes.value.ok) {
        const d = await vRes.value.json();
        visitsCount = parseInt(d.value, 10) || 0;
      }
      if (lRes.status === 'fulfilled' && lRes.value.ok) {
        const d = await lRes.value.json();
        leadsCount = parseInt(d.value, 10) || 0;
      }
    } catch (cloudErr) {
      console.warn('[STATS] Cloud counter fetch failed:', cloudErr.message);
    }
  }

  const nonConvertedCount = Math.max(0, visitsCount - leadsCount);
  const conversionRate = visitsCount > 0 ? ((leadsCount / visitsCount) * 100).toFixed(2) : '0.00';

  return {
    date: dateStr,
    visitsCount,
    leadsCount,
    nonConvertedCount,
    conversionRate
  };
}

module.exports = {
  db,
  recordVisit,
  saveLead,
  getDailyStats
};
