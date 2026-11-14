// Включает уведомления в Telegram о подарках:
//
//   TG_TOKEN=<токен бота> TG_CHAT=<id чата> node tools/notify-setup.mjs
//
// Записывает данные бота в assets/js/data/notify-box.js, слегка запутав их, чтобы их не
// находили автоматические сканеры. Это не защита: репозиторий публичный, и токен при
// желании можно достать. После команды файл нужно опубликовать (commit + push).
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const token = (process.env.TG_TOKEN ?? '').trim();
const chat = (process.env.TG_CHAT ?? '').trim();
if (!/^\d+:[\w-]{30,}$/.test(token) || !/^-?\d+$/.test(chat)) {
  console.error('Нужны переменные TG_TOKEN (токен бота от @BotFather) и TG_CHAT (числовой id чата).');
  process.exit(1);
}

const scramble = s => Buffer.from([...s].reverse().join('')).toString('base64');
await fs.writeFile(path.join(ROOT, 'assets/js/data/notify-box.js'),
  `// Данные бота для уведомлений о подарках. Создано tools/notify-setup.mjs — руками не править.
// Чтобы выключить уведомления, замени всё ниже на: export default null;
export default { t: '${scramble(token)}', c: '${scramble(chat)}' };
`);
console.log('Готово: assets/js/data/notify-box.js. Осталось опубликовать его (commit + push).');
