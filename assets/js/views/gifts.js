// Шкатулка: все полученные подарки.
import config from '../../../config.js';
import { store } from '../store.js';
import { course, gifts } from '../course.js';
import { h, esc, plural, icons } from '../ui/util.js';
import { showGiftCard } from '../ui/gift-reveal.js';

const fmtDate = ts => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export function mountGifts(root) {
  const got = store.state.gifts
    .map(rec => ({ rec, gift: gifts.byKey(rec.key) }))
    .filter(x => x.gift);
  const total = gifts.totalCount;
  const left = Math.max(0, total - got.length);
  const cur = course.current();

  const cards = got.slice().reverse().map(({ rec, gift }, i) => `
    <li>
      <button type="button" class="gift-card ${gift.kind !== 'task' ? 'is-big' : ''}" data-key="${esc(rec.key)}" style="--i:${Math.min(i, 24)}">
        <span class="gift-card-art"><img loading="lazy" alt="" src="${esc(gift.img)}" width="96" height="96"></span>
        <span class="gift-card-name">${esc(gift.name)}</span>
        <span class="gift-card-date">${esc(fmtDate(rec.at))}</span>
      </button>
    </li>`).join('');

  const mystery = Array.from({ length: Math.min(left, 6) }, () => '<li class="gift-mystery" aria-hidden="true"><span>?</span></li>').join('');

  const page = h(`
    <div class="gifts-page">
      <header class="page-bar">
        <a class="chip chip-dark" href="#/">${icons.back}<span>Путь</span></a>
        <span class="page-bar-title">${esc(config.title)}</span>
      </header>
      <main class="gifts-main">
        <h1 class="hand gifts-title">Шкатулка</h1>
        <p class="gifts-sub">${got.length
          ? `Здесь ${got.length} ${plural(got.length, ['подарок', 'подарка', 'подарков'])} из ${total}. Нажми на любой, чтобы перечитать записку.`
          : 'Пока здесь пусто. Первый подарок появится, когда ты решишь первую задачу.'}</p>
        ${got.length ? `<ul class="gift-grid">${cards}${mystery}</ul>` : `<ul class="gift-grid is-empty">${mystery}</ul>`}
        ${left ? `<p class="gifts-more">Ещё ${left} ${plural(left, ['подарок ждёт', 'подарка ждут', 'подарков ждут'])} впереди.
          ${cur ? `<a class="btn btn-primary" href="#/task/${cur.id}">К следующей задаче ${icons.next}</a>` : ''}</p>` : '<p class="gifts-more">Ты собрала все подарки. Все до единого.</p>'}
      </main>
    </div>`);

  page.querySelectorAll('.gift-card img').forEach(img => {
    img.onerror = () => {
      const key = img.closest('.gift-card').dataset.key;
      const span = document.createElement('span');
      span.className = 'gift-card-emoji';
      span.textContent = gifts.byKey(key)?.emoji ?? '🎁';
      img.replaceWith(span);
    };
  });
  page.addEventListener('click', e => {
    const card = e.target.closest('.gift-card');
    if (!card) return;
    const rec = store.state.gifts.find(g => g.key === card.dataset.key);
    const gift = gifts.byKey(card.dataset.key);
    if (gift && rec) showGiftCard(gift, `Получено ${fmtDate(rec.at)}`);
  });

  root.replaceChildren(page);
  document.title = `Шкатулка — ${config.title}`;
  window.scrollTo(0, 0);
  return () => {};
}
