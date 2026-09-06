const token = '8470184237:AAEt5xECCzVrUOqZF2mF8GdlPkE78oP8_ng';

async function checkUpdates() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data = await res.json();
  console.log('Updates Count:', data.result ? data.result.length : 0);
  if (data.result && data.result.length > 0) {
    data.result.forEach(u => {
      if (u.message) {
        console.log('Update from chat ID:', u.message.chat.id, 'type:', u.message.chat.type, 'from:', u.message.from);
      }
    });
  } else {
    console.log('No updates found in queue.');
  }
}
checkUpdates();
