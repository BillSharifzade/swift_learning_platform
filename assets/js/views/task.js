// Экран задачи: описание, редактор, подсказки и разбор результата проверки.
import config from '../../../config.js';
import { store } from '../store.js';
import { course, gifts } from '../course.js';
import { h, esc, plural, voice, icons, toast, reducedMotion } from '../ui/util.js';
import { renderDescription, renderMarkdown, renderSafe, renderSafeInline, highlightIn } from '../ui/md.js';
import { judge } from '../engine/judge.js';
import { createRunner } from '../engine/runner.js';
import { revealGifts } from '../ui/gift-reveal.js';
import { notifyGifts } from '../notify.js';

const run = createRunner(config.compiler);

const HINT_NAMES = ['Путь решения словами', 'Фрагмент кода', 'Почти готовое решение', 'Полное решение с разбором'];
const STAGE_TEXT = {
  precheck: 'Читаю твой код…',
  compile: 'Отправляю настоящему компилятору Swift…',
  cases: 'Запускаю ещё раз — с другими данными…',
};
const INFRA_TEXT = {
  offline: 'Похоже, пропал интернет. Проверь соединение и попробуй ещё раз.',
  timeout: 'Компилятор не ответил вовремя. Так бывает, когда сервис занят, — попробуй ещё раз через минуту.',
  busy: 'Компилятор сейчас перегружен. Подожди немного и попробуй снова.',
  network: 'Не удалось дозвониться до сервиса, который проверяет код. Проверь интернет и попробуй ещё раз.',
  http: 'Сервис, который проверяет код, ответил ошибкой. Попробуй ещё раз чуть позже.',
  unknown: 'Что-то пошло не так на стороне проверки. Попробуй ещё раз.',
};

const isDesktop = () => window.matchMedia('(min-width: 960px)').matches;
const plain = s => String(s ?? '').replace(/`/g, '');

// ───────────────────────── кусочки разметки результата ─────────────────────────

function frame(p) {
  if (!p.srcLine) return '';
  const lead = /^\s*/.exec(p.srcLine)[0].length;
  const text = p.srcLine.slice(lead);
  if (p.region !== 'user') {
    return `<div class="frame frame-test"><span class="frame-label">Строка проверки (её писала не ты)</span><code>${esc(text)}</code></div>`;
  }
  const a = Math.max(0, Math.min(text.length, (p.col ?? 1) - 1 - lead));
  const b = Math.max(a + 1, Math.min(text.length + 1, (p.endCol ?? p.col + 1) - 1 - lead));
  const mid = text.slice(a, b) || ' ';
  return `<div class="frame"><span class="frame-ln">${p.line}</span><code>${esc(text.slice(0, a))}<mark>${esc(mid)}</mark>${esc(text.slice(b))}</code></div>`;
}

function problemCard(p, { compact = false } = {}) {
  const where = p.region === 'user' && p.line
    ? `<button type="button" class="where" data-goto="${p.line}:${p.col ?? 1}">Строка ${p.line}${p.col ? `, символ ${p.col}` : ''}</button>`
    : (p.region === 'tests' || p.region === 'harness' ? '<span class="where where-static">На стыке с проверкой</span>' : '');
  const duringCode = (p.duringTest ?? '').replace(/^(?:let|var)\s+__t_\w+\s*=\s*/, '');
  const during = p.duringTestName
    ? `<p class="during">Сбой случился, когда проверка выполняла: <b>${esc(p.duringTestName)}</b></p>`
    : (duringCode ? `<p class="during">Сбой случился, когда проверка вызвала твой код так: <code>${esc(duringCode)}</code></p>` : '');
  const notes = (p.notes ?? []).map(n => `<li>${renderSafeInline(n.text)}${n.line && n.line !== p.line ? ` <button type="button" class="where where-inline" data-goto="${n.line}:1">строка ${n.line}</button>` : ''}</li>`).join('');
  return `
    <article class="problem is-${p.severity === 'warning' ? 'warning' : 'error'} ${compact ? 'is-compact' : ''}">
      <header class="problem-head">
        ${where}
        <h3>${renderSafeInline(p.title)}</h3>
      </header>
      ${frame(p)}
      ${during}
      <dl class="explain">
        ${p.what ? `<div><dt>Что произошло</dt><dd>${renderSafe(p.what)}</dd></div>` : ''}
        ${p.why ? `<div><dt>${p.severity === 'warning' ? 'Почему это важно' : 'Почему это ошибка'}</dt><dd>${renderSafe(p.why)}</dd></div>` : ''}
        ${p.fix ? `<div class="explain-fix"><dt>Как исправить</dt><dd>${renderSafe(p.fix)}</dd></div>` : ''}
      </dl>
      ${notes ? `<ul class="compiler-notes">${notes}</ul>` : ''}
      ${p.original ? `<details class="original"><summary>Что сказал компилятор (по-английски)</summary><code>${esc(p.original)}</code></details>` : ''}
    </article>`;
}

function consoleBlock(text, label = 'Что вывела программа') {
  const body = String(text ?? '').replace(/\n+$/, '');
  if (!body) return '';
  return `<div class="console"><span class="console-label">${esc(label)}</span><pre>${esc(body)}</pre></div>`;
}

function diffBlock(d) {
  const showWs = d.kind === 'space';
  const line = (text, i, isDiff) => {
    let html = esc(text);
    if (isDiff && showWs) html = html.replace(/ /g, '<i class="ws">·</i>');
    return `<span class="dl ${isDiff ? 'is-diff' : ''}"><i class="dn">${i + 1}</i>${html || '&nbsp;'}</span>`;
  };
  const col = (title, lines) => `
    <div class="outcol"><h4>${title}</h4><pre>${lines.length ? lines.map((t, i) => line(t, i, d.line === i + 1)).join('') : '<span class="dl is-empty">(ничего не выведено)</span>'}</pre></div>`;
  return `<div class="outdiff">${col('Должно быть', d.expected)}${col('У тебя', d.actual)}</div>`;
}

function testsList(tests, { onlyFailed = false } = {}) {
  const list = onlyFailed ? tests.filter(t => !t.ok) : tests;
  if (!list.length) return '';
  return `<ul class="tests">${list.map(t => `
    <li class="test ${t.ok ? 'is-ok' : 'is-fail'}">
      <span class="test-mark">${t.ok ? icons.check : icons.cross}</span>
      <div class="test-body">
        <span class="test-name">${esc(t.name)}</span>
        ${!t.ok && (t.want || t.got) ? `<dl class="test-values"><div><dt>Ожидалось</dt><dd><code>${esc(t.want)}</code></dd></div><div><dt>Получилось</dt><dd><code>${esc(t.got)}</code></dd></div></dl>` : ''}
        ${!t.ok && t.hint ? `<p class="test-hint">${renderSafeInline(t.hint)}</p>` : ''}
      </div>
    </li>`).join('')}</ul>`;
}

function noteBlock(kind) {
  const text = voice.note(kind);
  if (!text) return '';
  return `<aside class="note"><p class="hand note-text">${esc(text)}</p><p class="hand note-sign">${esc(voice.sign())}</p></aside>`;
}

function head(title, sub, tone = 'fail') {
  return `<header class="result-head is-${tone}"><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</header>`;
}

function renderFailure(r, attempts, untouched = false) {
  const n = r.problems.length;
  let html = '';
  // Стартовый код ещё не меняли: это не ошибка ученицы, а просто «решение пока не написано».
  if (untouched && ['contract', 'output', 'tests', 'cases', 'rules'].includes(r.status)) {
    return head('Решение ещё не написано', 'В редакторе пока стартовый код — заготовка, с которой начинается задача. Допиши её по условию и нажми «Проверить» снова.', 'info')
      + (r.status === 'output' && r.outputDiff ? diffBlock(r.outputDiff) : '')
      + (r.status === 'tests' ? testsList(r.tests, { onlyFailed: true }) : '');
  }
  switch (r.status) {
    case 'empty':
      return head('Здесь пока пусто', 'Напиши решение в редакторе и нажми «Проверить».', 'info');
    case 'precheck':
      html = head('В записи кода есть ошибка', 'Её видно ещё до компилятора. Исправь — и пойдём дальше.') + r.problems.map(p => problemCard(p)).join('');
      break;
    case 'compile':
      html = head('Swift не смог собрать программу', n > 1
        ? `Он споткнулся в ${n} ${plural(n, ['месте', 'местах', 'местах'])}. Начни с первого — остальные часто исчезают сами.`
        : 'Он остановился в одном месте. Давай разберёмся, что случилось.')
        + r.problems.map(p => problemCard(p)).join('')
        + (r.moreProblems ? `<p class="more-problems">И ещё ${r.moreProblems}. Сначала исправь эти — потом проверим снова.</p>` : '');
      break;
    case 'contract':
      html = head('Код собрался, но проверка не может им воспользоваться', 'Проверка обращается к тому, что нужно объявить по условию, — и не находит это в нужном виде. Сверь имена, типы и параметры с разделом «Задача».')
        + r.problems.map(p => problemCard(p)).join('');
      break;
    case 'runtime':
      html = head('Программа запустилась, но аварийно остановилась', 'Компилятор ошибок не нашёл — сбой случился уже во время работы.')
        + r.problems.map(p => problemCard(p)).join('') + consoleBlock(r.stdout, 'Что программа успела вывести');
      break;
    case 'timeout':
      html = head('Программа не завершилась', 'Она работала слишком долго, и её пришлось остановить.')
        + r.problems.map(p => problemCard(p)).join('') + consoleBlock(r.stdout, 'Что программа успела вывести');
      break;
    case 'output':
      html = head('Программа работает, но выводит не то', renderSafeInline(r.outputDiff.detail)) + diffBlock(r.outputDiff);
      break;
    case 'tests': {
      const failed = r.tests.filter(t => !t.ok).length;
      html = head('Код работает, но не во всех случаях', `Не ${plural(failed, ['прошла', 'прошли', 'прошло'])} ${failed} ${plural(failed, ['проверка', 'проверки', 'проверок'])} из ${r.tests.length}. Посмотри, на каких данных результат расходится.`)
        + testsList(r.tests, { onlyFailed: true })
        + (r.tests.length > failed ? `<details class="pass-details"><summary>Прошедшие проверки: ${r.tests.length - failed}</summary>${testsList(r.tests.filter(t => t.ok))}</details>` : '')
        + consoleBlock(r.stdout);
      break;
    }
    case 'rules':
      html = head('Результат верный, но условие задачи выполнено не полностью', 'Программа выдаёт правильный ответ. Осталось сделать это так, как просили в задаче.', 'near')
        + `<ul class="rules">${r.ruleFailures.map(f => `<li>${renderSafeInline(f.message)}</li>`).join('')}</ul>`;
      break;
    case 'cases':
      html = head('С данными из условия всё верно, а с другими — нет', 'Проверка запустила твой код ещё раз, подставив другие входные данные. Программа должна работать с любыми — значит, где-то ответ «зашит» в код или не учтён один из случаев.', 'near')
        + r.caseFailures.map(c => `
          <article class="case">
            <h3>${esc(c.name)}</h3>
            <div class="case-inputs"><span class="frame-label">Проверка подставила такие данные</span><pre class="code code-swift"><code class="language-swift">${esc(c.inputs)}</code></pre></div>
            ${c.kind === 'missing-input' ? `<p>Не удалось найти в твоём коде ${plural(c.missing.length, ['объявление', 'объявления', 'объявления'])} ${c.missing.map(m => `<code>${esc(m)}</code>`).join(', ')}. Входные данные в начале кода нельзя переименовывать и удалять — верни их, как в стартовом коде.</p>` : ''}
            ${c.outputDiff ? `<p>${renderSafeInline(c.outputDiff.detail)}</p>${diffBlock(c.outputDiff)}` : ''}
            ${(c.problems ?? []).map(p => problemCard(p, { compact: true })).join('')}
          </article>`).join('');
      break;
    case 'infra':
      return head('Не получилось связаться с компилятором', esc(INFRA_TEXT[r.infra?.kind] ?? INFRA_TEXT.unknown), 'info')
        + '<p class="infra-note">Твой код сохранён, ничего не потерялось.</p><button type="button" class="btn btn-primary" data-action="check">Попробовать ещё раз</button>';
    default:
      html = head('Проверка не прошла', '');
  }
  html += noteBlock(attempts >= 3 ? 'stuck' : 'fail');
  if (attempts >= 2) html += '<p class="after-note"><button type="button" class="link" data-action="hint">Открыть подсказку</button></p>';
  return html;
}

// ───────────────────────── экран ─────────────────────────

export async function mountTask(root, id) {
  const meta = course.meta(id);
  if (!meta) { root.replaceChildren(h('<div class="empty-state"><h1>Такой задачи нет</h1><a class="btn btn-primary" href="#/">На главную</a></div>')); return () => {}; }
  if (!course.isUnlocked(id)) {
    const cur = course.current();
    root.replaceChildren(h(`<div class="empty-state"><h1 class="hand">Эта задача пока закрыта</h1><p>Она откроется, когда ты решишь предыдущие. Всему своё время.</p><a class="btn btn-primary" href="#/task/${cur.id}">К текущей задаче ${icons.next}</a></div>`));
    return () => {};
  }

  root.replaceChildren(h('<div class="loading-screen"><span class="loading-bird">' + icons.swift + '</span></div>'));
  let ex;
  try { ex = await course.exercise(id); } catch {
    root.replaceChildren(h('<div class="empty-state"><h1>Не удалось загрузить задачу</h1><p>Проверь интернет и обнови страницу.</p><a class="btn btn-primary" href="#/">На главную</a></div>'));
    return () => {};
  }
  const mod = course.module(meta.moduleId);
  const prev = course.prev(id), next = course.next(id);
  store.setLastTask(id);

  const dots = mod.exercises.map(e => {
    const cls = e.id === id ? 'is-here' : store.isSolved(e.id) ? 'is-solved' : course.isUnlocked(e.id) ? 'is-open' : 'is-locked';
    const label = `${e.indexInModule + 1}. ${e.title}`;
    return course.isUnlocked(e.id)
      ? `<a class="dot ${cls}" href="#/task/${e.id}" title="${esc(label)}" aria-label="${esc(label)}"></a>`
      : `<span class="dot ${cls}" title="${esc(label)}"></span>`;
  }).join('');

  const page = h(`
    <div class="task" data-tab="task">
      <header class="task-bar">
        <a class="chip chip-dark" href="#/" aria-label="Вернуться к списку модулей">${icons.back}<span>Путь</span></a>
        <div class="task-bar-mid">
          <span class="task-bar-module"><span aria-hidden="true">${esc(mod.emoji)}</span> ${esc(mod.title)}</span>
          <nav class="dots" aria-label="Задачи модуля">${dots}</nav>
        </div>
        <div class="task-bar-right">
          ${prev && course.isUnlocked(prev.id) ? `<a class="chip chip-dark chip-icon" href="#/task/${prev.id}" aria-label="Предыдущая задача" title="Предыдущая задача">${icons.back}</a>` : ''}
          ${next && course.isUnlocked(next.id) ? `<a class="chip chip-dark chip-icon" data-role="next-top" href="#/task/${next.id}" aria-label="Следующая задача" title="Следующая задача">${icons.next}</a>` : '<span data-role="next-top"></span>'}
          <a class="chip chip-dark" href="#/gifts" aria-label="Шкатулка с подарками">${icons.gift}<b data-role="gift-count">${store.state.gifts.length}</b></a>
        </div>
      </header>
      <div class="task-body">
        <section class="brief">
          <div class="tabs" role="tablist" aria-label="Разделы задачи">
            <button type="button" role="tab" class="tab" data-tab="task" aria-selected="true">Задание</button>
            <button type="button" role="tab" class="tab tab-code" data-tab="code" aria-selected="false">Код</button>
            <button type="button" role="tab" class="tab" data-tab="hints" aria-selected="false">Подсказки <span class="tab-badge" data-role="hint-badge"></span></button>
            <button type="button" role="tab" class="tab" data-tab="result" aria-selected="false">Проверка <span class="tab-dot" data-role="result-dot" hidden></span></button>
          </div>
          <div class="brief-scroll" tabindex="-1">
            <div class="panel" data-panel="task">
              <p class="eyebrow">Задача ${meta.indexInModule + 1} из ${mod.exercises.length} · ${esc(ex.concept)}</p>
              <h1 class="task-title">${esc(ex.title)}</h1>
              <div data-role="solved-banner"></div>
              <div data-role="description"></div>
            </div>
            <div class="panel" data-panel="hints" hidden></div>
            <div class="panel" data-panel="result" hidden>
              <div class="result-idle">
                <p class="hand">Здесь появится разбор, когда ты нажмёшь «Проверить».</p>
                <p>Если в коде найдётся ошибка, ты увидишь, где она, почему возникла и как её исправить.</p>
              </div>
            </div>
          </div>
        </section>
        <section class="workbench" aria-label="Редактор кода">
          <div class="editor-head">
            <span class="file-name">main.swift</span>
            <button type="button" class="ghost" data-action="reset" title="Вернуть стартовый код">${icons.reset}<span>Начать заново</span></button>
          </div>
          <div class="editor-host"></div>
          <div class="actions">
            <button type="button" class="btn btn-primary btn-check" data-action="check">${icons.play}<span data-role="check-label">Проверить</span></button>
            <button type="button" class="btn btn-night" data-action="hint">${icons.bulb}<span>Подсказка</span><span class="hint-pips" data-role="hint-pips" aria-hidden="true"></span></button>
            <span class="kbd" aria-hidden="true">Ctrl + Enter</span>
          </div>
        </section>
      </div>
    </div>`);

  root.replaceChildren(page);
  document.title = `${ex.title} — ${config.title}`;
  window.scrollTo(0, 0);

  const $ = sel => page.querySelector(sel);
  const panels = { task: $('[data-panel="task"]'), hints: $('[data-panel="hints"]'), result: $('[data-panel="result"]') };
  $('[data-role="description"]').append(renderDescription(ex.description));

  // ── редактор ──
  const saved = store.task(id).code;
  const cm = window.CodeMirror($('.editor-host'), {
    value: saved ?? ex.starter ?? '',
    mode: 'swift',
    theme: 'blp',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    styleActiveLine: true,
    lineWrapping: false,
    gutters: ['gutter-problems', 'CodeMirror-linenumbers'],
    extraKeys: {
      'Ctrl-Enter': () => check(),
      'Cmd-Enter': () => check(),
      'Ctrl-/': 'toggleComment',
      'Cmd-/': 'toggleComment',
      Tab: editor => {
        if (editor.somethingSelected()) editor.indentSelection('add');
        else editor.replaceSelection(' '.repeat(editor.getOption('indentUnit')), 'end');
      },
      'Shift-Tab': editor => editor.indentSelection('subtract'),
    },
  });
  $('.editor-host').style.setProperty('--editor-font', `${store.state.settings.fontSize}px`);
  setTimeout(() => cm.refresh(), 0);

  let saveTimer = null;
  let marks = [];
  let widgets = [];
  function clearMarkers({ keepGutter = false } = {}) {
    widgets.forEach(w => w.clear()); widgets = [];
    if (keepGutter) return;
    marks.forEach(m => m.clear()); marks = [];
    cm.clearGutter('gutter-problems');
    cm.eachLine(line => { cm.removeLineClass(line, 'background', 'line-error'); cm.removeLineClass(line, 'background', 'line-warning'); });
  }
  function markProblems(problems) {
    const lineCount = cm.lineCount();
    for (const p of problems) {
      if (p.region !== 'user' || !p.line || p.line > lineCount) continue;
      const ln = p.line - 1;
      const kind = p.severity === 'warning' ? 'warning' : 'error';
      cm.addLineClass(ln, 'background', `line-${kind}`);
      const lineText = cm.getLine(ln) ?? '';
      const from = Math.max(0, Math.min(lineText.length, (p.col ?? 1) - 1));
      const to = Math.max(from + 1, Math.min(lineText.length, (p.endCol ?? from + 2) - 1));
      if (lineText.length) marks.push(cm.markText({ line: ln, ch: from }, { line: ln, ch: Math.max(to, from + 1) }, { className: `mark-${kind}` }));
      const dot = document.createElement('span');
      dot.className = `gutter-dot is-${kind}`;
      dot.title = plain(p.title);
      cm.setGutterMarker(ln, 'gutter-problems', dot);
      if (kind === 'error') {
        const w = document.createElement('div');
        w.className = 'inline-problem';
        w.textContent = plain(p.title);
        widgets.push(cm.addLineWidget(ln, w, { noHScroll: true }));
      }
    }
  }
  cm.on('change', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.setCode(id, cm.getValue()), 500);
    if (widgets.length) clearMarkers({ keepGutter: true });
  });
  function goto(line, col = 1) {
    if (!isDesktop()) switchTab('code');
    const ln = Math.max(0, Math.min(cm.lineCount() - 1, line - 1));
    setTimeout(() => {
      cm.refresh();
      cm.focus();
      cm.setCursor({ line: ln, ch: Math.max(0, col - 1) });
      cm.scrollIntoView({ line: ln, ch: 0 }, 80);
    }, 30);
  }

  // ── вкладки ──
  function switchTab(tab) {
    if (tab === 'code' && isDesktop()) tab = 'task';
    page.dataset.tab = tab;
    page.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));
    for (const [name, el] of Object.entries(panels)) el.hidden = name !== tab;
    if (tab === 'result') $('[data-role="result-dot"]').hidden = true;
    if (tab === 'code') setTimeout(() => cm.refresh(), 0);
    else $('.brief-scroll').scrollTop = 0;
  }
  const onResize = () => { if (isDesktop() && page.dataset.tab === 'code') switchTab('task'); cm.refresh(); };
  window.addEventListener('resize', onResize);

  // ── подсказки ──
  let confirmFull = false;
  function renderHints() {
    const level = store.task(id).hints ?? 0;
    $('[data-role="hint-badge"]').textContent = level ? `${level}/4` : '';
    $('[data-role="hint-pips"]').innerHTML = [1, 2, 3, 4].map(i => `<i class="${i <= level ? 'is-on' : ''}"></i>`).join('');
    const items = ex.hints.map((text, i) => {
      const n = i + 1;
      if (n <= level) {
        return `<li class="hint is-open"><header><span class="hint-n">${n}</span><h3>${HINT_NAMES[i]}</h3></header><div class="prose hint-body">${renderMarkdown(text)}</div>
          ${n === 4 ? `<div class="hint-write"><p>Лучше всего перепечатать решение своими руками — так оно запомнится. Но если хочешь, оно впишется в редактор само.</p><button type="button" class="btn btn-quiet" data-action="write-solution">Вписать решение в редактор</button></div>` : ''}</li>`;
      }
      if (n === level + 1) {
        if (n === 4 && confirmFull) {
          return `<li class="hint is-confirm"><header><span class="hint-n">4</span><h3>${HINT_NAMES[3]}</h3></header>
            <p>Это уже готовое решение целиком. Может, ещё одна попытка? Третья подсказка подвела тебя совсем близко.</p>
            <div class="hint-confirm-actions"><button type="button" class="btn btn-quiet" data-action="hint-cancel">Попробую сама</button><button type="button" class="btn btn-primary" data-action="hint-full">Показать решение</button></div></li>`;
        }
        return `<li class="hint is-next"><button type="button" class="hint-open" data-action="hint-open"><span class="hint-n">${n}</span><span><b>Открыть подсказку ${n}</b><small>${HINT_NAMES[i]}</small></span>${icons.next}</button></li>`;
      }
      return `<li class="hint is-closed"><span class="hint-n">${n}</span><span>${HINT_NAMES[i]}</span></li>`;
    }).join('');
    panels.hints.innerHTML = `
      <div class="hints">
        <p class="hints-intro">${level === 0
          ? 'Четыре подсказки — от лёгкого намёка до полного разбора. Открывай по одной и после каждой пробуй снова: пользоваться ими не стыдно, для этого они и написаны.'
          : level < 4 ? 'Попробуй применить подсказку. Если не выходит — открой следующую.' : 'Все подсказки открыты. Разбери решение и обязательно набери его сама.'}</p>
        <ol class="hint-steps">${items}</ol>
      </div>`;
    highlightIn(panels.hints);
  }
  function openNextHint() {
    const level = store.task(id).hints ?? 0;
    switchTab('hints');
    if (level >= 4) return;
    if (level === 3 && !confirmFull) { confirmFull = true; renderHints(); return; }
    confirmFull = false;
    store.revealHint(id, level + 1);
    renderHints();
    requestAnimationFrame(() => {
      const opened = panels.hints.querySelectorAll('.hint.is-open');
      opened[opened.length - 1]?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  }
  function writeSolution() {
    const target = ex.solution ?? '';
    clearMarkers();
    if (!isDesktop()) switchTab('code');
    if (reducedMotion()) { cm.setValue(target); return; }
    cm.setValue('');
    cm.setOption('readOnly', true);
    let i = 0;
    const step = Math.max(2, Math.ceil(target.length / 90));
    const tick = () => {
      i = Math.min(target.length, i + step);
      cm.setValue(target.slice(0, i));
      cm.setCursor(cm.lineCount(), 0);
      if (i < target.length) typer = setTimeout(tick, 16);
      else { cm.setOption('readOnly', false); cm.focus(); }
    };
    tick();
  }
  let typer = null;

  // ── проверка ──
  let busy = false;
  let slowTimers = [];
  function showRunning(stage) {
    panels.result.innerHTML = `
      <div class="running" role="status" aria-live="polite">
        <div class="running-sky"><span class="running-bird">${icons.swift}</span></div>
        <p class="running-title">Проверяю</p>
        <p class="running-sub" data-role="stage">${esc(STAGE_TEXT[stage] ?? STAGE_TEXT.compile)}</p>
      </div>`;
  }
  function setBusy(on) {
    busy = on;
    page.classList.toggle('is-busy', on);
    page.querySelectorAll('[data-action="check"]').forEach(b => { b.disabled = on; });
    $('[data-role="check-label"]').textContent = on ? 'Проверяю…' : 'Проверить';
    slowTimers.forEach(clearTimeout); slowTimers = [];
    if (on) {
      const say = text => { const el = panels.result.querySelector('[data-role="stage"]'); if (el) el.textContent = text; };
      slowTimers.push(setTimeout(() => say('Компилятор задумался — такое бывает. Ещё немного…'), 8000));
      slowTimers.push(setTimeout(() => say('Всё ещё жду ответа. Если в коде есть цикл, возможно, он никак не закончится.'), 20000));
    }
  }

  function nextButton() {
    const nx = course.next(id);
    if (!nx) return `<a class="btn btn-primary" href="#/">На главную ${icons.next}</a>`;
    const sameModule = nx.moduleId === meta.moduleId;
    return `<a class="btn btn-primary" href="#/task/${nx.id}">${sameModule ? 'Следующая задача' : 'К следующему модулю'} ${icons.next}</a>`;
  }
  function refreshSolvedBanner() {
    const el = $('[data-role="solved-banner"]');
    el.innerHTML = store.isSolved(id)
      ? `<div class="solved-banner">${icons.star}<span>Эта задача уже решена — звезда зажжена.</span>${course.next(id) ? `<a class="link" href="#/task/${course.next(id).id}">Дальше</a>` : ''}</div>`
      : '';
    const top = $('[data-role="next-top"]');
    const nx = course.next(id);
    if (nx && course.isUnlocked(nx.id) && top.tagName !== 'A') {
      top.outerHTML = `<a class="chip chip-dark chip-icon" data-role="next-top" href="#/task/${nx.id}" aria-label="Следующая задача" title="Следующая задача">${icons.next}</a>`;
    }
  }

  async function onPass(result) {
    const attempts = (store.task(id).attempts ?? 0) + 1;
    const first = store.solve(id);
    const hintsUsed = store.task(id).hints ?? 0;
    const queue = [];
    const taskGift = gifts.forTask(id);
    if (taskGift && store.addGift({ key: taskGift.key, kind: 'task', ref: id })) queue.push(taskGift);
    if (course.moduleDone(mod)) {
      const mg = gifts.forModule(mod.id);
      if (mg && store.addGift({ key: mg.key, kind: 'module', ref: mod.id })) queue.push({ ...mg, moduleTitle: mod.title });
    }
    if (course.allDone()) {
      const fg = gifts.final();
      if (store.addGift({ key: fg.key, kind: 'final', ref: 'course' })) queue.push(fg);
    }
    notifyGifts({ taskTitle: ex.title, moduleTitle: mod.title, index: meta.indexInModule + 1, count: mod.exercises.length, gifts: queue, solved: store.solvedCount(), total: course.total });
    let praise = '';
    if (first && attempts === 1 && hintsUsed === 0) praise = 'С первой попытки и без подсказок.';
    else if (first && hintsUsed === 0) praise = 'Без единой подсказки.';
    else if (first) praise = 'Ты довела дело до конца — это главное.';
    panels.result.innerHTML = `
      <div class="pass">
        <div class="pass-star">${icons.star}</div>
        <h2 class="hand">${esc(store.pick('pass', config.notes.pass))}</h2>
        <p class="pass-sub">${first ? 'Звезда зажжена. ' : ''}${esc(praise)}</p>
        <div class="pass-actions">${nextButton()}</div>
      </div>
      ${result.tests.length ? `<details class="pass-details"><summary>Пройденные проверки: ${result.tests.length}</summary>${testsList(result.tests)}</details>` : ''}
      ${consoleBlock(result.stdout)}
      ${result.warnings.length ? `<div class="advice"><h3>Совет на будущее</h3><p>Задача решена, но компилятор заметил, что можно сделать аккуратнее:</p>${result.warnings.map(w => problemCard(w, { compact: true })).join('')}</div>` : ''}`;
    highlightIn(panels.result);
    markProblems(result.warnings);
    refreshSolvedBanner();
    if (queue.length) {
      await new Promise(r => setTimeout(r, reducedMotion() ? 0 : 650));
      if (!page.isConnected) return;
      await revealGifts(queue);
      const count = page.querySelector('[data-role="gift-count"]');
      if (count) count.textContent = store.state.gifts.length;
    }
    panels.result.querySelector('.pass-actions .btn')?.focus({ preventScroll: true });
  }

  function onFail(result, code) {
    const untouched = code.trim() === (ex.starter ?? '').trim()
      && ['contract', 'output', 'tests', 'cases', 'rules'].includes(result.status);
    const counted = !untouched && !['infra', 'empty'].includes(result.status);
    const attempts = counted ? store.addAttempt(id) : (store.task(id).attempts ?? 0);
    panels.result.innerHTML = `<div class="result">${renderFailure(result, attempts, untouched)}</div>`;
    highlightIn(panels.result);
    markProblems(result.problems);
    const firstUser = result.problems.find(p => p.region === 'user' && p.line);
    if (firstUser && isDesktop()) cm.scrollIntoView({ line: firstUser.line - 1, ch: 0 }, 90);
  }

  async function check() {
    if (busy) return;
    clearTimeout(typer); cm.setOption('readOnly', false);
    const code = cm.getValue();
    store.setCode(id, code);
    clearMarkers();
    switchTab('result');
    showRunning('precheck');
    setBusy(true);
    let result;
    try {
      result = await judge({
        exercise: ex, code, run,
        onStage: s => { const el = panels.result.querySelector('[data-role="stage"]'); if (el && STAGE_TEXT[s]) el.textContent = STAGE_TEXT[s]; },
      });
    } catch (e) {
      result = { status: 'infra', infra: { kind: 'unknown', message: String(e?.message ?? e) }, problems: [], tests: [], warnings: [], stdout: '', caseFailures: [], ruleFailures: [] };
    }
    if (!page.isConnected) return;
    setBusy(false);
    $('.brief-scroll').scrollTop = 0;
    if (result.status === 'pass') await onPass(result);
    else onFail(result, code);
  }

  // ── события ──
  page.addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (tab) { switchTab(tab.dataset.tab); return; }
    const where = e.target.closest('[data-goto]');
    if (where) { const [l, c] = where.dataset.goto.split(':').map(Number); goto(l, c); return; }
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'check') check();
    else if (action === 'hint') openNextHint();
    else if (action === 'hint-open') openNextHint();
    else if (action === 'hint-full') { confirmFull = true; store.revealHint(id, 4); confirmFull = false; renderHints(); }
    else if (action === 'hint-cancel') { confirmFull = false; renderHints(); if (!isDesktop()) switchTab('code'); else cm.focus(); }
    else if (action === 'write-solution') writeSolution();
    else if (action === 'reset') {
      if (cm.getValue() === (ex.starter ?? '')) { toast('В редакторе и так стартовый код'); return; }
      if (window.confirm('Вернуть стартовый код? То, что ты написала в этой задаче, сотрётся.')) {
        clearMarkers(); cm.setValue(ex.starter ?? ''); store.setCode(id, ex.starter ?? ''); cm.focus();
      }
    }
  });
  const onKey = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); check(); } };
  document.addEventListener('keydown', onKey);

  renderHints();
  refreshSolvedBanner();
  if (/Mac|iPhone|iPad/.test(navigator.platform ?? '')) $('.kbd').textContent = '⌘ + Enter';

  return () => {
    clearTimeout(saveTimer); clearTimeout(typer);
    slowTimers.forEach(clearTimeout);
    store.setCode(id, cm.getValue());
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onKey);
  };
}
