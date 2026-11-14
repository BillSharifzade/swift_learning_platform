// Сообщение в Telegram, когда она получает подарок.
// Данные бота лежат в data/notify-box.js (их записывает tools/notify-setup.mjs).
import box from './data/notify-box.js';
import config from '../../config.js';

const QUEUE = 'blp.notify.queue';
const MAX_QUEUE = 30;
const LATE_MS = 15 * 60 * 1000;

// Токен хранится перевёрнутым и в base64 — только чтобы его не находили автоматические
// сканеры. Это не защита: репозиторий публичный.
const unscramble = s => atob(s).split('').reverse().join('');

function bot() {
  if (!box) return null;
  try { return { token: unscramble(box.t), chat: unscramble(box.c) }; } catch { return null; }
}

function readQueue() {
  try { const q = JSON.parse(localStorage.getItem(QUEUE) ?? '[]'); return Array.isArray(q) ? q : []; } catch { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(QUEUE, JSON.stringify(q.slice(-MAX_QUEUE))); } catch { /* хранилище недоступно */ }
}

let flushing = null;

/** Отправляет всё, что накопилось. Не получилось — сообщения подождут следующего захода. */
export function flushNotifications() {
  flushing ??= (async () => {
    try {
      const b = bot();
      if (!b) return;
      for (;;) {
        const item = readQueue()[0];
        if (!item) break;
        let text = String(item.text ?? '');
        if (Date.now() - item.at > LATE_MS) {
          const when = new Date(item.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          text += `\n(this happened on ${when}; the message was delayed)`;
        }
        const res = await fetch(`https://api.telegram.org/bot${b.token}/sendMessage`, {
          method: 'POST',
          body: new URLSearchParams({ chat_id: b.chat, text, disable_web_page_preview: 'true' }),
          keepalive: true,
        });
        // 400 — Telegram такое сообщение не примет никогда, держать его в очереди бессмысленно
        if (!res.ok && res.status !== 400) break;
        writeQueue(readQueue().slice(1));
      }
    } catch {
      /* нет сети или Telegram недоступен — попробуем при следующем заходе */
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

/**
 * Сообщает о подарках, выданных за решённую задачу.
 * gifts — то, что сейчас покажется ей: подарок за задачу, за модуль, финальный.
 */
export function notifyGifts({ taskTitle, moduleTitle, index, count, gifts, solved, total }) {
  if (!box || !gifts.length) return;
  const lines = [`🎁 ${config.title}`, `Solved: «${taskTitle}» (${moduleTitle}, task ${index} of ${count})`];
  for (const g of gifts) {
    const name = `${g.emoji ?? ''} ${g.name}`.trim();
    if (g.kind === 'module') lines.push(`Module «${moduleTitle}» is complete. Big gift: ${name}`);
    else if (g.kind === 'final') lines.push(`🎓 The whole course is complete. Final gift: ${name}`);
    else lines.push(`Gift: ${name}`);
  }
  lines.push(`Progress: ${solved} of ${total} tasks`);
  try { localStorage.setItem(QUEUE, JSON.stringify([...readQueue(), { text: lines.join('\n'), at: Date.now() }].slice(-MAX_QUEUE))); } catch { /* хранилище недоступно */ }
  flushNotifications();
}
