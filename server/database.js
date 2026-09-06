// SQLite Database Layer using Node.js Built-in SQLite (DatabaseSync)
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'ucharbek.db');
const db = new DatabaseSync(DB_PATH);

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

/**
 * Record a unique or returning visit
 */
function recordVisit({ visitorHash, utmSource, utmCampaign, referrer }) {
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
 * Uses Tashkent time (+5 hours)
 */
function getDailyStats(targetDate) {
  // Format: YYYY-MM-DD
  const dateStr = targetDate || new Date(Date.now() + 5 * 3600 * 1000).toISOString().split('T')[0];

  const visitsStmt = db.prepare(`
    SELECT COUNT(*) as count FROM visits 
    WHERE date(created_at) = ?
  `);
  const visitsRow = visitsStmt.get(dateStr);
  const visitsCount = visitsRow ? visitsRow.count : 0;

  const leadsStmt = db.prepare(`
    SELECT COUNT(*) as count FROM leads 
    WHERE date(created_at) = ?
  `);
  const leadsRow = leadsStmt.get(dateStr);
  const leadsCount = leadsRow ? leadsRow.count : 0;

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
