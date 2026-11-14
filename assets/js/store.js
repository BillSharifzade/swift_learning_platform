// Прогресс ученицы. Хранится в браузере (localStorage) — сервера у сайта нет.
const KEY = 'blp.progress.v1';

const blank = () => ({
  v: 1,
  startedAt: Date.now(),
  tasks: {},        // id → { solved, solvedAt, attempts, hints, code, gift }
  gifts: [],        // [{ key, kind: 'task'|'module'|'final', ref, at }]
  streak: { last: null, count: 0, best: 0 },
  days: {},         // 'YYYY-MM-DD' → сколько задач решено
  settings: { fontSize: 15 },
  lastTask: null,
  noteBag: {},      // чтобы записки не повторялись подряд
});

let state = blank();
let persistent = true;
const listeners = new Set();

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1) state = { ...blank(), ...parsed, settings: { ...blank().settings, ...(parsed.settings ?? {}) } };
    }
  } catch {
    persistent = false; // приватный режим или хранилище запрещено — работаем в памяти
  }
}

function write() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { persistent = false; }
  listeners.forEach(fn => fn(state));
}

read();

export const store = {
  get state() { return state; },
  get persistent() { return persistent; },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  task(id) {
    return state.tasks[id] ?? { solved: false, attempts: 0, hints: 0, code: null };
  },
  patchTask(id, patch) {
    state.tasks[id] = { ...this.task(id), ...patch };
    write();
  },
  setCode(id, code) {
    const t = this.task(id);
    if (t.code === code) return;
    state.tasks[id] = { ...t, code };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { persistent = false; }
  },
  addAttempt(id) {
    const t = this.task(id);
    this.patchTask(id, { attempts: (t.attempts ?? 0) + 1 });
    return (t.attempts ?? 0) + 1;
  },
  revealHint(id, level) {
    const t = this.task(id);
    if ((t.hints ?? 0) < level) this.patchTask(id, { hints: level });
  },
  isSolved(id) { return !!state.tasks[id]?.solved; },
  solvedCount() { return Object.values(state.tasks).filter(t => t.solved).length; },

  /** Отмечает задачу решённой. Возвращает true, если это первое решение. */
  solve(id) {
    const t = this.task(id);
    const first = !t.solved;
    state.tasks[id] = { ...t, solved: true, solvedAt: t.solvedAt ?? Date.now() };
    if (first) {
      const today = dayKey();
      state.days[today] = (state.days[today] ?? 0) + 1;
      const y = new Date(); y.setDate(y.getDate() - 1);
      const s = state.streak;
      if (s.last !== today) {
        s.count = s.last === dayKey(y) ? s.count + 1 : 1;
        s.last = today;
        s.best = Math.max(s.best, s.count);
      }
    }
    write();
    return first;
  },
  /** Текущая серия дней подряд (обнуляется, если вчера и сегодня задач не было). */
  streak() {
    const s = state.streak;
    if (!s.last) return 0;
    const y = new Date(); y.setDate(y.getDate() - 1);
    return (s.last === dayKey() || s.last === dayKey(y)) ? s.count : 0;
  },
  solvedToday() { return state.days[dayKey()] ?? 0; },

  hasGift(key) { return state.gifts.some(g => g.key === key); },
  addGift(gift) {
    if (this.hasGift(gift.key)) return false;
    state.gifts.push({ ...gift, at: Date.now() });
    write();
    return true;
  },

  setLastTask(id) { state.lastTask = id; write(); },
  setSetting(name, value) { state.settings[name] = value; write(); },

  /** Выбирает случайный элемент так, чтобы подряд не повторялось. */
  pick(bagName, list) {
    if (!list?.length) return '';
    let bag = (state.noteBag[bagName] ?? []).filter(i => i < list.length);
    if (!bag.length) bag = list.map((_, i) => i);
    const idx = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
    state.noteBag[bagName] = bag;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { persistent = false; }
    return list[idx];
  },

  export() { return JSON.stringify({ app: 'bonnies-learning-platform', exportedAt: new Date().toISOString(), state }, null, 2); },
  import(text) {
    const data = JSON.parse(text);
    const incoming = data?.state ?? data;
    if (!incoming || incoming.v !== 1 || typeof incoming.tasks !== 'object') throw new Error('Это не файл прогресса курса');
    state = { ...blank(), ...incoming, settings: { ...blank().settings, ...(incoming.settings ?? {}) } };
    write();
  },
  reset() { state = blank(); write(); },
};
