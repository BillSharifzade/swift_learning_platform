// Сборка программы для компилятора и разбор того, что она напечатала.
// Модуль не зависит от браузера: им пользуются и сайт, и инструменты проверки (tools/).

export const MODULE_NAME = 'Playground';
// Флаги компилятора — одинаковые для сайта и для локальной проверки задач.
// -no-emit-module-separately: иначе при ошибке в «верхнем» коде Swift не проверяет тела функций
// и ошибки внутри них не показываются.
export const COMPILER_FLAGS = `-diagnostic-style llvm -module-name ${MODULE_NAME} -no-emit-module-separately`;
export const BEGIN_MARK = '⟦SW:BEGIN⟧';
export const END_MARK = '⟦SW:END⟧';
const REC_PREFIX = '⟦SW:T|';
const REC_SUFFIX = '⟧';

// Первая строка программы. Отключает буферизацию вывода: если программа упадёт,
// всё, что она успела напечатать, не потеряется. Из-за неё строки кода ученицы
// сдвинуты на LINE_OFFSET.
const PRELUDE = 'import Glibc; setvbuf(stdout, nil, _IONBF, 0)';
const PRELUDE_SWIFT6 = '// строка зарезервирована проверкой';
export const LINE_OFFSET = 1;

// Вспомогательные функции для скрытых тестов. Без глобального состояния,
// чтобы работать и в режиме Swift 6.
const HARNESS = String.raw`
func __sw_esc(_ s: String) -> String {
    var r = ""
    for u in s.unicodeScalars {
        switch u {
        case "\\": r += "\\\\"
        case "\n": r += "\\n"
        case "\r": r += "\\r"
        case "|": r += "\\p"
        default: r.unicodeScalars.append(u)
        }
    }
    return r
}
func __sw_rec(_ parts: [String]) {
    print("\n⟦SW:T|" + parts.map(__sw_esc).joined(separator: "|") + "⟧")
}
func __eq<T: Equatable>(_ name: String, _ got: T, _ want: T, hint: String = "") {
    if got == want { __sw_rec(["ok", name]) }
    else { __sw_rec(["fail", name, String(reflecting: got), String(reflecting: want), hint]) }
}
func __ok(_ name: String, _ condition: Bool, hint: String = "") {
    if condition { __sw_rec(["ok", name]) } else { __sw_rec(["fail", name, "", "", hint]) }
}
func __near(_ name: String, _ got: Double, _ want: Double, eps: Double = 0.001, hint: String = "") {
    let diff = got - want
    if diff <= eps && diff >= -eps { __sw_rec(["ok", name]) }
    else { __sw_rec(["fail", name, String(reflecting: got), String(reflecting: want), hint]) }
}
func __pass(_ name: String) { __sw_rec(["ok", name]) }
func __fail(_ name: String, _ message: String = "") { __sw_rec(["fail", name, "", "", message]) }
`.trim();

export function normalizeCode(code) {
  let s = String(code ?? '').replace(/\r\n?/g, '\n').replace(/\u00A0/g, ' ');
  if (!s.endsWith('\n')) s += '\n';
  return s;
}

export function isSwift6(swiftArgs = '') {
  return /-swift-version\s+6\b/.test(swiftArgs);
}

/**
 * Собирает полный исходник: служебная строка + код ученицы + помощники + скрытые тесты.
 * Возвращает и «карту» строк, чтобы потом понять, к какой части относится ошибка.
 */
export function buildSource({ code, tests = '', swiftArgs = '' }) {
  const user = normalizeCode(code);
  const userLines = user.split('\n').length - 1;
  const prelude = isSwift6(swiftArgs) ? PRELUDE_SWIFT6 : PRELUDE;
  const head = `${prelude}\n${user}`;
  const harnessBlock = `${HARNESS}\nprint("\\n${BEGIN_MARK}")\n`;
  const testsBody = tests.trim() ? tests.replace(/\r\n?/g, '\n').replace(/\n*$/, '\n') : '';
  const tail = `print("\\n${END_MARK}")\n`;
  const source = head + harnessBlock + testsBody + tail;
  const harnessStart = LINE_OFFSET + userLines + 1; // номер строки в полном файле
  const testsStart = harnessStart + harnessBlock.split('\n').length - 1;
  const testsLines = testsBody ? testsBody.split('\n').length - 1 : 0;
  return {
    source,
    map: { offset: LINE_OFFSET, userLines, harnessStart, testsStart, testsEnd: testsStart + testsLines - 1 },
    testsLinesText: testsBody ? testsBody.split('\n') : [],
  };
}

/** К какой части файла относится строка полного исходника. */
export function locate(map, fullLine) {
  if (fullLine <= map.offset) return { region: 'prelude', line: 0 };
  const userLine = fullLine - map.offset;
  if (userLine <= map.userLines) return { region: 'user', line: userLine };
  if (fullLine >= map.testsStart && fullLine <= map.testsEnd) {
    return { region: 'tests', line: fullLine - map.testsStart + 1 };
  }
  return { region: 'harness', line: fullLine - map.harnessStart + 1 };
}

/**
 * Подменяет «входные данные» в коде ученицы для дополнительного сценария проверки.
 * inputs — строки вида `let total = 1200`, каждая заменяет объявление с тем же именем.
 */
export function applyCaseInputs(code, inputs) {
  let out = normalizeCode(code);
  const missing = [];
  const lines = String(inputs || '').replace(/\r\n?/g, '\n').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  for (const decl of lines) {
    const m = /^(?:let|var)\s+([A-Za-z_\u0400-\u04FF][\w\u0400-\u04FF]*)/.exec(decl);
    if (!m) continue;
    const name = m[1];
    const re = new RegExp(`^[ \\t]*(?:let|var)[ \\t]+${name}(?![\\w\\u0400-\\u04FF])[^\\n]*$`, 'm');
    if (re.test(out)) out = out.replace(re, () => decl);
    else missing.push(name);
  }
  return { code: out, missing };
}

/** Имена входных переменных сценария. */
export function caseInputNames(inputs) {
  const names = [];
  for (const l of String(inputs || '').split('\n')) {
    const m = /^\s*(?:let|var)\s+([A-Za-z_\u0400-\u04FF][\w\u0400-\u04FF]*)/.exec(l);
    if (m) names.push(m[1]);
  }
  return names;
}

function unesc(s) {
  return s.replace(/\\(\\|n|r|p)/g, (_, c) => ({ '\\': '\\', n: '\n', r: '\r', p: '|' }[c]));
}

/** Убирает имя модуля из отладочных описаний: Playground.Order → Order. */
export function prettyValue(s) {
  return String(s ?? '').replace(new RegExp(`\\b${MODULE_NAME}\\.`, 'g'), '');
}

/**
 * Делит stdout на вывод программы ученицы и записи тестов.
 */
export function parseStdout(stdout) {
  const text = String(stdout ?? '').replace(/\r\n?/g, '\n');
  let idx = text.indexOf('\n' + BEGIN_MARK);
  let userOut, rest;
  if (idx === -1 && text.startsWith(BEGIN_MARK)) { userOut = ''; rest = text; }
  else if (idx === -1) { userOut = text; rest = ''; }
  else { userOut = text.slice(0, idx); rest = text.slice(idx + 1); }
  const began = rest.startsWith(BEGIN_MARK);
  const tests = [];
  let ended = false;
  let extraOut = [];
  for (const line of rest.split('\n')) {
    if (line === BEGIN_MARK || line === '') continue;
    if (line === END_MARK) { ended = true; continue; }
    if (line.startsWith(REC_PREFIX) && line.endsWith(REC_SUFFIX)) {
      const parts = line.slice(REC_PREFIX.length, -REC_SUFFIX.length).split('|').map(unesc);
      const [status, name = '', got = '', want = '', hint = ''] = parts;
      tests.push({ ok: status === 'ok', name, got: prettyValue(got), want: prettyValue(want), hint });
    } else {
      extraOut.push(line); // то, что код напечатал во время тестов
    }
  }
  return { userOut, began, ended, tests, extraOut: extraOut.join('\n') };
}

/** Приводит вывод к виду для сравнения: без хвостовых пробелов и пустых строк в конце. */
export function normalizeOutput(s) {
  const lines = String(s ?? '').replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/[ \t\u00A0]+$/g, ''));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}
