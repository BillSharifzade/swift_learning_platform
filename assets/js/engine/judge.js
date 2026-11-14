// Судья: принимает код и задачу, запускает компилятор (через переданную функцию run)
// и возвращает вердикт с подробным объяснением. Работает одинаково в браузере и в Node.
import { buildSource, locate, applyCaseInputs, parseStdout, normalizeOutput, normalizeCode } from './harness.js';
import { parseDiagnostics, parseRuntime } from './compiler-output.js';
import { explainDiagnostic, explainNote, explainRuntime } from './explain.js';
import { precheck, scan, stripComments } from './precheck.js';

const MAX_PROBLEMS = 4;

function identifiersOf(code) {
  return new Set(scan(code).idents.map(i => i.text));
}

function loopVarChecker(codeLines) {
  const text = codeLines.join('\n');
  return name => new RegExp(`\\bfor\\s+(?:\\(?[^)\\n]*\\b)?${name}\\b[^\\n]*\\bin\\b`).test(text);
}

function paramChecker(codeLines) {
  const text = codeLines.join('\n');
  return name => new RegExp(`func\\s+[\\w]+\\s*(?:<[^>]*>)?\\s*\\([^)]*\\b${name}\\s*:`).test(text)
    || new RegExp(`\\(\\s*(?:\\w+\\s*,\\s*)*${name}\\s*(?:,\\s*\\w+\\s*)*\\)\\s*(?:->[^{]*)?\\bin\\b`).test(text);
}

/** Превращает диагностику компилятора в «карточку проблемы» с объяснением. */
function toProblem(d, map, env) {
  let loc = d.line > 0 ? locate(map, d.line) : { region: 'global', line: 0 };
  // Ошибку «чего-то не хватает в классе» компилятор ставит сразу после кода ученицы —
  // на первую строку служебной части. Возвращаем её в код ученицы.
  const sub = /must be provided by subclass of '(.+)'$/.exec(d.message);
  if (sub || (loc.region === 'harness' && d.line === map.harnessStart) || loc.region === 'global') {
    let line = 0;
    if (sub) {
      const parent = sub[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      line = env.codeLines.findIndex(l => new RegExp(`\\bclass\\s+\\w+\\s*:\\s*${parent}\\b`).test(l)) + 1;
    }
    if (!line && (sub || loc.region === 'harness')) {
      for (let i = env.codeLines.length - 1; i >= 0; i--) if (env.codeLines[i].trim()) { line = i + 1; break; }
    }
    if (line) { loc = { region: 'user', line }; d = { ...d, col: (env.codeLines[line - 1].search(/\S/) + 1) || 1, endCol: env.codeLines[line - 1].length + 1, rangeStart: 0 }; }
  }
  const notes = d.notes.map(n => {
    const nl = n.line > 0 ? locate(map, n.line) : { region: 'global', line: 0 };
    const note = { message: n.message, userLine: nl.region === 'user' ? nl.line : 0, fixit: n.fixit };
    return { ...note, text: explainNote(note) };
  });
  const srcLine = loc.region === 'user' ? (env.codeLines[loc.line - 1] ?? '') : (loc.region === 'tests' ? (env.testsLines[loc.line - 1] ?? '') : '');
  const opMatch = /(\+=|-=|\*=|\/=|==|!=|<=|>=|&&|\|\||[-+*\/%<>])\s*$/.exec(srcLine.slice(0, Math.max(0, d.col - 1)));
  // `let ok = total = 3000` или `print(a = b)` — присваивание там, где по смыслу сравнение
  const upToHere = srcLine.slice(0, Math.max(0, d.col - 1));
  const before = upToHere.slice(Math.max(upToHere.lastIndexOf('{'), upToHere.lastIndexOf(';')) + 1);
  const looksLikeComparison = /^cannot assign to value: '.+' is a 'let' constant$/.test(d.message)
    && /(?:[^=!<>]=(?!=)|\(|\bif\b|\bwhile\b|\breturn\b|&&|\|\||\?)/.test(before);
  const exp = explainDiagnostic(d.message, {
    region: loc.region, codeLines: env.codeLines, identifiers: env.identifiers,
    notes: d.notes, srcLine, isParam: env.isParam, isLoopVar: env.isLoopVar, afterOperator: opMatch ? opMatch[1] : '', looksLikeComparison,
  });
  // совет «замени let на var» не подходит для переменной цикла и параметра функции
  const constName = /^(?:cannot assign to value|left side of mutating operator isn't mutable|cannot use mutating member on immutable value): '(.+)' is a 'let' constant$/.exec(d.message)?.[1];
  const skipLetNote = constName && (looksLikeComparison || env.isLoopVar(constName) || env.isParam(constName));
  const lineLen = srcLine.length + 1;
  const col = Math.min(Math.max(1, d.rangeStart && d.rangeStart <= d.col ? d.rangeStart : d.col), Math.max(1, lineLen));
  let endCol = Math.min(Math.max(col + 1, d.endCol), lineLen + 1);
  // если компилятор не дал диапазон — подсветим слово под курсором
  if (endCol <= col + 1 && srcLine) {
    const m = /^[\wЀ-ӿ]+/.exec(srcLine.slice(col - 1));
    if (m) endCol = col + m[0].length;
  }
  return {
    ...exp,
    severity: d.severity, region: loc.region, line: loc.line, col: loc.region === 'user' ? col : d.col,
    caretCol: d.col, endCol, srcLine,
    original: d.message,
    notes: notes.filter(n => n.text && !(skipLetNote && /^change 'let' to 'var'/.test(n.message))).map(n => ({ text: n.text, line: n.userLine })),
    origin: 'compiler',
  };
}

function classifyDiagnostics(stderr, map, env) {
  const diags = parseDiagnostics(stderr);
  let problems = diags.map(d => toProblem(d, map, env));
  // «Эхо» одной и той же ошибки: оставляем самое точное объяснение.
  const eqLines = new Set(problems.filter(p => /^use of '=' in a boolean context/.test(p.original)).map(p => `${p.region}:${p.line}`));
  problems = problems.filter(p => !(eqLines.has(`${p.region}:${p.line}`) && /^cannot assign to (value|property)/.test(p.original)));
  const closureLines = new Set(problems.filter(p => /^contextual closure type .* expects/.test(p.original)).map(p => `${p.region}:${p.line}`));
  problems = problems.filter(p => !(closureLines.has(`${p.region}:${p.line}`) && /^cannot infer type of closure parameter/.test(p.original)));
  const byPos = (a, b) => a.line - b.line || (a.col ?? 0) - (b.col ?? 0);
  return {
    userErrors: problems.filter(p => p.severity === 'error' && p.region === 'user').sort(byPos),
    contractErrors: problems.filter(p => p.severity === 'error' && (p.region === 'tests' || p.region === 'harness')),
    otherErrors: problems.filter(p => p.severity === 'error' && (p.region === 'global' || p.region === 'prelude')),
    warnings: problems.filter(p => p.severity === 'warning' && p.region === 'user'),
  };
}

/** Сравнение вывода программы с ожидаемым — с человеческим описанием первого расхождения. */
export function diffOutput(expectedText, actualText) {
  const exp = normalizeOutput(expectedText);
  const act = normalizeOutput(actualText);
  if (exp.length === act.length && exp.every((l, i) => l === act[i])) return null;
  const res = { expected: exp, actual: act, line: 0, kind: 'differs', detail: '', col: 0 };
  if (!exp.length) {
    res.kind = 'extra';
    res.detail = 'В этом случае программа не должна ничего выводить, а она напечатала текст.';
    return res;
  }
  if (!act.length) {
    res.kind = 'empty';
    res.detail = 'Программа ничего не напечатала. Чтобы вывести текст на экран, используй `print(...)`.';
    return res;
  }
  let i = 0;
  while (i < exp.length && i < act.length && exp[i] === act[i]) i++;
  res.line = i + 1;
  const sortedEq = exp.length === act.length && [...exp].sort().join('\n') === [...act].sort().join('\n');
  if (sortedEq) {
    res.kind = 'order';
    res.detail = `Все строки на месте, но идут в другом порядке. Первое расхождение — в строке ${i + 1}.`;
    return res;
  }
  if (i >= act.length) {
    res.kind = 'missing';
    const n = exp.length - act.length;
    res.detail = `Начало совпадает, но в выводе не хватает ${n === 1 ? 'одной строки' : `строк: ${n}`}. Дальше должно идти: «${exp[i]}».`;
    return res;
  }
  if (i >= exp.length) {
    res.kind = 'extra';
    res.detail = `Всё нужное напечатано, но после этого идут лишние строки (начиная со строки ${i + 1}): «${act[i]}». Убери лишние \`print\`.`;
    return res;
  }
  const e = exp[i], a = act[i];
  const ec = [...e], ac = [...a]; // по символам: эмодзи — один символ, а не два
  const norm = { case: s => s.toLowerCase(), space: s => s.replace(/\s+/g, ''), punct: s => s.replace(/[.,!?:;…"'«»()—–-]/g, '').replace(/\s+/g, ' ').trim(), yo: s => s.replace(/ё/g, 'е').replace(/Ё/g, 'Е') };
  let k = 0;
  while (k < ec.length && k < ac.length && ec[k] === ac[k]) k++;
  res.col = k + 1;
  if (norm.case(e) === norm.case(a)) { res.kind = 'case'; res.detail = `В строке ${i + 1} всё совпадает, кроме больших и маленьких букв. Проверь регистр.`; }
  else if (norm.space(e) === norm.space(a)) { res.kind = 'space'; res.detail = `В строке ${i + 1} отличаются только пробелы: где-то лишний или, наоборот, пропущен. Различие начинается с символа №${k + 1}.`; }
  else if (norm.yo(e) === norm.yo(a)) { res.kind = 'yo'; res.detail = `В строке ${i + 1} отличие в буквах «е» и «ё».`; }
  else if (norm.punct(e) === norm.punct(a)) { res.kind = 'punct'; res.detail = `В строке ${i + 1} слова верные, но отличаются знаки препинания (точка, запятая, восклицательный знак, тире или кавычки).`; }
  else if (/Optional\(/.test(a) && !/Optional\(/.test(e)) { res.kind = 'optional'; res.detail = `В строке ${i + 1} напечаталось \`Optional(...)\`. Так Swift показывает значение, которого могло и не оказаться, — оно как будто в обёртке. Его нужно достать: для словаря — читать с запасным значением \`dict[key, default: 0]\`, а если ты уже знаешь опционалы — через \`??\` или \`if let\`.`; }
  else {
    const eCh = ec[k] === undefined ? 'конец строки' : `«${ec[k]}»`;
    const aCh = ac[k] === undefined ? 'конец строки' : `«${ac[k]}»`;
    res.detail = `Строка ${i + 1} отличается от ожидаемой. Расхождение начинается с символа №${k + 1}: должно быть ${eCh}, а у тебя ${aCh}.`;
  }
  return res;
}

function checkRules(exercise, code) {
  const rules = exercise.rules ?? [];
  if (!rules.length) return [];
  const clean = stripComments(code);
  const failures = [];
  for (const rule of rules) {
    let re;
    try { re = new RegExp(rule.pattern, rule.flags ?? ''); } catch { continue; }
    const raw = rule.type.endsWith('raw');
    const found = re.test(raw ? code : clean);
    const must = rule.type.startsWith('mustnot') ? false : true;
    if (must !== found) failures.push({ type: must ? 'must' : 'mustnot', message: rule.message });
  }
  return failures;
}

function runtimeProblem(run, map, env) {
  const rt = parseRuntime(run);
  if (!rt) return null;
  const exp = explainRuntime(rt);
  const frames = rt.frames.map(f => ({ ...f, ...locate(map, f.line) }));
  const userFrame = frames.find(f => f.region === 'user');
  const testFrame = frames.find(f => f.region === 'tests');
  let line = userFrame?.line ?? 0;
  if (!line && rt.fatalLine) {
    const l = locate(map, rt.fatalLine);
    if (l.region === 'user') line = l.line;
  }
  let suspectLoop = false;
  if (!line && rt.kind === 'timeout') {
    const idx = env.codeLines.findIndex(l => /^\s*(?:while\b|repeat\b)/.test(l));
    if (idx !== -1) { line = idx + 1; suspectLoop = true; }
  }
  const srcLine = line ? (env.codeLines[line - 1] ?? '') : '';
  const col = userFrame?.col || 1;
  let endCol = srcLine.length + 1;
  const m = /^[\wЀ-ӿ.\[\]!?]+/.exec(srcLine.slice(col - 1));
  if (userFrame?.col && m) endCol = col + m[0].length;
  return {
    ...exp,
    kind: rt.kind, severity: 'error', region: line ? 'user' : (testFrame ? 'tests' : 'global'),
    line, col: userFrame?.col ? col : (srcLine.search(/\S/) + 1 || 1), endCol, srcLine,
    original: rt.message || rt.crashWord || '',
    duringTest: testFrame ? (env.testsLines[testFrame.line - 1] ?? '').trim() : '',
    duringTestName: testFrame ? (/__\w+\(\s*"((?:[^"\\]|\\.)*)"/.exec(env.testsLines[testFrame.line - 1] ?? '')?.[1] ?? '') : '',
    notes: [
      ...(rt.kind === 'timeout' && /AsyncStream/.test(env.codeLines.join('\n')) && !/\.finish\s*\(/.test(env.codeLines.join('\n'))
        ? [{ text: 'В коде есть ‹AsyncStream›, но нигде не вызывается ‹continuation.finish()›. Без него цикл ‹for await› ждёт новых значений бесконечно.'.replace(/‹|›/g, '`'), line: 0 }] : []),
      ...(suspectLoop ? [{ text: 'Скорее всего, дело в этом цикле: проверь, что его условие когда-нибудь станет ложным.', line }] : []),
    ],
    origin: 'runtime',
  };
}

async function runOnce({ code, tests, swiftArgs, run }) {
  const built = buildSource({ code, tests, swiftArgs });
  const raw = await run(built.source, { args: swiftArgs ?? '' });
  return { built, raw };
}

function interpret({ built, raw, code, exercise, withTests }) {
  const codeLines = normalizeCode(code).split('\n');
  const env = { codeLines, testsLines: built.testsLinesText, identifiers: identifiersOf(code), isParam: paramChecker(codeLines), isLoopVar: loopVarChecker(codeLines) };
  const cls = classifyDiagnostics(raw.compile.stderr, built.map, env);
  const out = { warnings: cls.warnings.slice(0, 3), stdout: '', problems: [], tests: [], outputDiff: null };

  if (raw.compile.code !== 0 || !raw.run) {
    if (cls.userErrors.length) {
      out.status = 'compile';
      out.problems = cls.userErrors.slice(0, MAX_PROBLEMS);
      out.moreProblems = Math.max(0, cls.userErrors.length - MAX_PROBLEMS);
    } else if (cls.contractErrors.length) {
      out.status = 'contract';
      out.problems = cls.contractErrors.slice(0, 3);
    } else {
      out.status = 'compile';
      out.problems = cls.otherErrors.slice(0, 2);
      if (!out.problems.length) {
        out.problems = [{
          title: 'Код не удалось собрать', severity: 'error', region: 'global', line: 0, col: 0, endCol: 0, srcLine: '',
          what: 'Компилятор остановился, не указав конкретное место.', why: '', fix: 'Попробуй проверить ещё раз. Если не поможет — открой подсказку.',
          original: String(raw.compile.stderr ?? '').trim().split('\n').slice(0, 3).join(' '), notes: [], origin: 'compiler',
        }];
      }
    }
    return out;
  }

  const parsed = parseStdout(raw.run.stdout);
  out.stdout = parsed.userOut;
  out.tests = parsed.tests;
  const rt = runtimeProblem(raw.run, built.map, env);
  if (rt) {
    out.status = rt.kind === 'timeout' ? 'timeout' : 'runtime';
    out.problems = [rt];
    return out;
  }
  if (exercise.output != null && (exercise.output !== '' || exercise.compareEmpty)) {
    const diff = diffOutput(exercise.output, parsed.userOut);
    if (diff) { out.status = 'output'; out.outputDiff = diff; return out; }
  }
  if (withTests && (exercise.tests ?? '').trim()) {
    if (parsed.tests.some(t => !t.ok)) { out.status = 'tests'; return out; }
    if (!parsed.ended) {
      out.status = 'tests';
      out.tests = [...parsed.tests, { ok: false, name: 'Проверка не дошла до конца', got: '', want: '', hint: 'Программа завершилась раньше, чем закончились проверки. Нет ли в коде `exit(...)` или бесконечного ожидания?' }];
      return out;
    }
  }
  out.status = 'ok';
  return out;
}

/**
 * Главная функция.
 * exercise: { starter, tests, output, cases: [{ name, inputs, output }], rules, swiftArgs }
 * run(source, { args }) → { compile: { code, stderr }, run: { code, stdout, stderr, timedOut } | null }
 * onStage(stage) — необязательный колбэк для индикатора прогресса.
 */
export async function judge({ exercise, code, run, onStage = () => {} }) {
  const started = Date.now();
  const finish = r => ({ warnings: [], problems: [], tests: [], stdout: '', outputDiff: null, caseFailures: [], ruleFailures: [], ...r, ms: Date.now() - started });
  const clean = stripComments(code ?? '').trim();
  if (!clean) return finish({ status: 'empty' });

  onStage('precheck');
  const pre = precheck(code);
  if (pre.length) return finish({ status: 'precheck', problems: pre });

  onStage('compile');
  let base;
  try {
    base = await runOnce({ code, tests: exercise.tests ?? '', swiftArgs: exercise.swiftArgs, run });
  } catch (e) {
    return finish({ status: 'infra', infra: { kind: e?.kind ?? 'unknown', message: String(e?.message ?? e) } });
  }
  const res = interpret({ ...base, code, exercise, withTests: true });
  if (res.status !== 'ok') return finish(res);

  const ruleFailures = checkRules(exercise, code);
  if (ruleFailures.length) return finish({ ...res, status: 'rules', ruleFailures });

  const cases = exercise.cases ?? [];
  if (cases.length) {
    onStage('cases');
    const failures = [];
    let results;
    try {
      results = await Promise.all(cases.map(async c => {
        const applied = applyCaseInputs(code, c.inputs);
        if (applied.missing.length) return { c, missing: applied.missing };
        const r = await runOnce({ code: applied.code, tests: '', swiftArgs: exercise.swiftArgs, run });
        return { c, r, code: applied.code };
      }));
    } catch (e) {
      return finish({ status: 'infra', infra: { kind: e?.kind ?? 'unknown', message: String(e?.message ?? e) } });
    }
    for (const item of results) {
      if (item.missing) {
        failures.push({ name: item.c.name, inputs: item.c.inputs, kind: 'missing-input', missing: item.missing });
        continue;
      }
      const ir = interpret({ ...item.r, code: item.code, exercise: { output: item.c.output, compareEmpty: true }, withTests: false });
      if (ir.status !== 'ok') failures.push({ name: item.c.name, inputs: item.c.inputs, kind: ir.status, problems: ir.problems, outputDiff: ir.outputDiff, stdout: ir.stdout });
    }
    if (failures.length) return finish({ ...res, status: 'cases', caseFailures: failures });
  }
  return finish({ ...res, status: 'pass' });
}
