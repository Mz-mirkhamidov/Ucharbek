const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('TELEGRAM_BOT_TOKEN env var is not set. Run with: TELEGRAM_BOT_TOKEN=xxx node check_updates2.js'); process.exit(1); }

async function checkOffset() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-10&limit=10`);
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}
checkOffset();
