// Загрузка курса (data/, собирается командой `node tools/build.mjs`) и навигация по задачам.
import config from '../../config.js';
import { store } from './store.js';
import { GIFTS, MODULE_GIFTS, FINAL_GIFT, giftSlug } from './data/gifts.js';

let index = null;
let flat = [];
const moduleCache = new Map();

export async function loadCourse() {
  if (index) return index;
  const res = await fetch('data/index.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Не удалось загрузить список задач (data/index.json)');
  index = await res.json();
  flat = [];
  index.modules.forEach((m, mi) => {
    m.number = mi + 1;
    m.exercises.forEach((e, ei) => {
      e.moduleId = m.id; e.moduleIndex = mi; e.indexInModule = ei; e.index = flat.length;
      flat.push(e);
    });
  });
  return index;
}

export const course = {
  get modules() { return index?.modules ?? []; },
  get all() { return flat; },
  get total() { return flat.length; },
  module(id) { return index.modules.find(m => m.id === id); },
  meta(id) { return flat.find(e => e.id === id); },
  next(id) { const e = this.meta(id); return e ? flat[e.index + 1] ?? null : null; },
  prev(id) { const e = this.meta(id); return e ? flat[e.index - 1] ?? null : null; },

  /** Полные данные задачи (описание, тесты, подсказки) — модуль подгружается при первом обращении. */
  async exercise(id) {
    const meta = this.meta(id);
    if (!meta) return null;
    if (!moduleCache.has(meta.moduleId)) {
      const p = fetch(`data/modules/${meta.moduleId}.json?v=${index.build ?? index.version}`)
        .then(r => { if (!r.ok) throw new Error('Не удалось загрузить модуль'); return r.json(); });
      moduleCache.set(meta.moduleId, p);
      p.catch(() => moduleCache.delete(meta.moduleId));
    }
    const mod = await moduleCache.get(meta.moduleId);
    return { ...meta, ...mod.exercises[id] };
  },

  /** Первая нерешённая задача (или null, если решено всё). */
  current() { return flat.find(e => !store.isSolved(e.id)) ?? null; },
  isUnlocked(id) {
    if (config.unlock === 'free') return true;
    const e = this.meta(id);
    if (!e) return false;
    if (store.isSolved(id)) return true;
    const cur = this.current();
    return !cur || e.index <= cur.index;
  },
  moduleSolved(m) { return m.exercises.filter(e => store.isSolved(e.id)).length; },
  moduleDone(m) { return m.exercises.every(e => store.isSolved(e.id)); },
  allDone() { return flat.length > 0 && flat.every(e => store.isSolved(e.id)); },
};

function toGift(entry, key, kind, ref) {
  const [img, emoji, name, note, fx] = entry;
  return { key, kind, ref, img: `assets/gifts/${giftSlug(img)}.png`, emoji, name, note, fx };
}

export const gifts = {
  forTask(id) {
    const e = course.meta(id);
    if (!e) return null;
    return toGift(GIFTS[e.index % GIFTS.length], `task:${id}`, 'task', id);
  },
  forModule(moduleId) {
    const m = course.module(moduleId);
    if (!m) return null;
    return toGift(MODULE_GIFTS[(m.number - 1) % MODULE_GIFTS.length], `module:${moduleId}`, 'module', moduleId);
  },
  final() { return toGift(FINAL_GIFT, 'final', 'final', 'course'); },
  /** Подарок по сохранённому ключу (для шкатулки). */
  byKey(key) {
    if (key === 'final') return this.final();
    const [kind, ...rest] = key.split(':');
    const ref = rest.join(':');
    return kind === 'module' ? this.forModule(ref) : this.forTask(ref);
  },
  get totalCount() { return course.total + course.modules.length + 1; },
};
