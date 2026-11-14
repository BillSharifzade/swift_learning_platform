// Включает уведомления в Telegram о подарках.
//
//   TG_TOKEN=<токен бота> TG_CHAT=<id чата> node tools/notify-setup.mjs
//
// Репозиторий публичный, поэтому токен в него не попадает. Команда:
//   1. шифрует токен и id чата случайным ключом (AES-256-GCM) и пишет результат
//      в assets/js/data/notify-box.js — этот файл можно публиковать;
//   2. печатает личную ссылку с ключом и сохраняет её в .private/notify-link.txt
//      (папка .private в репозиторий не попадает).
// Ссылку нужно один раз открыть в том браузере, где она учится. Каждый запуск создаёт
// новый ключ: старая ссылка перестаёт работать, а новую нужно открыть заново.
import fs from 'node:fs/promises';
import path from 'node:path';
import { webcrypto as crypto } from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const token = (process.env.TG_TOKEN ?? '').trim();
const chat = (process.env.TG_CHAT ?? '').trim();
if (!/^\d+:[\w-]{30,}$/.test(token) || !/^-?\d+$/.test(chat)) {
  console.error('Нужны переменные TG_TOKEN (токен бота от @BotFather) и TG_CHAT (числовой id чата).');
  process.exit(1);
}

const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
const site = (process.argv[2] ?? pkg.homepage ?? '').replace(/\/?$/, '/');
if (!/^https?:\/\//.test(site)) {
  console.error('Не знаю адрес сайта: добавь "homepage" в package.json или передай адрес аргументом.');
  process.exit(1);
}

const b64 = bytes => Buffer.from(bytes).toString('base64url');
const rawKey = crypto.getRandomValues(new Uint8Array(32));
const iv = crypto.getRandomValues(new Uint8Array(12));
const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ t: token, c: chat })));

await fs.writeFile(path.join(ROOT, 'assets/js/data/notify-box.js'),
  `// Зашифрованные данные бота для уведомлений. Создано tools/notify-setup.mjs — руками не править.
// Без ключа из личной ссылки этот файл бесполезен, поэтому его можно публиковать.
export default { iv: '${b64(iv)}', data: '${b64(new Uint8Array(data))}' };
`);

const link = `${site}#/hello/${b64(rawKey)}`;
await fs.mkdir(path.join(ROOT, '.private'), { recursive: true });
await fs.writeFile(path.join(ROOT, '.private/notify-link.txt'), link + '\n', { mode: 0o600 });

console.log('Готово. Зашифрованный файл: assets/js/data/notify-box.js — его нужно опубликовать (commit + push).');
console.log('Личная ссылка сохранена в .private/notify-link.txt');
