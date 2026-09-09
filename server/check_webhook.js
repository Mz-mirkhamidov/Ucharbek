const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('TELEGRAM_BOT_TOKEN env var is not set. Run with: TELEGRAM_BOT_TOKEN=xxx node check_webhook.js'); process.exit(1); }

async function check() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();
  console.log('Webhook info:', JSON.stringify(data, null, 2));
}
check();
