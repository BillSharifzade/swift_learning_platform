#!/usr/bin/env node
// Скачивает картинки подарков (Fluent Emoji 3D, лицензия MIT) в assets/gifts/.
// Нужен только при добавлении новых подарков в assets/js/data/gifts.js.
//   node tools/fetch-gifts.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { GIFTS, MODULE_GIFTS, FINAL_GIFT, giftSlug } from '../assets/js/data/gifts.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'assets/gifts');
const BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets';
await fs.mkdir(OUT, { recursive: true });

const all = [...GIFTS, ...MODULE_GIFTS, FINAL_GIFT];
const seen = new Set();
let ok = 0, skipped = 0;
const failed = [];
for (const [name] of all) {
  const slug = giftSlug(name);
  if (seen.has(slug)) { failed.push(`${name}: повтор`); continue; }
  seen.add(slug);
  const file = path.join(OUT, `${slug}.png`);
  try { await fs.access(file); skipped++; continue; } catch { /* ещё не скачано */ }
  const fileName = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_3d.png';
  const url = `${BASE}/${encodeURIComponent(name)}/3D/${fileName}`;
  let res = await fetch(url);
  if (!res.ok) {
    // в некоторых именах файлов дефис сохраняется: front-facing_baby_chick_3d.png
    const alt = name.toLowerCase().replace(/ /g, '_') + '_3d.png';
    res = await fetch(`${BASE}/${encodeURIComponent(name)}/3D/${alt}`);
  }
  if (!res.ok) { failed.push(`${name}: ${res.status} ${url}`); continue; }
  await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
  ok++;
}
console.log(`Скачано: ${ok}, уже было: ${skipped}, всего подарков: ${all.length}`);
if (failed.length) { console.log('Не получилось:\n  ' + failed.join('\n  ')); process.exit(1); }
