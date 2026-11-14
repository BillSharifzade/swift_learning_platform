// Отправляет код настоящему компилятору Swift (Compiler Explorer, godbolt.org)
// и приводит ответ к виду, который понимает judge.js.
import { COMPILER_FLAGS } from './harness.js';

class InfraError extends Error {
  constructor(kind, message) { super(message); this.kind = kind; }
}

const text = arr => (arr ?? []).map(x => x.text ?? '').join('\n');

export function createRunner(cfg) {
  const url = cfg.endpoint.replace('{id}', cfg.id);
  const memo = new Map(); // одинаковый код не отправляем дважды за сеанс

  return async function run(source, { args = '' } = {}) {
    const userArguments = `${COMPILER_FLAGS} ${args}`.trim();
    const key = userArguments + '\u0000' + source;
    if (memo.has(key)) return memo.get(key);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new InfraError('offline', 'Нет подключения к интернету');
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 60000);
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          source,
          options: {
            userArguments,
            compilerOptions: { executorRequest: true },
            filters: { execute: true },
            tools: [], libraries: [],
          },
          lang: 'swift',
          allowStoreCodeDebug: false,
        }),
        signal: ctrl.signal,
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw new InfraError('timeout', 'Компилятор не ответил вовремя');
      throw new InfraError('network', 'Не удалось связаться с компилятором');
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 429) throw new InfraError('busy', 'Компилятор сейчас перегружен');
    if (!res.ok) throw new InfraError('http', `Компилятор ответил ошибкой ${res.status}`);

    let j;
    try { j = await res.json(); } catch { throw new InfraError('http', 'Компилятор прислал непонятный ответ'); }

    const build = j.buildResult ?? {};
    if (build.timedOut) throw new InfraError('timeout', 'Компиляция заняла слишком много времени');
    const compileCode = typeof build.code === 'number' ? build.code : (j.didExecute ? 0 : 1);
    const executed = compileCode === 0 && j.didExecute !== false;
    const result = {
      compile: { code: compileCode, stderr: text(build.stderr) },
      run: executed ? { code: j.code ?? 0, stdout: text(j.stdout), stderr: text(j.stderr), timedOut: !!j.timedOut } : null,
    };
    memo.set(key, result);
    if (memo.size > 40) memo.delete(memo.keys().next().value);
    return result;
  };
}
