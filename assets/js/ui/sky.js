// Небо на главной странице. Оно — карта прогресса:
// каждая решённая задача зажигает звезду, а чем дальше по курсу, тем ближе рассвет.
import { seeded, icons, esc } from './util.js';

// Цвета неба (верх, середина, горизонт) для доли пройденного курса
const STOPS = [
  [0.00, '#100D25', '#1C163F', '#2A2056'],
  [0.25, '#15113A', '#2A1F5C', '#4A2F73'],
  [0.50, '#1D1A54', '#4A2F7E', '#A2507F'],
  [0.75, '#2C3788', '#8B5AA6', '#F08A7B'],
  [1.00, '#6FA4EC', '#F4B7B0', '#FFDF9E'],
];
const HILLS = [
  [0.00, '#1B1640', '#130F2E'],
  [0.50, '#33235F', '#211846'],
  [0.75, '#5B3F86', '#3A2A6A'],
  [1.00, '#8E7BC4', '#5F4D9C'],
];

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
const luminance = c => { const [r, g, b] = hex(c).map(v => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

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
  el.style.setProperty('--hill-near', sample(HILLS, p, 2));
  el.style.setProperty('--night', String(Math.max(0, 1 - p * 1.25).toFixed(3)));
  el.style.setProperty('--sun', String(Math.max(0, (p - 0.35) / 0.65).toFixed(3)));
  // стриж летит над холмами слева направо — ниже текста, чтобы его не закрывать
  el.style.setProperty('--bird-x', `${(30 + p * 56).toFixed(2)}%`);
  el.style.setProperty('--bird-lift', (0.5 + Math.sin(p * Math.PI) * 0.5).toFixed(3));
  el.classList.toggle('is-day', luminance(mix(top, mid, 0.5)) > 0.5);

  const rnd = seeded(20261113);
  const stars = tasks.map((t, i) => {
    // звёзды раскладываются по небу равномерно, но «неровно»
    const x = 3 + rnd() * 94;
    const y = 5 + rnd() * 56;
    const size = 7 + rnd() * 9;
    const delay = (rnd() * 5).toFixed(2);
    return t.solved
      ? `<span class="star is-lit" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--size:${size.toFixed(1)}px;--d:${delay}s" title="${esc(t.title)}">${icons.star}</span>`
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
