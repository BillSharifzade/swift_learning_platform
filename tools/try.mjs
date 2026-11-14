#!/usr/bin/env node
// Прогоняет произвольный код через проверку конкретной задачи — так же, как это делает сайт.
// Удобно, чтобы убедиться: типичное НЕПРАВИЛЬНОЕ решение действительно не проходит.
//   node tools/try.mjs content/03-conditions/02-open-hours.md my-attempt.swift
//   node tools/try.mjs content/03-conditions/02-open-hours.md --starter | --solution
import fs from 'node:fs/promises';
import { parseExercise } from './lib/content.mjs';
import { runSwift } from './lib/local-runner.mjs';
import { judge } from '../assets/js/engine/judge.js';

const [file, src] = process.argv.slice(2);
if (!file || !src) { console.error('Использование: node tools/try.mjs <задача.md> <код.swift | --starter | --solution>'); process.exit(2); }
const ex = parseExercise(await fs.readFile(file, 'utf8'), file);
const code = src === '--starter' ? ex.starter : src === '--solution' ? ex.solution : await fs.readFile(src, 'utf8');
const r = await judge({ exercise: ex, code, run: (s, o) => runSwift(s, { args: o?.args ?? '', cache: false }) });

console.log(`ВЕРДИКТ: ${r.status}  (${r.ms} мс)`);
if (r.stdout) console.log('── вывод программы ──\n' + r.stdout);
for (const p of r.problems) {
  console.log(`\n✗ ${p.title}  [${p.region}, строка ${p.line}, столбец ${p.col}]`);
  if (p.srcLine) console.log(`    ${p.srcLine}`);
  console.log(`  Что произошло: ${p.what}`);
  if (p.why) console.log(`  Почему: ${p.why}`);
  if (p.fix) console.log(`  Как исправить: ${p.fix}`);
  if (p.original) console.log(`  Оригинал: ${p.original}`);
  if (p.duringTest) console.log(`  Во время теста: ${p.duringTest}`);
}
if (r.outputDiff) {
  console.log(`\n✗ Вывод отличается: ${r.outputDiff.detail}`);
  console.log('  ожидалось:\n' + r.outputDiff.expected.map(l => '    | ' + l).join('\n'));
  console.log('  получено:\n' + r.outputDiff.actual.map(l => '    | ' + l).join('\n'));
}
for (const t of r.tests) console.log(`  ${t.ok ? '✓' : '✗'} ${t.name}${t.ok ? '' : ` — получено ${t.got || '—'}, ожидалось ${t.want || '—'}${t.hint ? ' · ' + t.hint : ''}`}`);
for (const f of r.ruleFailures) console.log(`  ✗ правило: ${f.message}`);
for (const c of r.caseFailures) {
  console.log(`  ✗ сценарий «${c.name}» (${c.kind})`);
  if (c.outputDiff) console.log(`      ${c.outputDiff.detail}`);
}
for (const w of r.warnings) console.log(`  ⚠ ${w.title} (строка ${w.line})`);
