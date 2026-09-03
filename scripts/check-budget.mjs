/**
 * Per-page JS weight against PLAN.md §11.
 *
 * Two numbers per page, because they answer different questions:
 *   eager  — what every visitor downloads just by opening the page. This is
 *            what §11's budget gates.
 *   +lazy  — what a visitor additionally pulls by interacting (opening search,
 *            scrolling the map into view). §8 requires this to be deferred, so
 *            it is reported but not gated.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST = path.resolve(import.meta.dirname, '../dist');
const budgetFor = (rel) => (/^index\.html$/.test(rel) ? 70 : 25);

const gz = (f) => (fs.existsSync(f) ? zlib.gzipSync(fs.readFileSync(f)).length : 0);

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) pages.push(full);
  }
})(DIST);

const DYNAMIC = /import\s*\(\s*["'`](\.{1,2}\/[^"'`]+\.js)["'`]/g;
const STATIC = /(?:from|import)\s*["'`](\.{1,2}\/[^"'`]+\.js)["'`]/g;

/** Split a module graph into what loads now and what loads on interaction. */
function graph(entry) {
  const eager = new Set();
  const lazy = new Set();
  const visit = (file, into) => {
    const rel = path.relative(DIST, file);
    if (into.has(rel) || !fs.existsSync(file)) return;
    into.add(rel);
    const src = fs.readFileSync(file, 'utf8');
    const dyn = new Set([...src.matchAll(DYNAMIC)].map((m) => m[1]));
    for (const spec of dyn) visit(path.resolve(path.dirname(file), spec), lazy);
    for (const m of src.matchAll(STATIC)) {
      if (dyn.has(m[1])) continue;
      visit(path.resolve(path.dirname(file), m[1]), into);
    }
  };
  visit(entry, eager);
  for (const rel of eager) lazy.delete(rel);
  return { eager, lazy };
}

const rows = [];
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const eager = new Set();
  const lazy = new Set();
  for (const m of html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)) {
    const file = path.join(DIST, m[1].replace(/^\/[^/]*\/_astro\//, '_astro/').replace(/^\//, ''));
    const g = graph(file);
    for (const r of g.eager) eager.add(r);
    for (const r of g.lazy) lazy.add(r);
  }
  for (const r of eager) lazy.delete(r);
  const sum = (set) => [...set].reduce((n, rel) => n + gz(path.join(DIST, rel)), 0) / 1024;
  const rel = path.relative(DIST, page);
  rows.push({ rel, eager: sum(eager), lazy: sum(lazy), limit: budgetFor(rel) });
}

rows.sort((a, b) => b.eager - a.eager);
console.log('  eager   +lazy   limit  page');
for (const r of rows.slice(0, 5)) {
  console.log(`${(r.eager > r.limit ? 'OVER' : '  ok')} ${r.eager.toFixed(1).padStart(5)} KB  +${r.lazy.toFixed(1).padStart(5)} KB  ${String(r.limit).padStart(2)} KB  ${r.rel}`);
}
const over = rows.filter((r) => r.eager > r.limit);
console.log(`\n${rows.length} pages · heaviest eager ${rows[0].eager.toFixed(1)} KB gz · heaviest on-interaction ${Math.max(...rows.map((r) => r.eager + r.lazy)).toFixed(1)} KB gz`);
if (over.length) {
  console.error(`BUDGET EXCEEDED on ${over.length} page(s) — PLAN.md §11`);
  process.exit(1);
}
console.log('all pages within the §11 eager budget');
