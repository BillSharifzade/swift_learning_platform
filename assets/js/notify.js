// Сообщение в Telegram, когда она получает подарок.
//
// Репозиторий публичный, поэтому токена бота в нём нет. В data/notify-box.js лежит
// только зашифрованная «коробка» (AES-GCM), а ключ к ней приходит в личной ссылке
// вида …/#/hello/<ключ> и остаётся в браузере. Без ключа коробку не открыть.
// Настройка: node tools/notify-setup.mjs
import box from './data/notify-box.js';
import config from '../../config.js';

const KEY = 'blp.notify.key';
const QUEUE = 'blp.notify.queue';
const MAX_QUEUE = 30;
const LATE_MS = 15 * 60 * 1000;

const fromB64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

let creds = null; // { t: токен, c: чат } — расшифровывается один раз за сеанс

async function unlock() {
  if (creds) return creds;
  if (!box || !globalThis.crypto?.subtle) return null;
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { return null; }
  if (!raw) return null;
  try {
    const key = await crypto.subtle.importKey('raw', fromB64(raw), 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.data));
    creds = JSON.parse(new TextDecoder().decode(plain));
  } catch {
    creds = null; // ключ от другой коробки (например, бота настроили заново)
  }
  return creds;
}

function readQueue() {
  try { const q = JSON.parse(localStorage.getItem(QUEUE) ?? '[]'); return Array.isArray(q) ? q : []; } catch { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(QUEUE, JSON.stringify(q.slice(-MAX_QUEUE))); } catch { /* хранилище недоступно */ }
}
function enqueue(text) {
  writeQueue([...readQueue(), { text, at: Date.now() }]);
}

let flushing = null;

/** Отправляет всё, что накопилось. Не получилось — сообщения подождут следующего раза. */
export function flushNotifications() {
  flushing ??= (async () => {
    try {
      const c = await unlock();
      if (!c) return;
      for (;;) {
        const item = readQueue()[0];
        if (!item) break;
        let text = String(item.text ?? '');
        if (Date.now() - item.at > LATE_MS) {
          const when = new Date(item.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          text += `\n(this happened on ${when}; the message was delayed)`;
        }
        const res = await fetch(`https://api.telegram.org/bot${c.t}/sendMessage`, {
          method: 'POST',
          body: new URLSearchParams({ chat_id: String(c.c), text, disable_web_page_preview: 'true' }),
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
 * Забирает ключ из личной ссылки (…/#/hello/<ключ>) и сразу убирает его из адреса.
 * Вызывается до первого перехода, чтобы адрес с ключом не попал в историю.
 */
export function installNotifyKey() {
  const m = /^#\/hello\/([A-Za-z0-9_-]{20,})$/.exec(location.hash);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search + '#/');
  if (!box) return;
  try {
    const had = localStorage.getItem(KEY);
    localStorage.setItem(KEY, m[1]);
    creds = null;
    if (had !== m[1]) enqueue(`✅ ${config.title}\nNotifications are on for this browser. You will get a message here every time she receives a gift.`);
  } catch { /* хранилище недоступно — уведомлений с этого устройства не будет */ }
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
  enqueue(lines.join('\n'));
  flushNotifications();
}
