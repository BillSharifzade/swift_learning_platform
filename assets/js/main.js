// Точка входа: загрузка курса, переходы между экранами, окно настроек.
import config from '../../config.js';
import { loadCourse } from './course.js';
import { store } from './store.js';
import { mountHome } from './views/home.js';
import { mountTask } from './views/task.js';
import { mountGifts } from './views/gifts.js';
import { h, esc, toast, icons } from './ui/util.js';
import { installNotifyKey, flushNotifications } from './notify.js';

const root = document.getElementById('app');
let cleanup = () => {};
let token = 0;

async function route() {
  const my = ++token;
  const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  try { cleanup(); } catch { /* экран уже разобран */ }
  cleanup = () => {};
  const view = document.createElement('div');
  view.className = 'view';
  root.replaceChildren(view);
  let name = 'home', result;
  if (hash.startsWith('task/')) { name = 'task'; result = mountTask(view, hash.slice(5)); }
  else if (hash === 'gifts') { name = 'gifts'; result = mountGifts(view); }
  else result = mountHome(view);
  document.body.dataset.view = name;
  const done = await result;
  if (my !== token) { try { done?.(); } catch { /* устаревший экран */ } return; }
  cleanup = done ?? (() => {});
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function openSettings() {
  if (document.querySelector('.modal')) return;
  const prevFocus = document.activeElement;
  const modal = h(`
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="modal-card">
        <header class="modal-head">
          <h2 id="settings-title">Настройки</h2>
          <button type="button" class="ghost ghost-ink" data-act="close" aria-label="Закрыть">${icons.close}</button>
        </header>
        <section class="setting">
          <div><h3>Размер шрифта в редакторе</h3><p>Сейчас: <b data-role="font">${store.state.settings.fontSize}</b> px</p></div>
          <div class="stepper"><button type="button" data-act="font-" aria-label="Меньше">−</button><button type="button" data-act="font+" aria-label="Больше">+</button></div>
        </section>
        <section class="setting">
          <div><h3>Сохранить прогресс в файл</h3><p>Прогресс хранится только в этом браузере. Файл пригодится, чтобы перенести его на другое устройство или не потерять.</p></div>
          <button type="button" class="btn btn-quiet" data-act="export">Сохранить</button>
        </section>
        <section class="setting">
          <div><h3>Загрузить прогресс из файла</h3><p>Заменит текущий прогресс тем, что записан в файле.</p></div>
          <label class="btn btn-quiet">Выбрать файл<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        </section>
        <section class="setting setting-danger">
          <div><h3>Начать курс заново</h3><p>Сотрёт решения, звёзды и подарки. Отменить это нельзя.</p></div>
          <button type="button" class="btn btn-danger" data-act="reset">Стереть всё</button>
        </section>
        ${store.persistent ? '' : '<p class="modal-warn">Браузер не разрешает сохранять данные (возможно, включён приватный режим). Прогресс пропадёт, когда вкладка закроется.</p>'}
        <p class="modal-about">Твой код проверяет настоящий компилятор Swift 6.2 на сервисе Compiler Explorer (godbolt.org). Туда отправляется только текст решения — без имени и без каких-либо личных данных.</p>
      </div>
    </div>`);
  const close = () => {
    document.removeEventListener('keydown', onKey, true);
    modal.remove();
    document.body.classList.remove('has-overlay');
    prevFocus?.focus?.({ preventScroll: true });
  };
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button, [href], input, label.btn')].filter(el => !el.hidden);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  modal.addEventListener('click', e => {
    if (e.target === modal) { close(); return; }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'close') close();
    if (act === 'font-' || act === 'font+') {
      const size = Math.max(12, Math.min(22, store.state.settings.fontSize + (act === 'font+' ? 1 : -1)));
      store.setSetting('fontSize', size);
      modal.querySelector('[data-role="font"]').textContent = size;
      document.querySelector('.editor-host')?.style.setProperty('--editor-font', `${size}px`);
      document.querySelector('.editor-host .CodeMirror')?.CodeMirror?.refresh();
    }
    if (act === 'export') {
      download(`bonnie-progress-${new Date().toISOString().slice(0, 10)}.json`, store.export());
      toast('Файл с прогрессом сохранён');
    }
    if (act === 'reset') {
      if (window.confirm('Точно стереть весь прогресс? Решения, звёзды и подарки исчезнут навсегда.')) {
        store.reset(); close(); location.hash = '#/'; route(); toast('Прогресс стёрт. Начинаем с чистого листа');
      }
    }
  });
  modal.querySelector('[data-act="import"]').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      store.import(await file.text());
      close(); route(); toast('Прогресс загружен');
    } catch (err) {
      toast(err?.message?.startsWith('Это не файл') ? err.message : 'Не получилось прочитать файл');
    }
    e.target.value = '';
  });
  document.addEventListener('keydown', onKey, true);
  document.body.append(modal);
  document.body.classList.add('has-overlay');
  modal.querySelector('[data-act="close"]').focus({ preventScroll: true });
}

document.addEventListener('blp:settings', openSettings);
window.addEventListener('hashchange', route);

(async function boot() {
  document.title = `${config.title} — ${config.tagline}`;
  installNotifyKey(); // до первого перехода: ключ из личной ссылки сразу убирается из адреса
  flushNotifications();
  try {
    await loadCourse();
  } catch (e) {
    root.replaceChildren(h(`<div class="empty-state"><h1>Курс не загрузился</h1><p>${esc(e.message)}</p><p>Если ты открываешь сайт у себя на компьютере — сначала собери задачи командой <code>node tools/build.mjs</code> и запусти локальный сервер.</p></div>`));
    return;
  }
  route();
})();
