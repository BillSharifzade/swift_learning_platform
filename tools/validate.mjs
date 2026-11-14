#!/usr/bin/env node
// Проверяет задачи: формат файла, решение проходит, стартовый код — нет.
// Запуск:
//   node tools/validate.mjs                      — все модули
//   node tools/validate.mjs 03-conditions        — один модуль
//   node tools/validate.mjs content/03-conditions/02-open-hours.md   — одна задача
//   флаги: --no-cache (не брать результаты из кэша), --verbose
import path from 'node:path';
import { listModules, loadModule } from './lib/content.mjs';
import { runSwift } from './lib/local-runner.mjs';
import { judge } from '../assets/js/engine/judge.js';
import { caseInputNames } from '../assets/js/engine/harness.js';

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const targets = args.filter(a => !a.startsWith('--'));
const useCache = !flags.has('--no-cache');
const verbose = flags.has('--verbose');

const run = (source, o) => runSwift(source, { args: o?.args ?? '', timeoutSec: 10, cache: useCache });

function describeResult(r) {
  const lines = [`статус: ${r.status}`];
  for (const p of r.problems ?? []) lines.push(`  • [${p.region ?? ''} стр. ${p.line}] ${p.title} — ${p.original ?? ''}`);
  if (r.outputDiff) {
    lines.push(`  • вывод: ${r.outputDiff.detail}`);
    lines.push(`    ожидалось: ${JSON.stringify(r.outputDiff.expected)}`);
    lines.push(`    получено:  ${JSON.stringify(r.outputDiff.actual)}`);
  }
  for (const t of (r.tests ?? []).filter(t => !t.ok)) lines.push(`  • тест «${t.name}»: получено ${t.got || '—'}, ожидалось ${t.want || '—'} ${t.hint ? '(' + t.hint + ')' : ''}`);
  for (const f of r.ruleFailures ?? []) lines.push(`  • правило (${f.type}): ${f.message}`);
  for (const c of r.caseFailures ?? []) {
    lines.push(`  • сценарий «${c.name}»: ${c.kind}${c.missing ? ' — не найдены объявления: ' + c.missing.join(', ') : ''}`);
    if (c.outputDiff) { lines.push(`    ожидалось: ${JSON.stringify(c.outputDiff.expected)}`); lines.push(`    получено:  ${JSON.stringify(c.outputDiff.actual)}`); }
    for (const p of c.problems ?? []) lines.push(`    - ${p.title} — ${p.original ?? ''}`);
  }
  if (r.infra) lines.push(`  • инфраструктура: ${r.infra.message}`);
  return lines.join('\n');
}

function staticChecks(ex) {
  const errors = [], notes = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  need(ex.title, 'нет title в шапке');
  need(ex.concept, 'нет concept в шапке');
  need(ex.title.length <= 60, `title длиннее 60 символов (${ex.title.length})`);
  need(ex.description.length >= 900, `описание слишком короткое (${ex.description.length} симв., нужно от 900)`);
  need(/^### Контекст\s*$/m.test(ex.description), 'в описании нет раздела «### Контекст»');
  need(/^### (Новое в Swift|Что пригодится)\s*$/m.test(ex.description), 'в описании нет раздела «### Новое в Swift» (или «### Что пригодится»)');
  need(/^### Задача\s*$/m.test(ex.description), 'в описании нет раздела «### Задача»');
  need(ex.starter != null, 'нет раздела @starter с блоком кода');
  need(ex.solution != null, 'нет раздела @solution с блоком кода');
  need((ex.output != null && ex.output !== '') || ex.tests.trim(), 'нет ни @output, ни @tests — задачу нечем проверять');
  need(ex.starter !== ex.solution, 'стартовый код совпадает с решением');
  ex.hints.forEach((h, i) => need(h.length >= 120, `подсказка ${i + 1} слишком короткая или отсутствует (${h.length} симв.)`));
  need(!/```/.test(ex.hints[0]), 'подсказка 1 должна быть словами, без блоков кода');
  need(/```swift/.test(ex.hints[1]), 'в подсказке 2 должен быть фрагмент кода (```swift)');
  need(/```swift/.test(ex.hints[2]), 'в подсказке 3 должен быть почти готовый код (```swift)');
  need(/^\{\{solution\}\}[ \t]*$/m.test(ex.hints[3]), 'в подсказке 4 должна быть отдельная строка {{solution}}');
  need(ex.hints[3].replace('{{solution}}', '').trim().length >= 400, 'в подсказке 4 слишком короткий разбор (нужно от 400 симв. помимо кода)');
  for (const c of ex.cases) {
    need(c.name, 'у сценария @case нет названия');
    for (const name of caseInputNames(c.inputs)) {
      const re = new RegExp(`^[ \\t]*(?:let|var)[ \\t]+${name}(?![\\w\\u0400-\\u04FF])[^\\n]*$`, 'm');
      need(re.test(ex.starter ?? ''), `сценарий «${c.name}»: в стартовом коде нет однострочного объявления ${name}`);
      need(re.test(ex.solution ?? ''), `сценарий «${c.name}»: в решении нет однострочного объявления ${name}`);
    }
  }
  if (/\bimport\s+(UIKit|SwiftUI|Combine)\b/.test(ex.solution ?? '')) errors.push('UIKit/SwiftUI/Combine недоступны');
  if (/\breadLine\s*\(/.test(ex.solution ?? '')) errors.push('readLine() использовать нельзя — ввода нет');
  if (ex.output != null && !ex.cases.length && !ex.tests.trim()) notes.push('проверяется только вывод одного сценария');
  return { errors, notes };
}

async function validateExercise(ex) {
  const { errors, notes } = staticChecks(ex);
  if (ex.starter == null || ex.solution == null) return { errors, notes };
  const sol = await judge({ exercise: ex, code: ex.solution, run });
  if (sol.status !== 'pass') errors.push('РЕШЕНИЕ НЕ ПРОХОДИТ ПРОВЕРКУ:\n' + describeResult(sol).split('\n').map(l => '      ' + l).join('\n'));
  else for (const w of sol.warnings ?? []) notes.push(`предупреждение компилятора в решении (стр. ${w.line}): ${w.original}`);
  const st = await judge({ exercise: ex, code: ex.starter, run });
  if (st.status === 'pass') errors.push('стартовый код уже проходит проверку — задача решена до начала');
  if (st.status === 'infra') errors.push('сбой инфраструктуры при проверке стартового кода: ' + st.infra?.message);
  if (verbose) notes.push(`стартовый код → ${st.status}`);
  return { errors, notes };
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; results[i] = await fn(items[i], i); }
  }));
  return results;
}

const all = await listModules();
let selected = [];
if (!targets.length) selected = all.map(m => ({ module: m, only: null }));
for (const t of targets) {
  const norm = t.replace(/^content\//, '').replace(/\/$/, '');
  const [mod, file] = norm.split('/');
  if (!all.includes(mod)) { console.error(`Нет модуля: ${mod}`); process.exit(2); }
  selected.push({ module: mod, only: file ? file.replace(/\.md$/, '') : null });
}

let failed = 0, count = 0;
for (const sel of selected) {
  let mod;
  try { mod = await loadModule(sel.module); } catch (e) { console.error(`✗ ${sel.module}: ${e.message}`); failed++; continue; }
  const list = mod.exercises.filter(e => !sel.only || e.id.endsWith('/' + sel.only));
  if (!sel.only) {
    if (!mod.title) { console.error(`✗ ${sel.module}/module.md: нет title`); failed++; }
    if (!mod.project) { console.error(`✗ ${sel.module}/module.md: нет project`); failed++; }
    if (mod.intro.length < 200) { console.error(`✗ ${sel.module}/module.md: вступление слишком короткое`); failed++; }
  }
  console.log(`\n${mod.id} — ${mod.title} (${list.length})`);
  const results = await pool(list, 3, async ex => {
    try { return await validateExercise(ex); } catch (e) { return { errors: ['исключение: ' + (e.stack ?? e.message)], notes: [] }; }
  });
  list.forEach((ex, i) => {
    const r = results[i];
    count++;
    if (r.errors.length) failed++;
    console.log(`  ${r.errors.length ? '✗' : '✓'} ${path.basename(ex.file)} — ${ex.title}`);
    for (const e of r.errors) console.log(`      ОШИБКА: ${e}`);
    for (const n of r.notes) console.log(`      · ${n}`);
  });
}
console.log(`\nПроверено задач: ${count}. ${failed ? `С ошибками: ${failed}.` : 'Все в порядке ✓'}`);
process.exit(failed ? 1 : 0);
