const token = '8470184237:AAEt5xECCzVrUOqZF2mF8GdlPkE78oP8_ng';

async function check() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();
  console.log('Webhook info:', JSON.stringify(data, null, 2));
}
check();
