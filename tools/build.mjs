#!/usr/bin/env node
// Собирает задачи из content/ в data/ — то, что читает сайт.
// Запуск: node tools/build.mjs            — все модули
//         node tools/build.mjs 01-first-steps 02-operators-strings — только перечисленные
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, listModules, loadModule, publicExercise } from './lib/content.mjs';

const DATA = path.join(ROOT, 'data');
await fs.rm(path.join(DATA, 'modules'), { recursive: true, force: true });
await fs.mkdir(path.join(DATA, 'modules'), { recursive: true });

const index = { version: 1, build: Date.now(), modules: [] };
let total = 0;
// node tools/build.mjs 01-first-steps 02-operators-strings — собрать только перечисленные модули
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
for (const dir of await listModules()) {
  if (only.length && !only.includes(dir)) continue;
  let mod;
  try { mod = await loadModule(dir); } catch (e) { console.warn(`  пропущен ${dir}: ${e.message}`); continue; }
  if (!mod.exercises.length) continue;
  const body = { id: mod.id, exercises: {} };
  for (const ex of mod.exercises) body.exercises[ex.id] = publicExercise(ex);
  await fs.writeFile(path.join(DATA, 'modules', `${mod.id}.json`), JSON.stringify(body));
  index.modules.push({
    id: mod.id, title: mod.title, project: mod.project, emoji: mod.emoji, summary: mod.summary, intro: mod.intro,
    exercises: mod.exercises.map(e => ({ id: e.id, title: e.title, concept: e.concept })),
  });
  total += mod.exercises.length;
  console.log(`  ${mod.id}: ${mod.exercises.length} задач — ${mod.title}`);
}
await fs.writeFile(path.join(DATA, 'index.json'), JSON.stringify(index));
console.log(`Готово: модулей — ${index.modules.length}, задач — ${total}. Файлы в data/`);
