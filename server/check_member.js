const token = '8470184237:AAEt5xECCzVrUOqZF2mF8GdlPkE78oP8_ng';
const groupId = '-1004491595905';
const userId = '552003748';

async function checkMember() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${groupId}&user_id=${userId}`);
  const data = await res.json();
  console.log('Member Info for 552003748:', JSON.stringify(data, null, 2));
}
checkMember();
