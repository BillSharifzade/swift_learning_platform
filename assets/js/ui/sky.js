// Небо на главной странице. Оно — карта прогресса:
// каждая решённая задача зажигает звезду, а чем дальше по курсу, тем ближе рассвет.
import { seeded, icons, esc } from './util.js';

// Цвета неба (верх, середина, горизонт) для доли пройденного курса.
// Небо всегда остаётся тёмным: с прогрессом над горизонтом разгорается мятно-голубой рассвет.
const STOPS = [
  [0.00, '#050608', '#080B10', '#0D141B'],
  [0.25, '#050709', '#0A1017', '#111F2A'],
  [0.50, '#06080C', '#0C1620', '#16313F'],
  [0.75, '#070A10', '#102131', '#1F5160'],
  [1.00, '#080D15', '#143247', '#3A8C8E'],
];
const HILLS = [
  [0.00, '#0E1217'],
  [0.50, '#101A21'],
  [1.00, '#13262C'],
];
// Зажжённые звёзды — её цветами
const STAR_COLORS = ['#8CE5C1', '#A6DBFC', '#FFFFFF', '#7CC8F8', '#B6F1DA'];

const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => {
  const x = hex(a), y = hex(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
function sample(stops, p, col) {
  let i = 0;
  while (i < stops.length - 2 && p > stops[i + 1][0]) i++;
  const a = stops[i], b = stops[i + 1];
  const t = Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0])));
  return mix(a[col], b[col], t);
}

/**
 * Рисует небо в элементе.
 * tasks: [{ title, solved }] — по порядку курса; каждая задача — своя звезда.
 */
export function renderSky(el, tasks) {
  const total = Math.max(1, tasks.length);
  const solved = tasks.filter(t => t.solved).length;
  const p = solved / total;

  const top = sample(STOPS, p, 1), mid = sample(STOPS, p, 2), bot = sample(STOPS, p, 3);
  el.style.setProperty('--sky-top', top);
  el.style.setProperty('--sky-mid', mid);
  el.style.setProperty('--sky-bot', bot);
  el.style.setProperty('--hill-far', sample(HILLS, p, 1));
  el.style.setProperty('--night', String(Math.max(0, 1 - p * 1.25).toFixed(3)));
  el.style.setProperty('--sun', String(Math.max(0, (p - 0.35) / 0.65).toFixed(3)));
  // птица летит над холмами слева направо — ниже текста, чтобы его не закрывать
  el.style.setProperty('--bird-x', `${(30 + p * 56).toFixed(2)}%`);
  el.style.setProperty('--bird-lift', (0.5 + Math.sin(p * Math.PI) * 0.5).toFixed(3));

  const rnd = seeded(20261113);
  const stars = tasks.map((t, i) => {
    // звёзды раскладываются по небу равномерно, но «неровно»
    const x = 3 + rnd() * 94;
    const y = 5 + rnd() * 56;
    const size = 7 + rnd() * 9;
    const delay = (rnd() * 5).toFixed(2);
    return t.solved
      ? `<span class="star is-lit" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--size:${size.toFixed(1)}px;--d:${delay}s;--c:${STAR_COLORS[i % STAR_COLORS.length]}" title="${esc(t.title)}">${icons.star}</span>`
      : `<span class="star" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%"></span>`;
  }).join('');

  el.querySelector('.sky-art')?.remove();
  const art = document.createElement('div');
  art.className = 'sky-art';
  art.setAttribute('aria-hidden', 'true');
  art.innerHTML = `
    <div class="sky-moon"></div>
    <div class="sky-sun"></div>
    <div class="sky-stars">${stars}</div>
    <svg class="sky-hills" viewBox="0 0 1200 160" preserveAspectRatio="none">
      <path class="hill-far" d="M0 96c90-34 170-46 260-30 96 17 150 52 250 44 110-9 160-70 280-74 110-4 170 40 250 46 70 5 120-12 160-26v130H0Z"/>
      <path class="hill-near" d="M0 128c120-30 210-40 330-24 110 15 180 42 300 34 130-8 200-52 330-50 100 2 170 26 240 30v42H0Z"/>
    </svg>
    <div class="sky-bird" title="Ты здесь">${icons.swift}</div>`;
  el.prepend(art);
  return { progress: p, solved, total };
}
