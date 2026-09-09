const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('TELEGRAM_BOT_TOKEN env var is not set. Run with: TELEGRAM_BOT_TOKEN=xxx node test_report_direct.js'); process.exit(1); }
const chatId = '552003748';

async function testReportDirect() {
  const testMsg = '<b>📊 Ucharbek — Kunlik hisobot tizimi tekshiruvi</b>\n\nHisobotlar har kuni 21:00 da aynan shu chatga (ID: 552003748) avtomatik yuboriladi.\n\n👀 <b>Sahifaga tashrif:</b> 4\n✅ <b>Ariza qoldirganlar:</b> 3\n❌ <b>Kirib, ariza qoldirmaganlar:</b> 1\n📈 <b>Konversiya:</b> 75.00%';
  const sendRes = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: testMsg,
      parse_mode: 'HTML'
    })
  });
  const sendData = await sendRes.json();
  console.log('Send Message result to 552003748:', JSON.stringify(sendData, null, 2));
}
testReportDirect();
