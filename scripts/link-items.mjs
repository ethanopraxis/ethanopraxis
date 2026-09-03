/**
 * Seed curated items from the doctrine references the author already wrote into
 * each video description ("Quyển I — …").
 *
 * This derives, it does not decide: the quyển mapping is the author's own words.
 * Narrowing a quyển down to individual điều is an editorial judgement, so each
 * generated file says so and carries a TODO(owner).
 *
 * Existing files are never overwritten — hand edits win.
 *
 * Run: node scripts/link-items.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const videos = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/videos.json'), 'utf8'));
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/doctrine-seed.json'), 'utf8'));
const OUT = path.join(ROOT, 'src/content/items');

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14 };

const phapOf = (title) => {
  const t = title.toLowerCase();
  if (t.includes('nhu') && (t.includes('tỉnh') || t.includes('tinh'))) return 'nhu-tinh';
  if (t.includes('kiển') || t.includes('kien')) return 'kien-khiem';
  return null;
};

fs.mkdirSync(OUT, { recursive: true });
let written = 0, skipped = 0, unmatched = 0;

for (const v of videos) {
  const phap = phapOf(v.title);
  if (!phap) { unmatched++; continue; }

  const quyens = new Set();
  for (const m of `${v.title}\n${v.description}`.matchAll(/Quyển\s+([IVX]+)\b/g)) {
    const n = ROMAN[m[1]];
    if (n) quyens.add(n);
  }
  if (quyens.size === 0) { unmatched++; continue; }

  const method = seed
    .filter((n) => n.phap === phap && quyens.has(n.quyen))
    .map((n) => n.id);
  if (method.length === 0) { unmatched++; continue; }

  const file = path.join(OUT, `${v.id}.md`);
  if (fs.existsSync(file)) { skipped++; continue; }

  const body = [
    '---',
    `type: ${v.durationSec <= 90 ? 'short' : 'video'}`,
    `youtubeId: "${v.id}"`,
    'method:',
    ...method.map((id) => `  - "${id}"`),
    '---',
    '',
    `<!-- Derived by scripts/link-items.mjs from the quyển named in this video's`,
    `     own description (Quyển ${[...quyens].sort((a, b) => a - b).join(', ')}).`,
    `     TODO(owner): narrow to the specific điều this video applies. -->`,
    '',
  ].join('\n');
  fs.writeFileSync(file, body);
  written++;
}

console.log(`link-items: wrote ${written}, kept ${skipped} existing, ${unmatched} video(s) with no doctrine reference`);
