// Markdown → HTML и подсветка кода (тем же движком, что и редактор).
import { Marked } from '../../vendor/marked/marked.esm.js';
import { esc } from './util.js';

// Тексты курса — наши собственные, им разрешён любой Markdown.
const content = new Marked({ gfm: true, breaks: false });

// Тексты объяснений содержат кусочки кода ученицы и сообщений компилятора:
// сырой HTML в них экранируется, чтобы `Array<Int>` не «съедался» как тег.
const safe = new Marked({ gfm: true, breaks: false });
safe.use({ renderer: { html: html => esc(typeof html === 'string' ? html : html?.text ?? '') } });

/** Подсвечивает все блоки кода внутри элемента. */
export function highlightIn(root) {
  root.querySelectorAll('pre > code').forEach(code => {
    const pre = code.parentElement;
    if (pre.dataset.done) return;
    pre.dataset.done = '1';
    const lang = /language-(\w+)/.exec(code.className)?.[1] ?? '';
    const text = code.textContent.replace(/\n$/, '');
    if (lang === 'swift' && window.CodeMirror?.runMode) {
      pre.classList.add('code', 'code-swift');
      code.textContent = '';
      window.CodeMirror.runMode(text, 'swift', code);
    } else if (lang === 'swift') {
      pre.classList.add('code', 'code-swift');
    } else {
      pre.classList.add('code', 'code-out'); // вывод программы
      code.textContent = text;
    }
  });
  root.querySelectorAll('blockquote').forEach(q => {
    const t = q.textContent.trim();
    if (t.startsWith('💡')) q.classList.add('callout', 'callout-tip');
    else if (t.startsWith('⚠️') || t.startsWith('⚠')) q.classList.add('callout', 'callout-warn');
  });
  root.querySelectorAll('table').forEach(t => {
    if (t.parentElement.classList.contains('table-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    t.replaceWith(wrap);
    wrap.append(t);
  });
}

export function renderMarkdown(text) {
  return content.parse(String(text ?? ''));
}

export function renderSafe(text) {
  return safe.parse(String(text ?? ''));
}

export function renderSafeInline(text) {
  return safe.parseInline(String(text ?? ''));
}

const SECTION_KIND = { 'Контекст': 'context', 'Новое в Swift': 'theory', 'Что пригодится': 'theory', 'Задача': 'task', 'Пример': 'example' };

/**
 * Описание задачи: разделы «Контекст / Новое в Swift / Задача / Пример» становятся
 * отдельными блоками, чтобы «Задачу» можно было выделить визуально.
 */
export function renderDescription(text) {
  const box = document.createElement('div');
  box.innerHTML = renderMarkdown(text);
  const out = document.createElement('div');
  out.className = 'prose description';
  let section = null;
  for (const node of [...box.childNodes]) {
    if (node.nodeType === 1 && node.tagName === 'H3') {
      const title = node.textContent.trim();
      section = document.createElement('section');
      section.className = `desc-section desc-${SECTION_KIND[title] ?? 'other'}`;
      out.append(section);
    }
    (section ?? out).append(node);
  }
  highlightIn(out);
  return out;
}
