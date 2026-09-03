/**
 * Lazy search. Nothing here loads until the visitor touches a search box:
 * on first focus or keypress we pull Orama and the document set, then query
 * the folded fields so a query typed without diacritics still matches.
 */
import { foldVi } from '../lib/foldVi';
import { queryTerms } from '../lib/searchQuery';

interface Doc {
  id: string; url: string; type: string; title: string;
  context: string; desc: string; phap: string; domain: string;
  head: string; body: string;
}

type Db = unknown;
let ready: Promise<{ db: Db; search: typeof import('@orama/orama').search }> | null = null;

const TYPE_LABEL: Record<string, string> = {
  dieu: 'Binh pháp', video: 'Video', short: 'Short',
  'series-episode': 'Tập', 'course-lesson': 'Bài học',
};

async function boot(src: string) {
  ready ??= (async () => {
    const [{ create, insertMultiple, search }, docs] = await Promise.all([
      import('@orama/orama'),
      fetch(src).then((r) => r.json() as Promise<Doc[]>),
    ]);
    const db = create({
      schema: {
        title: 'string', context: 'string', desc: 'string',
        head: 'string', body: 'string', type: 'string', phap: 'string',
      },
    });
    await insertMultiple(db as never, docs as never);
    return { db, search };
  })();
  return ready;
}

async function query(src: string, term: string, filters: Record<string, string>) {
  const { db, search } = await boot(src);
  const where: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) if (v) where[k] = v;
  const res = await search(db as never, {
    term: queryTerms(foldVi(term)),
    properties: ['head', 'body'],
    // A hit in the title/quyển line means far more than a passing mention.
    boost: { head: 6, body: 1 },
    tolerance: 0,
    limit: 20,
    ...(Object.keys(where).length ? { where } : {}),
  } as never);
  return res.hits.map((h) => h.document as unknown as Doc);
}

function render(list: HTMLElement, docs: Doc[], term: string) {
  list.replaceChildren();
  if (!term.trim()) return;
  if (docs.length === 0) {
    const li = document.createElement('li');
    li.className = 'sr__empty';
    li.textContent = 'Không tìm thấy gì. Thử bỏ dấu, hoặc ít chữ hơn.';
    list.append(li);
    return;
  }
  for (const d of docs) {
    const li = document.createElement('li');
    li.className = 'sr__item';
    const a = document.createElement('a');
    a.href = d.url;
    a.className = 'sr__link';

    const meta = document.createElement('span');
    meta.className = 'sr__meta';
    meta.textContent = [TYPE_LABEL[d.type] ?? d.type, d.context].filter(Boolean).join(' · ');

    const title = document.createElement('span');
    title.className = 'sr__title';
    title.textContent = d.title;

    a.append(meta, title);
    if (d.desc) {
      const desc = document.createElement('span');
      desc.className = 'sr__desc';
      desc.textContent = d.desc;
      a.append(desc);
    }
    li.append(a);
    list.append(li);
  }
}

export function attach(root: ParentNode = document) {
  for (const box of root.querySelectorAll<HTMLElement>('[data-search]')) {
    const input = box.querySelector<HTMLInputElement>('input');
    const list = box.querySelector<HTMLElement>('[data-search-results]');
    const src = box.dataset.src;
    if (!input || !list || !src) continue;

    const filters: Record<string, string> = {};
    let timer: number | undefined;

    const run = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        const term = input.value;
        if (!term.trim()) { render(list, [], term); box.dataset.open = 'false'; return; }
        try {
          render(list, await query(src, term, filters), term);
          box.dataset.open = 'true';
        } catch {
          box.dataset.open = 'false';
        }
      }, 120);
    };

    const warm = () => { void boot(src); };
    input.addEventListener('focus', warm, { once: true });
    input.addEventListener('input', run);

    for (const chip of box.querySelectorAll<HTMLButtonElement>('[data-facet]')) {
      chip.addEventListener('click', () => {
        const field = chip.dataset.facet!;
        const value = chip.dataset.value!;
        const on = filters[field] === value;
        for (const sib of box.querySelectorAll(`[data-facet="${field}"]`)) {
          sib.setAttribute('aria-pressed', 'false');
        }
        filters[field] = on ? '' : value;
        chip.setAttribute('aria-pressed', String(!on));
        run();
      });
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { input.value = ''; render(list, [], ''); box.dataset.open = 'false'; }
    });
    document.addEventListener('click', (e) => {
      if (box.dataset.dropdown === 'true' && !box.contains(e.target as Node)) box.dataset.open = 'false';
    });
  }
}
