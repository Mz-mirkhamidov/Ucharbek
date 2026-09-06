const token = '8470184237:AAEt5xECCzVrUOqZF2mF8GdlPkE78oP8_ng';

async function checkOffset() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-10&limit=10`);
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}
checkOffset();
