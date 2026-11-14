// Локальный запуск Swift в Docker — тот же компилятор (6.2.4), что и на сайте.
// Нужен только для проверки задач при разработке курса: node tools/validate.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { COMPILER_FLAGS } from '../../assets/js/engine/harness.js';

export const ROOT = path.resolve(import.meta.dirname, '../..');
const WORK = path.join(ROOT, '.cache/runner');
const RESULTS = path.join(ROOT, '.cache/results');
const CONTAINER = 'blp-swift-runner';
const IMAGE = 'swift:6.2';

function sh(cmd, args, { timeoutMs = 120000 } = {}) {
  return new Promise(resolve => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', done = false;
    const timer = setTimeout(() => { if (!done) p.kill('SIGKILL'); }, timeoutMs);
    p.stdout.on('data', d => { stdout += d; });
    p.stderr.on('data', d => { stderr += d; });
    p.on('error', e => { done = true; clearTimeout(timer); resolve({ code: -1, stdout, stderr: stderr + String(e) }); });
    p.on('close', code => { done = true; clearTimeout(timer); resolve({ code: code ?? -1, stdout, stderr }); });
  });
}

let ensured = null;
export function ensureContainer() {
  ensured ??= (async () => {
    await fs.mkdir(WORK, { recursive: true });
    await fs.mkdir(RESULTS, { recursive: true });
    const st = await sh('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER]);
    if (st.code === 0 && st.stdout.trim() === 'true') return;
    await sh('docker', ['rm', '-f', CONTAINER]);
    const run = await sh('docker', ['run', '-d', '--name', CONTAINER, '--network', 'none', '-v', `${WORK}:/work`, '-w', '/work', IMAGE, 'sleep', 'infinity']);
    if (run.code !== 0) throw new Error('Не удалось запустить Docker-контейнер со Swift:\n' + run.stderr);
  })();
  return ensured;
}

/**
 * Компилирует и запускает исходник. Формат ответа совпадает с тем, что возвращает
 * браузерный раннер (assets/js/engine/runner.js), поэтому judge один и тот же.
 */
export async function runSwift(source, { args = '', timeoutSec = 10, cache = true } = {}) {
  await ensureContainer();
  const key = crypto.createHash('sha256').update(IMAGE + '\0' + COMPILER_FLAGS + '\0' + args + '\0' + source).digest('hex');
  const cacheFile = path.join(RESULTS, key + '.json');
  if (cache) {
    try { return JSON.parse(await fs.readFile(cacheFile, 'utf8')); } catch { /* нет в кэше */ }
  }
  const id = crypto.randomBytes(6).toString('hex');
  const dir = path.join(WORK, id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'example.swift'), source);
  const { uid, gid } = os.userInfo();
  const base = ['exec', '-u', `${uid}:${gid}`, '-e', 'HOME=/tmp', '-w', `/work/${id}`];
  const compile = await sh('docker', [...base, CONTAINER, 'bash', '-c',
    `swiftc -g ${COMPILER_FLAGS} ${args} -o output.s example.swift`]);
  let run = null;
  if (compile.code === 0) {
    const r = await sh('docker', [...base, '-e', 'SWIFT_BACKTRACE=enable=yes,color=no', CONTAINER,
      'timeout', '-s', 'KILL', String(timeoutSec), './output.s'], { timeoutMs: (timeoutSec + 20) * 1000 });
    run = { code: r.code, stdout: r.stdout, stderr: r.stderr, timedOut: r.code === 137 };
  }
  await fs.rm(dir, { recursive: true, force: true });
  const result = { compile: { code: compile.code, stderr: compile.stderr }, run };
  if (cache) await fs.writeFile(cacheFile, JSON.stringify(result));
  return result;
}
