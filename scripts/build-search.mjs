/**
 * catalog -> public/search-docs.json   (runs as `prebuild`)
 *
 * Ships a folded copy of every document so the browser can match queries typed
 * without diacritics. Displayed fields keep their diacritics untouched.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = (process.env.BASE_PATH ?? '/').replace(/\/+$/, '');
const url = (p) => `${BASE}/${p.replace(/^\/+/, '')}`;

// Must stay identical to src/lib/foldVi.ts.
const foldVi = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

/** Minimal frontmatter reader — enough for our own generated files. */
function readFrontmatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && key) {
      (data[key] ||= []).push(item[1].replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    key = kv[1];
    const value = kv[2].trim();
    data[key] = value === '' ? [] : value.replace(/^"([\s\S]*)"$/, '$1').replace(/\\"/g, '"');
  }
  return { data, body: m[2] };
}

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name))
    : [];

const clean = (s) => s.replace(/[*_>#`]/g, '').replace(/\s+/g, ' ').trim();
const trim = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

const enrichmentPath = path.join(ROOT, 'src/data/enrichment.json');
const enrichment = fs.existsSync(enrichmentPath)
  ? JSON.parse(fs.readFileSync(enrichmentPath, 'utf8'))
  : {};

const docs = [];

// ---- doctrine nodes
const dieuDir = path.join(ROOT, 'src/content/dieu');
const dieuByFile = new Map();
for (const file of walk(dieuDir).filter((f) => f.endsWith('.md'))) {
  const { data, body } = readFrontmatter(fs.readFileSync(file, 'utf8'));
  const phap = data.phap;
  const slug = path.basename(file, '.md');
  const id = `${phap}/${slug}`;
  dieuByFile.set(id, data.title);
  const text = clean(body);
  const essence = /^TODO\(/.test(data.essence ?? '') ? '' : (data.essence ?? '');
  const desc = trim(essence || text, 200);
  docs.push({
    id,
    url: url(`/binh-phap/${phap}/${slug}/`),
    type: 'dieu',
    title: data.title,
    context: data.quyenTitle ?? '',
    desc,
    phap,
    domain: '',
    head: foldVi([data.title, data.quyenTitle, essence].join(' ')),
    body: foldVi([trim(text, 900), data.saiKhi ?? '', data.kiemBang ?? '',
                  ...(enrichment[id] ?? [])].join(' ')),
  });
}

// ---- videos, merged with any curated entry
const videos = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/videos.json'), 'utf8'));
const curated = new Map();
for (const file of walk(path.join(ROOT, 'src/content/items')).filter((f) => f.endsWith('.md'))) {
  if (path.basename(file).startsWith('_')) continue;
  const { data } = readFrontmatter(fs.readFileSync(file, 'utf8'));
  if (data.youtubeId) curated.set(data.youtubeId, data);
}

for (const v of videos) {
  const c = curated.get(v.id);
  if (c?.draft === 'true') continue;
  const method = Array.isArray(c?.method) ? c.method : [];
  const methodTitles = method.map((id) => dieuByFile.get(id) ?? '').filter(Boolean);
  const phaps = [...new Set(method.map((id) => id.split('/')[0]))];
  const title = c?.title ?? v.title;
  const desc = trim(clean(v.description), 200);
  docs.push({
    id: v.id,
    url: url(`/video/${v.id}/`),
    type: c?.type ?? (v.durationSec <= 90 ? 'short' : 'video'),
    title,
    context: methodTitles[0] ?? '',
    desc,
    phap: phaps.length === 1 ? phaps[0] : '',
    domain: c?.domain ?? '',
    head: foldVi([title, methodTitles.join(' '), c?.domain ?? ''].join(' ')),
    body: foldVi([clean(v.description), (v.tags ?? []).join(' '),
                  ...(enrichment[v.id] ?? [])].join(' ')),
  });
}

const out = path.join(ROOT, 'public/search-docs.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(docs));
console.log(`build-search: ${docs.length} docs -> public/search-docs.json`);
