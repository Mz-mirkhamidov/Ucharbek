// Scheduled Job for Daily Reports (Tashkent Time UTC+5)
const { getDailyStats } = require('./database');
const { sendDailyReport } = require('./telegram');

let lastReportDate = null;

function getYesterdayTashkentDate() {
  const nowUtc5 = new Date(Date.now() + 5 * 3600 * 1000);
  const yesterdayUtc5 = new Date(nowUtc5.getTime() - 24 * 3600 * 1000);
  return yesterdayUtc5.toISOString().split('T')[0];
}

/**
 * Trigger report for a specific date (defaults to YESTERDAY for complete 24h stats)
 */
async function triggerReportNow(targetDate = null) {
  try {
    const reportDate = targetDate || getYesterdayTashkentDate();
    const stats = await getDailyStats(reportDate);
    console.log('[CRON] Generating 24h report for date:', stats.date);
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
  const reportTime = process.env.REPORT_TIME || '00:01'; // HH:MM (Tashkent time)
  console.log(`[CRON] Scheduler active. Daily report scheduled at ${reportTime} (Tashkent Time UTC+5).`);

  // Check every 30 seconds
  setInterval(async () => {
    // Current Tashkent time
    const nowUtc5 = new Date(Date.now() + 5 * 3600 * 1000);
    const hours = String(nowUtc5.getUTCHours()).padStart(2, '0');
    const minutes = String(nowUtc5.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const currentDate = nowUtc5.toISOString().split('T')[0];

    // Trigger only at scheduled time (e.g. 00:01) once per day
    if (currentTime === reportTime && lastReportDate !== currentDate) {
      lastReportDate = currentDate;
      const yesterdayDate = getYesterdayTashkentDate();
      console.log(`[CRON] 00:01 reached! Sending full 24h daily report for yesterday: ${yesterdayDate}...`);
      await triggerReportNow(yesterdayDate);
    }
  }, 30000);
}

module.exports = {
  initCronScheduler,
  triggerReportNow,
  getYesterdayTashkentDate
};
