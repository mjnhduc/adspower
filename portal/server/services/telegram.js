const axios = require('axios');

function send(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.resolve();

  return axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  }).catch((err) => {
    console.error('Telegram send error:', err.message);
  });
}

function buildReport({ checkedAt, total, alive, dead, replaced, skipped }) {
  const time = new Date(checkedAt).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' });

  let msg = `<b>🔍 AdsPower Proxy Check</b>\n`;
  msg += `🕐 ${time} (GMT+7)\n\n`;
  msg += `📊 <b>Summary</b>\n`;
  msg += `• Total profiles: ${total}\n`;
  msg += `• Alive: ${alive} ✅\n`;
  msg += `• Dead: ${dead} ❌\n`;
  msg += `• Replaced: ${replaced.length} 🔄\n`;

  if (skipped.length > 0) {
    msg += `• Skipped (no proxy available): ${skipped.length} ⚠️\n`;
  }

  if (replaced.length > 0) {
    msg += `\n🔄 <b>Replaced</b>\n`;
    for (const r of replaced) {
      msg += `• ${r.name} → <code>${r.newProxy}</code>\n`;
    }
  }

  if (skipped.length > 0) {
    msg += `\n⚠️ <b>Skipped (still dead)</b>\n`;
    for (const s of skipped) {
      msg += `• ${s.name} — no available proxy in pool\n`;
    }
  }

  return msg;
}

module.exports = { send, buildReport };
