// Мелкие помощники интерфейса: создание элементов, склонения, «голос» записок.
import config from '../../../config.js';
import { store } from '../store.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Создаёт элемент из HTML-строки. */
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Русские окончания: plural(3, ['звезда', 'звезды', 'звёзд']) → «звезды». */
export function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const any = list => list[Math.floor(Math.random() * list.length)];

export const voice = {
  her: () => any(config.her),
  /** Обращение, постоянное в течение дня (для приветствия). */
  herToday() {
    const d = new Date();
    const n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    return config.her[n % config.her.length];
  },
  sign: () => config.signature(any(config.him)),
  /** Подставляет обращение вместо {her} / {Her}. */
  fill(text) {
    const name = this.her();
    return String(text).replace(/\{Her\}/g, cap(name)).replace(/\{her\}/g, name);
  },
  note(kind) { return this.fill(store.pick(kind, config.notes[kind])); },
  daily() {
    const d = new Date();
    const n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    return config.notes.daily[n % config.notes.daily.length];
  },
  greeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Доброе утро';
    if (hour >= 12 && hour < 18) return 'Добрый день';
    if (hour >= 18 && hour < 23) return 'Добрый вечер';
    return 'Доброй ночи';
  },
};

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Небольшое всплывающее сообщение внизу экрана. */
export function toast(message, ms = 2600) {
  document.querySelector('.toast')?.remove();
  const el = h(`<div class="toast" role="status">${esc(message)}</div>`);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 300); }, ms);
}

/** Детерминированный генератор случайных чисел — чтобы звёзды стояли на своих местах. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const icons = {
  back: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M6 4.2v11.6a.8.8 0 0 0 1.2.7l9.3-5.8a.8.8 0 0 0 0-1.4L7.2 3.5a.8.8 0 0 0-1.2.7Z" fill="currentColor"/></svg>',
  bulb: '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="M10 2.5a5.5 5.5 0 0 0-3.2 10c.5.4.8 1 .8 1.6v.4h4.8v-.4c0-.6.3-1.2.8-1.6A5.5 5.5 0 0 0 10 2.500ZM8 17.200h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reset: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.500M4 3.500v3.300h3.300" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gift: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3.500 9.500h13v6.300a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V9.500ZM2.500 6.500h15v3h-15zM10 6.500v10.300M10 6.500C8.500 6.500 6.300 6 6.300 4.300c0-1 .8-1.600 1.700-1.600 1.500 0 2 2.300 2 3.800Zm0 0c1.500 0 3.700-.500 3.700-2.200 0-1-.8-1.600-1.700-1.600-1.500 0-2 2.300-2 3.800Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="2.600" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 2.500v2M10 15.500v2M2.500 10h2M15.500 10h2M4.700 4.700l1.400 1.400M13.900 13.900l1.400 1.400M4.700 15.300l1.400-1.400M13.900 6.100l1.400-1.400" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  lock: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><rect x="4.500" y="9" width="11" height="8" rx="1.800" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 9V6.800a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="m4.500 10.500 3.500 3.500 7.500-8" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cross: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="m5.500 5.500 9 9m0-9-9 9" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 1.500c.600 4.600 2.300 6.900 8.500 8.500-6.200 1.600-7.900 3.900-8.500 8.500-.600-4.600-2.300-6.900-8.500-8.500 6.200-1.600 7.900-3.900 8.500-8.500Z" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  // Силуэт стрижа: серповидные крылья и вильчатый хвост
  swift: '<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M2 5c11 1 20 5 27 13 2-7 9-13 21-16-7 5-11 11-12 18l10 2c5 1 9 4 14 9-6-3-11-4-16-4l-6 1c-4 5-9 8-16 10 4-3 7-6 8-10-6-1-10-4-13-8-4-6-9-11-17-15Z" fill="currentColor"/></svg>',
};
