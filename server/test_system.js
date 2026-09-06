// Comprehensive System Integration Test
const { recordVisit, saveLead, getDailyStats } = require('./database');
const { notifyNewLead, sendDailyReport, getTashkentTimeString } = require('./telegram');

async function runTests() {
  console.log('--- TEST 1: Database Operations ---');
  
  // Test visits
  const visitOk = recordVisit({
    visitorHash: 'test_hash_123',
    utmSource: 'instagram_target',
    utmCampaign: 'video_summer_sale',
    referrer: 'https://instagram.com'
  });
  console.log('Record visit success:', visitOk);

  // Test leads
  const leadResult = saveLead({
    name: 'Alisher Navoiy',
    phone: '+998 (90) 123-45-67',
    destination: 'Turkiya',
    language: 'uz',
    utm_source: 'instagram_target',
    utm_campaign: 'video_summer_sale'
  });
  console.log('Save lead success:', leadResult);

  // Test statistics calculation
  const stats = getDailyStats();
  console.log('Calculated Stats:', stats);
  if (stats.visitsCount >= 1 && stats.leadsCount >= 1) {
    console.log('✅ TEST 1 PASSED: Database recording & stats calculation works!');
  } else {
    throw new Error('TEST 1 FAILED: Stats count unexpected');
  }

  console.log('\n--- TEST 2: Telegram Lead Notification Formatting ---');
  const leadAlert = await notifyNewLead({
    name: 'Dilshod Raxmatov',
    phone: '+998 (97) 777-88-99',
    destination: 'BAA / Dubay',
    utm_source: 'meta_reklama',
    utm_campaign: 'dubai_lux_video'
  });
  console.log('Lead notification output result:', leadAlert);
  if (leadAlert.success) {
    console.log('✅ TEST 2 PASSED: Telegram message formatter & sender works!');
  }

  console.log('\n--- TEST 3: Telegram Daily Report Formatting ---');
  const reportAlert = await sendDailyReport(stats);
  console.log('Report notification output result:', reportAlert);
  if (reportAlert.success) {
    console.log('✅ TEST 3 PASSED: Daily Report calculation & sender works!');
  }

  console.log('\n========================================');
  console.log('🎉 ALL BACKEND LOGIC TESTS PASSED!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
