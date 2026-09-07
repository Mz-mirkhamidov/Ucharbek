// Ucharbek High-Conversion Landing Server
// Built with Node.js native HTTP & SQLite (zero external npm dependencies required)

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const { recordVisit, saveLead, getDailyStats } = require('./database');
const { notifyNewLead } = require('./telegram');
const { appendLeadToGoogleSheet } = require('./googlesheets');
const { initCronScheduler, triggerReportNow } = require('./cron');

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, '../public');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Body payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

// HTTP Request Handler
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // -------------------------------------------------------------
  // API ROUTE: Record Visit (/api/visit)
  // -------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/visit') {
    try {
      const data = await parseJsonBody(req);
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const visitorHash = crypto.createHash('sha256').update(ip + userAgent).digest('hex').substring(0, 16);

      recordVisit({
        visitorHash,
        utmSource: data.utm_source,
        utmCampaign: data.utm_campaign,
        referrer: data.referrer
      });

      return sendJsonResponse(res, 200, { success: true });
    } catch (err) {
      return sendJsonResponse(res, 400, { success: false, error: err.message });
    }
  }

  // -------------------------------------------------------------
  // API ROUTE: Submit Lead (/api/lead)
  // -------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/lead') {
    try {
      const data = await parseJsonBody(req);

      // 1. Anti-spam honeypot check
      if (data.honeypot || data.website) {
        console.warn('[SECURITY] Bot detected via honeypot field.');
        return sendJsonResponse(res, 200, { success: true, message: 'Received' });
      }

      // 2. Validate required fields
      if (!data.name || !data.phone || !data.destination) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Barcha majburiy maydonlarni to\'ldiring (Ism, Telefon, Yo\'nalish)'
        });
      }

      // 3. Save to SQLite database
      const saveResult = saveLead(data);
      if (!saveResult.success) {
        return sendJsonResponse(res, 500, { success: false, error: 'Database error' });
      }

      // 4. Send real-time Telegram notification & Google Sheets sync
      // Run asynchronously without blocking client response
      notifyNewLead(data).catch(err => console.error('[TELEGRAM] Lead alert error:', err));
      appendLeadToGoogleSheet(data).catch(err => console.error('[GOOGLE SHEETS] Sync error:', err));

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Arizangiz qabul qilindi, tez orada bog\'lanamiz!'
      });
    } catch (err) {
      console.error('Lead route error:', err);
      return sendJsonResponse(res, 500, { success: false, error: err.message });
    }
  }

  // -------------------------------------------------------------
  // API ROUTE: Get Statistics (/api/stats)
  // -------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/stats') {
    const stats = await getDailyStats();
    return sendJsonResponse(res, 200, stats);
  }

  // -------------------------------------------------------------
  // API ROUTE: Trigger Test Report (/api/report/test)
  // -------------------------------------------------------------
  if ((req.method === 'POST' || req.method === 'GET') && pathname === '/api/report/test') {
    const result = await triggerReportNow();
    return sendJsonResponse(res, 200, result);
  }

  // -------------------------------------------------------------
  // STATIC FILE SERVING
  // -------------------------------------------------------------
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing or 404
      if (pathname !== '/favicon.ico') {
        filePath = path.join(PUBLIC_DIR, 'index.html');
      } else {
        res.writeHead(404);
        return res.end();
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end('Server File Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Start Server & Scheduler
server.listen(PORT, () => {
  console.log('====================================================');
  console.log('✈️  UCHARBEK TRAVEL - LANDING PAGE & BACKEND RUNNING');
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📊 Test Stats: http://localhost:${PORT}/api/stats`);
  console.log(`📨 Test Report: http://localhost:${PORT}/api/report/test`);
  console.log('====================================================');

  initCronScheduler();
});
