// Главная страница: небо с прогрессом и путь из модулей.
import config from '../../../config.js';
import { store } from '../store.js';
import { course } from '../course.js';
import { h, esc, plural, voice, icons, seeded, toast } from '../ui/util.js';
import { renderSky } from '../ui/sky.js';
import { renderMarkdown } from '../ui/md.js';

function constellation(module) {
  const n = module.exercises.length;
  const step = 26, pad = 13, height = 34;
  const rnd = seeded(module.number * 7919);
  const pts = module.exercises.map((e, i) => ({
    x: pad + i * step,
    y: height / 2 + (rnd() - 0.5) * 16,
    solved: store.isSolved(e.id),
    current: course.current()?.id === e.id,
  }));
  let lines = '';
  for (let i = 1; i < n; i++) {
    const a = pts[i - 1], b = pts[i];
    lines += `<line x1="${a.x}" y1="${a.y.toFixed(1)}" x2="${b.x}" y2="${b.y.toFixed(1)}" class="${a.solved && b.solved ? 'is-lit' : ''}"/>`;
  }
  const stars = pts.map(p => {
    if (p.solved) return `<path class="c-star" transform="translate(${p.x} ${p.y.toFixed(1)})" d="M0-7c.4 3.200 1.600 4.800 6 6-4.400 1.200-5.600 2.800-6 6-.4-3.200-1.600-4.800-6-6 4.400-1.200 5.600-2.800 6-6Z"/>`;
    if (p.current) return `<circle class="c-current" cx="${p.x}" cy="${p.y.toFixed(1)}" r="4.500"/>`;
    return `<circle class="c-dot" cx="${p.x}" cy="${p.y.toFixed(1)}" r="2.600"/>`;
  }).join('');
  const width = pad * 2 + (n - 1) * step;
  return `<svg class="constellation" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">${lines}${stars}</svg>`;
}

function taskRow(e) {
  const solved = store.isSolved(e.id);
  const unlocked = course.isUnlocked(e.id);
  const current = course.current()?.id === e.id;
  const state = solved ? 'is-solved' : current ? 'is-current' : unlocked ? 'is-open' : 'is-locked';
  const mark = solved ? icons.star : unlocked ? `<span class="task-num">${e.indexInModule + 1}</span>` : icons.lock;
  const inner = `
    <span class="task-state">${mark}</span>
    <span class="task-text"><span class="task-title">${esc(e.title)}</span><span class="task-concept">${esc(e.concept)}</span></span>
    ${current ? '<span class="task-here">ты здесь</span>' : ''}`;
  return unlocked
    ? `<li><a class="task-row ${state}" href="#/task/${e.id}">${inner}</a></li>`
    : `<li><span class="task-row ${state}" aria-disabled="true" title="Откроется после предыдущей задачи">${inner}</span></li>`;
}

function moduleCard(m, openId) {
  const solved = course.moduleSolved(m);
  const total = m.exercises.length;
  const done = solved === total;
  const locked = !course.isUnlocked(m.exercises[0].id);
  const open = m.id === openId;
  return `
    <section class="module ${done ? 'is-done' : ''} ${locked ? 'is-locked' : ''} ${open ? 'is-open' : ''}" data-module="${m.id}">
      <button type="button" class="module-head" aria-expanded="${open}" aria-controls="body-${m.id}">
        <span class="module-emoji" aria-hidden="true">${esc(m.emoji)}</span>
        <span class="module-titles">
          <span class="module-num">Модуль ${m.number}${done ? ' · пройден' : ''}</span>
          <span class="module-title">${esc(m.title)}</span>
          <span class="module-project">${esc(m.project)}</span>
        </span>
        <span class="module-side">
          ${constellation(m)}
          <span class="module-count"><b>${solved}</b> из ${total}</span>
        </span>
        <span class="module-chevron" aria-hidden="true">${icons.next}</span>
      </button>
      <div class="module-body" id="body-${m.id}" ${open ? '' : 'hidden'}>
        <p class="module-summary">${esc(m.summary)}</p>
        ${m.intro ? `<details class="module-about" ${open && solved === 0 && !locked ? 'open' : ''}><summary>О проекте, над которым ты работаешь в этом модуле</summary><div class="prose">${renderMarkdown(m.intro)}</div></details>` : ''}
        <ol class="task-list">${m.exercises.map(taskRow).join('')}</ol>
      </div>
    </section>`;
}

export function mountHome(root) {
  const cur = course.current();
  const solved = store.solvedCount();
  const total = course.total;
  const streak = store.streak();
  const started = solved > 0 || Object.keys(store.state.tasks).length > 0;
  const allDone = course.allDone();
  const openId = cur?.moduleId ?? course.modules[course.modules.length - 1]?.id;
  const giftCount = store.state.gifts.length;

  const left = total - solved;
  let statLine;
  if (allDone) statLine = `Все ${total} ${plural(total, ['звезда', 'звезды', 'звёзд'])} зажжены. Солнце взошло.`;
  else if (!solved) statLine = `На этом небе ${total} ${plural(total, ['звезда', 'звезды', 'звёзд'])}. Каждая решённая задача зажигает одну.`;
  else statLine = `Ты зажгла ${solved} ${plural(solved, ['звезду', 'звезды', 'звёзд'])} из ${total}. До рассвета — ещё ${left}.`;

  const cta = allDone
    ? `<a class="btn btn-primary btn-lg" href="#/gifts">Открыть шкатулку ${icons.next}</a>`
    : `<a class="btn btn-primary btn-lg" href="#/task/${cur.id}">
         <span class="btn-kicker">${started ? 'Продолжить' : 'Начать'}</span>
         <span class="btn-main">${esc(cur.title)}</span>${icons.next}
       </a>`;

  const page = h(`
    <div class="home">
      <header class="sky">
        <nav class="sky-nav">
          <a class="brand" href="#/" aria-label="${esc(config.title)} — на главную">
            <span class="brand-bird">${icons.swift}</span>
            <span class="brand-name">${esc(config.title)}</span>
          </a>
          <span class="sky-nav-right">
            <a class="chip" href="#/gifts">${icons.gift}<span>Шкатулка</span><b>${giftCount}</b></a>
            <button type="button" class="chip chip-icon" data-action="settings" aria-label="Настройки">${icons.gear}</button>
          </span>
        </nav>
        <div class="sky-body">
          <h1 class="hand sky-greeting">${esc(voice.greeting())}, ${esc(voice.herToday())}</h1>
          <p class="sky-stat">${esc(statLine)}</p>
          <div class="sky-actions">
            ${cta}
            ${streak > 0 ? `<span class="streak" title="Дни подряд, когда решена хотя бы одна задача"><b>${streak}</b> ${plural(streak, ['день', 'дня', 'дней'])} подряд</span>` : ''}
          </div>
          <p class="hand sky-note">${esc(voice.daily())} <span class="sky-sign">${esc(voice.sign())}</span></p>
        </div>
      </header>
      <main class="path" id="path">
        <div class="path-head">
          <h2>Путь</h2>
          <p>${course.modules.length} ${plural(course.modules.length, ['модуль', 'модуля', 'модулей'])} — от первой строчки кода до собственных приложений. В каждом модуле своё приложение и своя тема.</p>
        </div>
        <div class="modules">${course.modules.map(m => moduleCard(m, openId)).join('')}</div>
        <footer class="home-foot">
          <button type="button" class="link" data-action="share">Похвастаться успехами</button>
          <span aria-hidden="true">·</span>
          <button type="button" class="link" data-action="settings">Настройки и сохранение прогресса</button>
        </footer>
      </main>
    </div>`);

  renderSky(page.querySelector('.sky'), course.all.map(e => ({ title: e.title, solved: store.isSolved(e.id) })));

  page.addEventListener('click', e => {
    const head = e.target.closest('.module-head');
    if (head) {
      const card = head.closest('.module');
      const body = card.querySelector('.module-body');
      const open = body.hidden;
      body.hidden = !open;
      card.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      return;
    }
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'settings') document.dispatchEvent(new CustomEvent('blp:settings'));
    if (action === 'share') share(solved, total, streak);
    if (e.target.closest('.task-row.is-locked')) toast('Эта задача откроется, когда решишь предыдущую');
  });

  root.replaceChildren(page);
  document.title = `${config.title} — ${config.tagline}`;
  // плавно показать текущий модуль, если он далеко внизу
  if (started && cur) {
    const card = page.querySelector(`[data-module="${cur.moduleId}"]`);
    const y = card?.getBoundingClientRect().top ?? 0;
    if (y > innerHeight * 1.4) card.dataset.far = '1';
  }
  return () => {};
}

async function share(solved, total, streak) {
  const text = `Я решила ${solved} ${plural(solved, ['задачу', 'задачи', 'задач'])} из ${total} в курсе Swift${streak > 1 ? ` и занимаюсь ${streak} ${plural(streak, ['день', 'дня', 'дней'])} подряд` : ''}! ✨`;
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    toast('Текст скопирован — отправь его мужу');
  } catch { /* отменила — ничего страшного */ }
}
