// Scheduled Job for Daily Reports (Tashkent Time UTC+5)
const { getDailyStats } = require('./database');
const { sendDailyReport } = require('./telegram');

let lastReportDate = null;

/**
 * Trigger immediate report (useful for testing and API triggers)
 */
async function triggerReportNow(targetDate = null) {
  try {
    const stats = getDailyStats(targetDate);
    console.log('[CRON] Generating report for:', stats.date);
    const result = await sendDailyReport(stats);
    return { success: true, stats, result };
  } catch (err) {
    console.error('[CRON] Error sending report:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Start the daily scheduler
 */
function initCronScheduler() {
  const reportTime = process.env.REPORT_TIME || '21:00'; // HH:MM
  console.log(`[CRON] Scheduler active. Daily report scheduled at ${reportTime} (Tashkent Time UTC+5).`);

  // Check every 30 seconds
  setInterval(async () => {
    // Current Tashkent time
    const nowUtc5 = new Date(Date.now() + 5 * 3600 * 1000);
    const hours = String(nowUtc5.getUTCHours()).padStart(2, '0');
    const minutes = String(nowUtc5.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const currentDate = nowUtc5.toISOString().split('T')[0];

    if (currentTime === reportTime && lastReportDate !== currentDate) {
      lastReportDate = currentDate;
      console.log(`[CRON] Scheduled time reached (${reportTime}). Sending daily report for ${currentDate}...`);
      await triggerReportNow(currentDate);
    }
  }, 30000);
}

module.exports = {
  initCronScheduler,
  triggerReportNow
};
