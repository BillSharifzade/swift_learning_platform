// Чтение задач из папки content/. Формат файлов описан в content/README.md.
import fs from 'node:fs/promises';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const CONTENT = path.join(ROOT, 'content');

function parseFrontMatter(text, file) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) throw new Error(`${file}: в начале файла нет блока ---`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i === -1) throw new Error(`${file}: непонятная строка в шапке: ${line}`);
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["'](.*)["']$/, '$1');
  }
  return { meta, body: text.slice(m[0].length) };
}

/** Содержимое всех блоков ``` ... ``` в тексте, по порядку. */
function fences(text) {
  const out = [];
  const re = /^```[^\n]*\n([\s\S]*?)^```[ \t]*$/gm;
  let m;
  while ((m = re.exec(text))) out.push(m[1].replace(/\n$/, ''));
  return out;
}

function parseRules(text, file) {
  const rules = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^-\s*(must|mustnot|mustraw|mustnotraw):\s*\/(.+)\/([a-z]*)\s*::\s*(.+)$/.exec(line);
    if (!m) throw new Error(`${file}: не удалось разобрать правило: ${line}`);
    try { new RegExp(m[2], m[3]); } catch (e) { throw new Error(`${file}: некорректное регулярное выражение в правиле: ${m[2]} (${e.message})`); }
    rules.push({ type: m[1], pattern: m[2], flags: m[3], message: m[4].trim() });
  }
  return rules;
}

export function parseExercise(text, file = '') {
  const { meta, body } = parseFrontMatter(text.replace(/\r\n?/g, '\n'), file);
  const sections = [];
  let current = null;
  for (const line of body.split('\n')) {
    const m = /^## @(\w+)[ \t]*(.*)$/.exec(line);
    if (m) { current = { name: m[1], arg: m[2].trim(), lines: [] }; sections.push(current); continue; }
    if (current) current.lines.push(line);
  }
  const get = name => sections.find(s => s.name === name);
  const text1 = name => (get(name)?.lines.join('\n') ?? '').trim();
  const code1 = name => { const s = get(name); return s ? (fences(s.lines.join('\n'))[0] ?? null) : null; };

  const ex = {
    title: meta.title ?? '',
    concept: meta.concept ?? '',
    swiftArgs: meta.swiftArgs ?? '',
    description: text1('description'),
    starter: code1('starter'),
    solution: code1('solution'),
    output: code1('output'),
    tests: code1('tests') ?? '',
    cases: [],
    rules: get('rules') ? parseRules(text1('rules'), file) : [],
    hints: ['hint1', 'hint2', 'hint3', 'hint4'].map(text1),
  };
  for (const s of sections.filter(s => s.name === 'case')) {
    const blocks = fences(s.lines.join('\n'));
    if (blocks.length !== 2) throw new Error(`${file}: в сценарии «${s.arg}» должно быть ровно два блока кода: входные данные и ожидаемый вывод`);
    ex.cases.push({ name: s.arg, inputs: blocks[0], output: blocks[1] });
  }
  const known = new Set(['description', 'starter', 'solution', 'output', 'tests', 'case', 'rules', 'hint1', 'hint2', 'hint3', 'hint4']);
  for (const s of sections) if (!known.has(s.name)) throw new Error(`${file}: неизвестный раздел «## @${s.name}»`);
  return ex;
}

/** Задача в том виде, в каком её получает сайт (решение подставлено в 4-ю подсказку). */
export function publicExercise(ex) {
  const solutionBlock = '```swift\n' + (ex.solution ?? '') + '\n```';
  const hints = ex.hints.map((h, i) => (i === 3 ? h.replace(/^\{\{solution\}\}[ \t]*$/m, solutionBlock) : h));
  const out = {
    title: ex.title, concept: ex.concept, description: ex.description,
    starter: ex.starter ?? '', solution: ex.solution ?? '', tests: ex.tests ?? '', hints,
  };
  if (ex.output != null) out.output = ex.output;
  if (ex.cases.length) out.cases = ex.cases;
  if (ex.rules.length) out.rules = ex.rules;
  if (ex.swiftArgs) out.swiftArgs = ex.swiftArgs;
  return out;
}

export async function listModules() {
  const dirs = (await fs.readdir(CONTENT, { withFileTypes: true }))
    .filter(d => d.isDirectory() && /^\d\d-/.test(d.name)).map(d => d.name).sort();
  return dirs;
}

export async function loadModule(dir) {
  const full = path.join(CONTENT, dir);
  const modText = await fs.readFile(path.join(full, 'module.md'), 'utf8');
  const { meta, body } = parseFrontMatter(modText.replace(/\r\n?/g, '\n'), `${dir}/module.md`);
  const files = (await fs.readdir(full)).filter(f => /^\d\d-.*\.md$/.test(f)).sort();
  const exercises = [];
  for (const f of files) {
    const file = path.join(full, f);
    const ex = parseExercise(await fs.readFile(file, 'utf8'), `${dir}/${f}`);
    exercises.push({ id: `${dir}/${f.replace(/\.md$/, '')}`, file: `content/${dir}/${f}`, ...ex });
  }
  return { id: dir, title: meta.title ?? '', project: meta.project ?? '', emoji: meta.emoji ?? '', summary: meta.summary ?? '', intro: body.trim(), exercises };
}
