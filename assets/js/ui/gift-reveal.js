// Вручение подарка: коробка → нажатие → подарок с запиской.
import { h, esc, voice, reducedMotion } from './util.js';
import { burst } from './fx.js';

const KICKER = { task: 'Тебе подарок', module: 'Модуль пройден — большой подарок', final: 'Курс пройден' };

/**
 * Показывает подарки по очереди.
 * gifts: [{ kind, img, emoji, name, note, fx, moduleTitle? }]
 * Возвращает Promise, который завершается, когда все подарки приняты.
 */
export function revealGifts(gifts, { lastLabel = 'Положить в шкатулку' } = {}) {
  return new Promise(resolve => {
    if (!gifts.length) { resolve(); return; }
    const prevFocus = document.activeElement;
    const overlay = h(`
      <div class="gift-overlay" role="dialog" aria-modal="true" aria-label="Подарок">
        <div class="gift-stars" aria-hidden="true"></div>
        <div class="gift-stage">
          <p class="gift-kicker"></p>
          <button type="button" class="gift-box" aria-label="Открыть подарок">
            <span class="gift-box-shadow"></span>
            <span class="gift-box-body"><span class="gift-box-band"></span></span>
            <span class="gift-box-lid"><span class="gift-box-band"></span><span class="gift-box-bow"></span></span>
          </button>
          <p class="gift-tap">Нажми на коробку, чтобы открыть</p>
          <div class="gift-content" hidden>
            <div class="gift-art"><img alt="" width="192" height="192"><span class="gift-emoji" hidden></span></div>
            <h2 class="gift-name"></h2>
            <p class="gift-note hand"></p>
            <p class="gift-sign hand"></p>
            <button type="button" class="btn btn-primary gift-next"></button>
          </div>
        </div>
      </div>`);
    // немного звёзд на фоне
    const stars = overlay.querySelector('.gift-stars');
    for (let i = 0; i < 46; i++) {
      const s = document.createElement('i');
      s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${(Math.random() * 4).toFixed(2)}s;--s:${(1 + Math.random() * 2).toFixed(1)}px`;
      stars.append(s);
    }
    document.body.append(overlay);
    document.body.classList.add('has-overlay');

    const $ = sel => overlay.querySelector(sel);
    const box = $('.gift-box'), content = $('.gift-content'), tap = $('.gift-tap'), next = $('.gift-next');
    const img = $('.gift-art img'), emoji = $('.gift-emoji');
    let i = 0;

    function prepare() {
      const g = gifts[i];
      overlay.dataset.kind = g.kind;
      $('.gift-kicker').textContent = g.kind === 'module' && g.moduleTitle ? `Модуль «${g.moduleTitle}» пройден` : KICKER[g.kind] ?? KICKER.task;
      content.hidden = true;
      content.classList.remove('is-in');
      box.hidden = false; tap.hidden = false;
      box.classList.remove('is-open');
      img.hidden = false; emoji.hidden = true;
      img.onerror = () => { img.hidden = true; emoji.hidden = false; };
      img.src = g.img;
      emoji.textContent = g.emoji;
      $('.gift-name').textContent = g.name;
      $('.gift-note').textContent = voice.fill(g.note);
      $('.gift-sign').textContent = voice.sign();
      next.textContent = i < gifts.length - 1 ? 'Дальше — ещё подарок' : lastLabel;
      requestAnimationFrame(() => box.focus({ preventScroll: true }));
    }

    function open() {
      if (box.classList.contains('is-open')) return;
      const g = gifts[i];
      box.classList.add('is-open');
      const r = box.getBoundingClientRect();
      const origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      burst(g.fx, { ...origin, count: g.kind === 'task' ? 90 : 170, spread: g.kind === 'task' ? 1 : 1.3 });
      if (g.kind !== 'task') setTimeout(() => burst('confetti', { ...origin, count: 120, spread: 1.4 }), 260);
      setTimeout(() => {
        box.hidden = true; tap.hidden = true;
        content.hidden = false;
        requestAnimationFrame(() => content.classList.add('is-in'));
        next.focus({ preventScroll: true });
      }, reducedMotion() ? 0 : 420);
    }

    function close() {
      overlay.classList.add('is-out');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => {
        overlay.remove();
        document.body.classList.remove('has-overlay');
        prevFocus?.focus?.({ preventScroll: true });
        resolve();
      }, reducedMotion() ? 0 : 260);
    }

    function advance() {
      i++;
      if (i < gifts.length) prepare();
      else close();
    }

    function onKey(e) {
      if (e.key === 'Tab') { // фокус остаётся внутри окна
        e.preventDefault();
        (content.hidden ? box : next).focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (content.hidden) open(); else advance();
      }
    }

    box.addEventListener('click', open);
    next.addEventListener('click', advance);
    document.addEventListener('keydown', onKey, true);
    prepare();
    requestAnimationFrame(() => overlay.classList.add('is-in'));
  });
}

/** Просмотр уже полученного подарка из шкатулки. */
export function showGiftCard(g, dateText) {
  const prevFocus = document.activeElement;
  const overlay = h(`
    <div class="gift-overlay is-card" role="dialog" aria-modal="true" aria-label="${esc(g.name)}">
      <div class="gift-stage">
        <div class="gift-content is-in">
          <div class="gift-art"><img alt="" width="192" height="192" src="${esc(g.img)}"><span class="gift-emoji" hidden>${esc(g.emoji)}</span></div>
          <h2 class="gift-name">${esc(g.name)}</h2>
          <p class="gift-note hand">${esc(voice.fill(g.note))}</p>
          <p class="gift-date">${esc(dateText)}</p>
          <button type="button" class="btn btn-ghost-light gift-next">Закрыть</button>
        </div>
      </div>
    </div>`);
  const img = overlay.querySelector('img');
  img.onerror = () => { img.hidden = true; overlay.querySelector('.gift-emoji').hidden = false; };
  const close = () => {
    document.removeEventListener('keydown', onKey, true);
    overlay.remove();
    document.body.classList.remove('has-overlay');
    prevFocus?.focus?.({ preventScroll: true });
  };
  const onKey = e => { if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); if (e.key === 'Escape') close(); } };
  overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('.gift-next')) close(); });
  document.addEventListener('keydown', onKey, true);
  document.body.append(overlay);
  document.body.classList.add('has-overlay');
  requestAnimationFrame(() => { overlay.classList.add('is-in'); overlay.querySelector('.gift-next').focus({ preventScroll: true }); });
}
