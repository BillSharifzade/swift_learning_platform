// Разбор «сырого» вывода компилятора Swift и аварийных сообщений программы.
// Здесь только структура (где, что, какой серьёзности). Объяснения — в explain.js.

const DIAG_RE = /^([^\s:]+):(\d+):(\d+): (error|warning|note): (.*)$/;
const OUR_FILE = /^(?:<source>|<stdin>|[^\s:]*example\.swift)$/;
const UNLOCATED_RE = /^(?:<unknown>:0: )?(error|warning): (.*)$/;
const GROUP_RE = /\s*\[#?[\w-]+\]\s*$/;

/**
 * Превращает stderr компилятора (в стиле llvm) в список диагностик:
 * { severity, line, col, endCol, message, srcLine, fixit, notes: [...] }
 * Номера строк — как в полном файле; пересчёт в строки ученицы делает judge.
 */
export function parseDiagnostics(stderr) {
  const lines = String(stderr ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let current = null; // последняя error/warning — к ней цепляются note
  let last = null;    // последняя запись любого вида — к ней относятся строки с кодом и «^~~~»
  let ctx = 0;
  const seen = new Set();

  for (const raw of lines) {
    const m = DIAG_RE.exec(raw);
    if (m) {
      const ours = OUR_FILE.test(m[1]); // заметки из стандартной библиотеки к коду ученицы не относятся
      const entry = {
        severity: m[4], line: ours ? Number(m[2]) : 0, col: ours ? Number(m[3]) : 0, endCol: ours ? Number(m[3]) + 1 : 0,
        message: m[5].replace(GROUP_RE, '').trim(), srcLine: '', fixit: '', notes: [], foreign: !ours,
      };
      ctx = 0;
      if (entry.severity === 'note') {
        if (current) current.notes.push(entry);
        last = ours ? entry : null;
        continue;
      }
      const key = `${entry.severity}|${entry.line}|${entry.col}|${entry.message}`;
      if (seen.has(key)) { current = null; last = null; continue; }
      seen.add(key);
      out.push(entry);
      current = entry;
      last = entry;
      continue;
    }
    const u = UNLOCATED_RE.exec(raw);
    if (u) {
      const msg = u[2].replace(GROUP_RE, '').trim();
      // служебные строки драйвера компилятора — не ошибки кода
      if (/command failed with exit code|fatalError|^unable to execute command/.test(msg)) { last = null; continue; }
      const key = `${u[1]}|0|0|${msg}`;
      if (!seen.has(key)) {
        seen.add(key);
        current = { severity: u[1], line: 0, col: 0, endCol: 0, message: msg, srcLine: '', fixit: '', notes: [] };
        out.push(current);
      }
      last = null;
      continue;
    }
    if (!last) continue;
    // после заголовка идут: строка кода, строка с ^~~~ и (иногда) строка с заменой
    if (ctx === 0) { last.srcLine = raw; ctx = 1; continue; }
    if (ctx === 1 && /^[\s~^]*\^[\s~^]*$/.test(raw)) {
      const first = raw.search(/\S/);
      const lastIdx = raw.replace(/\s+$/, '').length;
      // подчёркивание в выводе совпадает по позициям со строкой кода
      const caret = raw.indexOf('^');
      const start = Math.min(first, caret) + 1;
      const end = Math.max(lastIdx, caret + 1) + 1;
      // иногда диапазон включает операнды по бокам: `~~~ ^ ~` — берём весь размах
      last.rangeStart = start;
      last.endCol = Math.max(end, last.col + 1);
      ctx = 2;
      continue;
    }
    if (ctx === 2 && raw.trim() && !last.fixit) { last.fixit = raw.trim(); ctx = 3; continue; }
  }
  return out;
}

const FATAL_RE = /^(?:(\S+?):(\d+): )?Fatal error: (.*)$/;
const FRAME_RE = /^\s*(\d+)\s+(?:\[\w+\]\s+)?0x[0-9a-f]+\s+(.*?)\s+\+\s+\d+\s+in\s+\S+(?:\s+at\s+(\S+?):(\d+)(?::(\d+))?)?\s*$/;
const CAST_RE = /Could not cast value of type '([^']+)' \(0x[0-9a-f]+\) to '([^']+)'/;

/**
 * Разбирает аварийное завершение программы.
 * Возвращает null, если программа завершилась нормально.
 * frames — кадры стека из файла с кодом (номера строк полного файла), от места падения наружу.
 */
export function parseRuntime(run) {
  if (!run) return null;
  const stderr = String(run.stderr ?? '').replace(/\r\n?/g, '\n');
  if (run.timedOut) return { kind: 'timeout', message: '', frames: [], signal: null };
  const lines = stderr.split('\n');
  let fatal = null, fatalFile = '', fatalLine = 0, signal = null, crashWord = '';
  const frames = [];
  const fnCounts = new Map();
  for (const l of lines) {
    const f = FATAL_RE.exec(l);
    if (f && !fatal) { fatal = f[3]; fatalFile = f[1] ?? ''; fatalLine = Number(f[2] ?? 0); continue; }
    const s = /^\*\*\* Signal (\d+):/.exec(l);
    if (s) { signal = Number(s[1]); continue; }
    const c = /^\*\*\* Program crashed: (.+?) at 0x/.exec(l);
    if (c) { crashWord = c[1]; continue; }
    const fr = FRAME_RE.exec(l);
    if (fr) {
      const fn = fr[2];
      fnCounts.set(fn, (fnCounts.get(fn) ?? 0) + 1);
      if (fr[3] && /example\.swift$|<source>$/.test(fr[3])) {
        frames.push({ fn, line: Number(fr[4]), col: Number(fr[5] ?? 0) });
      }
    }
  }
  const cast = CAST_RE.exec(stderr);
  const crashed = fatal !== null || signal !== null || crashWord !== '' || (run.code ?? 0) >= 128 || (run.code ?? 0) < 0;
  if (!crashed) {
    if ((run.code ?? 0) !== 0) return { kind: 'exit', code: run.code, message: '', frames: [], signal: null };
    return null;
  }
  // Сообщение «Fatal error» из самого файла с кодом (fatalError, precondition, развёртка nil)
  const fatalInUserFile = /example\.swift$|<source>$/.test(fatalFile);
  const maxRepeat = Math.max(0, ...fnCounts.values());
  let kind = 'crash';
  if (!fatal && cast) kind = 'cast';
  else if (!fatal && signal === 11 && maxRepeat >= 4) kind = 'recursion';
  else if (!fatal && signal === 4) kind = 'overflow';
  return {
    kind,
    message: fatal ?? (cast ? cast[0] : ''),
    cast: cast ? { from: cast[1], to: cast[2] } : null,
    fatalLine: fatalInUserFile ? fatalLine : 0,
    frames, signal, crashWord, code: run.code,
  };
}
