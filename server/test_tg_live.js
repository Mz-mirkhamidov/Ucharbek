const token = '8470184237:AAEt5xECCzVrUOqZF2mF8GdlPkE78oP8_ng';
const chatId = '-1004491595905';

async function testTelegram() {
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    console.log('Bot Info:', meData);

    const testMsg = '<b>✈️ Ucharbek Tizimi Ulanganligi Testi</b>\n\nBot muvaffaqiyatli ulandi! Endi barcha arizalar shu guruhga tushadi.';
    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMsg,
        parse_mode: 'HTML'
      })
    });
    const sendData = await sendRes.json();
    console.log('Send Message result:', sendData);

    if (!sendData.ok) {
      // Check updates to find chat id
      const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const updatesData = await updatesRes.json();
      console.log('Recent Updates (to check chat ID):', JSON.stringify(updatesData, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
testTelegram();
