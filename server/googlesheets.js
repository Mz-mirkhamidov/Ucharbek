// Google Sheets Integration for Ucharbek Leads
// Automatically appends new leads to Google Spreadsheet

async function appendLeadToGoogleSheet(lead) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const spreadsheetId = '14xQTp7nJuIQQjNadl1lwIm7824-joeVR_gWz53vgp2E';

  const rowData = {
    spreadsheet_id: spreadsheetId,
    created_at: new Date(Date.now() + 5 * 3600 * 1000).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' }),
    name: lead.name,
    phone: lead.phone,
    destination: lead.destination,
    language: lead.language || 'uz',
    utm_source: lead.utm_source || 'direct',
    utm_campaign: lead.utm_campaign || '',
    utm_medium: lead.utm_medium || '',
    utm_term: lead.utm_term || '',
    referrer: lead.referrer || 'direct'
  };

  if (!webhookUrl || webhookUrl.includes('YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL')) {
    console.log('[GOOGLE SHEETS] Webhook URL not set in .env yet.');
    console.log('[GOOGLE SHEETS] Data prepared for sheet:', rowData);
    return { success: true, simulated: true, data: rowData };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowData)
    });

    const result = await response.text();
    console.log('[GOOGLE SHEETS] Sync result:', result);
    return { success: true, result };
  } catch (err) {
    console.error('[GOOGLE SHEETS] Sync error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  appendLeadToGoogleSheet
};
