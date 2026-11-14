// Быстрая локальная проверка до отправки компилятору.
// Ловит только то, в чём можно быть уверенной на 100%: незакрытые скобки и кавычки,
// «умные» кавычки и русские буквы, затесавшиеся в английские слова.

const OPEN = { '(': ')', '[': ']', '{': '}' };
const CLOSE = { ')': '(', ']': '[', '}': '{' };
const BR_NAME = {
  '(': 'круглая скобка `(`', ')': 'круглая скобка `)`',
  '[': 'квадратная скобка `[`', ']': 'квадратная скобка `]`',
  '{': 'фигурная скобка `{`', '}': 'фигурная скобка `}`',
};

// Русские буквы, которые выглядят как латинские.
const LOOKALIKE = {
  'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y', 'к': 'k', 'м': 'm', 'т': 't', 'н': 'h', 'в': 'b', 'і': 'i',
  'А': 'A', 'С': 'C', 'Е': 'E', 'О': 'O', 'Р': 'P', 'Х': 'X', 'К': 'K', 'М': 'M', 'Т': 'T', 'Н': 'H', 'В': 'B', 'І': 'I',
};

const isIdentStart = ch => /[A-Za-z_Ѐ-ӿ]/.test(ch);
const isIdentPart = ch => /[A-Za-z0-9_Ѐ-ӿ]/.test(ch);

/** «Скелет» имени: русские буквы-двойники заменены латинскими. Помогает находить `х` vs `x`. */
export function skeleton(name) {
  return [...String(name)].map(ch => LOOKALIKE[ch] ?? ch).join('');
}

/**
 * Проходит по коду и выдаёт: скобки, идентификаторы, строки и комментарии.
 * Понимает вложенные комментарии, многострочные и «сырые» строки, интерполяцию \( ).
 */
export function scan(code) {
  const src = String(code ?? '').replace(/\r\n?/g, '\n');
  const n = src.length;
  let i = 0, line = 1, col = 1;
  const brackets = [];   // { ch, line, col, index }
  const idents = [];     // { text, line, col }
  const issues = [];     // { kind, line, col, endCol, ... }
  const strings = [];    // { line, col, endLine, endCol }
  const keep = [];       // код без комментариев (для правил must/mustnot)

  const adv = (count = 1) => {
    for (let k = 0; k < count && i < n; k++) {
      if (src[i] === '\n') { line++; col = 1; } else col++;
      i++;
    }
  };
  const emit = (count = 1) => { keep.push(src.slice(i, i + count)); adv(count); };

  function readString(hashes) {
    // i стоит на открывающей кавычке
    const startLine = line, startCol = col - hashes;
    const multi = src.startsWith('"""', i);
    const closer = (multi ? '"""' : '"') + '#'.repeat(hashes);
    const esc = '\\' + '#'.repeat(hashes);
    emit(multi ? 3 : 1);
    while (i < n) {
      if (src.startsWith(closer, i)) {
        emit(closer.length);
        strings.push({ line: startLine, col: startCol, endLine: line, endCol: col });
        return;
      }
      if (!multi && src[i] === '\n') {
        issues.push({ kind: 'unterminated-string', line: startLine, col: startCol, endCol: startCol + 1 });
        return;
      }
      if (src.startsWith(esc, i)) {
        if (src[i + esc.length] === '(') {
          emit(esc.length + 1);
          readCode(true);
          continue;
        }
        emit(Math.min(esc.length + 1, n - i));
        continue;
      }
      emit(1);
    }
    issues.push({ kind: multi ? 'unterminated-multiline' : 'unterminated-string', line: startLine, col: startCol, endCol: startCol + (multi ? 3 : 1) });
  }

  function readCode(insideInterpolation) {
    let depth = 0;
    while (i < n) {
      const ch = src[i];
      if (ch === '/' && src[i + 1] === '/') {
        while (i < n && src[i] !== '\n') adv();
        continue;
      }
      if (ch === '/' && src[i + 1] === '*') {
        const sl = line, sc = col;
        let level = 0;
        while (i < n) {
          if (src[i] === '/' && src[i + 1] === '*') { level++; adv(2); }
          else if (src[i] === '*' && src[i + 1] === '/') { level--; adv(2); if (level === 0) break; }
          else adv();
        }
        if (level > 0) issues.push({ kind: 'unterminated-comment', line: sl, col: sc, endCol: sc + 2 });
        keep.push(' ');
        continue;
      }
      if (ch === '"') { readString(0); continue; }
      if (ch === '#') {
        let h = 0;
        while (src[i + h] === '#') h++;
        if (src[i + h] === '"') { emit(h); readString(h); continue; }
        emit(1);
        continue;
      }
      if ('“”„‟'.includes(ch)) {
        issues.push({ kind: 'curly-quote', line, col, endCol: col + 1, ch });
        emit(1);
        continue;
      }
      if (OPEN[ch]) {
        if (insideInterpolation && ch === '(') depth++;
        brackets.push({ ch, line, col, index: i });
        emit(1);
        continue;
      }
      if (CLOSE[ch]) {
        if (insideInterpolation && ch === ')') {
          if (depth === 0) { emit(1); return; }
          depth--;
        }
        brackets.push({ ch, line, col, index: i });
        emit(1);
        continue;
      }
      if (insideInterpolation && ch === '\n') return; // строка оборвалась — сообщит readString
      if (isIdentStart(ch)) {
        const sl = line, sc = col;
        let j = i;
        while (j < n && isIdentPart(src[j])) j++;
        idents.push({ text: src.slice(i, j), line: sl, col: sc });
        emit(j - i);
        continue;
      }
      emit(1);
    }
  }

  readCode(false);
  return { brackets, idents, issues, strings, codeNoComments: keep.join(''), lines: src.split('\n') };
}

/** Код без комментариев — по нему проверяются правила задачи (must / mustnot). */
export function stripComments(code) {
  return scan(code).codeNoComments;
}

function indentOf(lineText) {
  return /^[ \t]*/.exec(lineText ?? '')[0].replace(/\t/g, '    ').length;
}

function checkBrackets(s) {
  const stack = [];
  const problems = [];
  let suspect = null; // блок, который по отступам похож на незакрытый
  for (const b of s.brackets) {
    if (OPEN[b.ch]) { stack.push(b); continue; }
    const top = stack[stack.length - 1];
    if (!top) {
      problems.push({ kind: 'extra-close', line: b.line, col: b.col, endCol: b.col + 1, ch: b.ch });
      return problems;
    }
    if (top.ch !== CLOSE[b.ch]) {
      problems.push({ kind: 'mismatch', line: b.line, col: b.col, endCol: b.col + 1, ch: b.ch, open: top });
      return problems;
    }
    stack.pop();
    if (b.ch === '}' && !suspect) {
      const closeLine = s.lines[b.line - 1] ?? '';
      const openLine = s.lines[top.line - 1] ?? '';
      const closesAlone = closeLine.trimStart().startsWith('}');
      if (closesAlone && b.line !== top.line && indentOf(closeLine) < indentOf(openLine)) suspect = { open: top, close: b };
    }
  }
  if (stack.length) {
    const last = stack[stack.length - 1];
    problems.push({ kind: 'unclosed', line: last.line, col: last.col, endCol: last.col + 1, ch: last.ch, count: stack.length, suspect });
  }
  return problems;
}

function checkMixedScript(s) {
  const out = [];
  const seen = new Set();
  for (const id of s.idents) {
    const hasLatin = /[A-Za-z]/.test(id.text);
    const cyr = [...id.text].map((ch, k) => ({ ch, k })).filter(x => /[Ѐ-ӿ]/.test(x.ch));
    if (!hasLatin || !cyr.length) continue;
    const key = id.text + ':' + id.line;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: 'mixed-script', line: id.line, col: id.col, endCol: id.col + id.text.length, word: id.text, cyr, fixed: skeleton(id.text) });
  }
  return out;
}

function describe(issue, s) {
  const src = s.lines[issue.line - 1] ?? '';
  switch (issue.kind) {
    case 'unterminated-string':
      return {
        title: 'Строка не закрыта кавычкой',
        what: `На строке ${issue.line} открывается кавычка \`"\`, но до конца строки вторая, закрывающая, так и не встретилась.`,
        why: 'Текст в Swift живёт между двумя двойными кавычками: `"вот так"`. Без закрывающей кавычки Swift не понимает, где кончается текст и снова начинается код, — и считает текстом всё до конца строки.',
        fix: 'Поставь `"` в конце текста. Если скобка `)` тоже оказалась «внутри» текста — кавычка должна стоять перед ней: `print("Привет")`.',
      };
    case 'unterminated-multiline':
      return {
        title: 'Многострочный текст не закрыт',
        what: `На строке ${issue.line} начинается многострочный текст \`"""\`, но закрывающих трёх кавычек нет.`,
        why: 'Многострочная строка начинается с `"""` и заканчивается тоже `"""` — на отдельной строке.',
        fix: 'Добавь `"""` на новой строке после текста.',
      };
    case 'unterminated-comment':
      return {
        title: 'Комментарий не закрыт',
        what: `Комментарий, начатый \`/*\` на строке ${issue.line}, нигде не заканчивается.`,
        why: 'Всё после `/*` Swift считает комментарием, пока не встретит `*/`. Без него «закомментированным» оказывается весь остальной код.',
        fix: 'Добавь `*/` там, где комментарий должен закончиться. Для коротких заметок удобнее `//` — он действует только до конца строки.',
      };
    case 'curly-quote':
      return {
        title: 'Не та кавычка',
        what: `На строке ${issue.line} стоит «типографская» кавычка \`${issue.ch}\`. Она похожа на обычную, но для Swift это совсем другой символ.`,
        why: 'Строки в Swift ограничиваются только прямыми двойными кавычками `"`. Клавиатура телефона или текстовый редактор иногда сами заменяют их на «красивые» — и код перестаёт работать.',
        fix: 'Сотри эту кавычку и набери обычную `"` (Shift + 2 в английской раскладке).',
      };
    case 'extra-close':
      return {
        title: 'Лишняя закрывающая скобка',
        what: `На строке ${issue.line} стоит ${BR_NAME[issue.ch]}, но перед ней нет открывающей, которую она могла бы закрыть.`,
        why: 'Скобки всегда ходят парами: каждая закрывающая должна соответствовать открывающей, стоящей раньше.',
        fix: 'Скорее всего, эта скобка лишняя — удали её. Или где-то выше потерялась открывающая.',
      };
    case 'mismatch':
      return {
        title: 'Скобки перепутались',
        what: `На строке ${issue.line} стоит ${BR_NAME[issue.ch]}, а последней была открыта ${BR_NAME[issue.open.ch]} (строка ${issue.open.line}). Они не пара.`,
        why: 'Скобки закрываются в порядке, обратном открытию — как матрёшки. То, что открыто последним, должно закрыться первым, и именно «своей» скобкой.',
        fix: `Сначала закрой ${BR_NAME[issue.open.ch]} символом \`${OPEN[issue.open.ch]}\`, и только потом ставь \`${issue.ch}\`.`,
      };
    case 'unclosed': {
      const more = issue.count > 1 ? ` (всего незакрытых скобок: ${issue.count})` : '';
      let hintText = '';
      if (issue.ch === '{' && issue.suspect) {
        hintText = ` Подсказка по отступам: \`}\` на строке ${issue.suspect.close.line} закрыла блок, начатый на строке ${issue.suspect.open.line}. Похоже, именно этому блоку и не хватило своей скобки.`;
      }
      return {
        title: 'Скобка не закрыта',
        what: `${BR_NAME[issue.ch][0].toUpperCase() + BR_NAME[issue.ch].slice(1)} на строке ${issue.line} открыта, но так и не закрыта${more}.${hintText}`,
        why: issue.ch === '{'
          ? 'Фигурные скобки обозначают границы блока кода: тела функции, условия, цикла. Swift должен точно знать, где блок заканчивается, — иначе он «проглатывает» весь код до конца файла.'
          : 'У каждой открывающей скобки должна быть закрывающая пара — так Swift понимает, где заканчивается список аргументов или выражение.',
        fix: `Добавь \`${OPEN[issue.ch]}\` там, где эта часть кода должна закончиться.`,
      };
    }
    case 'mixed-script': {
      const letters = issue.cyr.map(x => `«${x.ch}» (буква №${x.k + 1})`).join(', ');
      return {
        title: 'Русская буква внутри английского слова',
        what: `В слове \`${issue.word}\` на строке ${issue.line} затесалась русская буква: ${letters}. Выглядит она точь-в-точь как латинская, но для компьютера это другой символ.`,
        why: 'Swift сравнивает имена посимвольно. `с` из русской раскладки и `c` из английской — разные буквы, поэтому слово с подменённой буквой превращается в совершенно другое, незнакомое имя.',
        fix: `Сотри слово и набери его заново в английской раскладке: \`${issue.fixed}\`.`,
      };
    }
    default:
      return { title: 'Что-то не так с записью кода', what: `Проверь строку ${issue.line}.`, why: '', fix: '' };
  }
}

/**
 * Возвращает список проблем (пустой, если всё чисто).
 * Каждая проблема: { kind, line, col, endCol, title, what, why, fix, source }.
 */
export function precheck(code) {
  const s = scan(code);
  let found = [...s.issues];
  // Регулярные выражения могут содержать «непарные» скобки — тогда скобки не трогаем.
  const hasRegex = /#\/|(?:^|[=(,:\s])\/[^/*\s][^\n]*\/[\s.,)\n]/.test(s.codeNoComments);
  if (!found.length && !hasRegex) found = checkBrackets(s);
  if (!found.length) found = checkMixedScript(s);
  found.sort((a, b) => a.line - b.line || a.col - b.col);
  return found.slice(0, 3).map(issue => ({
    ...describe(issue, s),
    kind: issue.kind, severity: 'error', region: 'user',
    line: issue.line, col: issue.col, endCol: issue.endCol,
    srcLine: s.lines[issue.line - 1] ?? '',
    origin: 'precheck',
  }));
}
