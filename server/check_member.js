const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('TELEGRAM_BOT_TOKEN env var is not set. Run with: TELEGRAM_BOT_TOKEN=xxx node check_member.js'); process.exit(1); }
const groupId = '-1004491595905';
const userId = '552003748';

async function checkMember() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${groupId}&user_id=${userId}`);
  const data = await res.json();
  console.log('Member Info for 552003748:', JSON.stringify(data, null, 2));
}
checkMember();
