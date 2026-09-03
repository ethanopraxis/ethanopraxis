/**
 * Propose an `essence` for doctrine nodes that still carry a TODO.
 *
 * Every proposal is a VERBATIM sentence lifted from that node's own body — this
 * script excerpts, it never composes. Nodes with no sentence that stands alone
 * keep their TODO rather than get a forced one.
 *
 * Only touches files whose essence is still TODO(, so owner edits are safe.
 *
 *   node scripts/draft-essences.mjs           # dry run, prints proposals
 *   node scripts/draft-essences.mjs --write   # writes them into frontmatter
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const WRITE = process.argv.includes('--write');
const MIN = 20;
const MAX = 90; // PLAN.md §5: essence is one line, <= 90 chars

/**
 * Nodes where the closing line is an example, a caveat or a diagnostic question
 * rather than a summary — reviewed by hand, left for the owner. dieu-31 is the
 * clearest: its last line is the mistake the điều warns against, so lifting it
 * would state the opposite of the rule.
 */
const SKIP = new Set([
  'kien-khiem/dieu-07', 'kien-khiem/dieu-16', 'kien-khiem/dieu-23', 'kien-khiem/dieu-24',
  'kien-khiem/dieu-25', 'kien-khiem/dieu-29', 'kien-khiem/dieu-31', 'kien-khiem/dieu-37',
]);

const files = [];
for (const phap of ['kien-khiem', 'nhu-tinh']) {
  const dir = path.join(ROOT, 'src/content/dieu', phap);
  for (const f of fs.readdirSync(dir)) files.push(path.join(dir, f));
}

/** A sentence only works as an essence if it can be read on its own. */
const DANGLING = /^(Sau đó|Nhưng|Vì vậy|Rồi|Đó |Và |Hoặc|Nếu không|Ngược lại|Thay vào đó|Cả hai|Từ đó|Toàn bộ)/;

function standalone(t) {
  if (!/[.!?…]$/.test(t)) return false;          // not a complete sentence
  if (t.split(/\s+/).length < 4) return false;   // too clipped to mean anything
  if (t.length < MIN || t.length > MAX) return false;
  if (!/^[\p{Lu}“"]/u.test(t)) return false;     // starts mid-sentence
  if (DANGLING.test(t)) return false;            // leans on the sentence before it
  if (/[→←]/.test(t)) return false;              // a worked example, not a summary
  if (/^[“"]/.test(t)) return false;             // a quoted example
  if (/Ví dụ|Dừng nếu:/.test(t)) return false;   // worked example, not a summary
  return true;
}

/** Standalone sentences, in body order. */
function sentences(body) {
  const out = [];
  const paras = body
    .split('\n\n')
    .map((p) => p.replace(/^\*\*[^*]+\*\*\s*/, '').replace(/^- /gm, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  for (const [i, p] of paras.entries()) {
    for (const s of p.split(/(?<=[.!?…])\s+/)) {
      const t = s.trim();
      if (standalone(t)) out.push({ text: t, lastPara: i === paras.length - 1 });
    }
  }
  return out;
}

/** These điều tend to close on their own aphorism; prefer the closing line. */
function pick(body) {
  const all = sentences(body);
  if (all.length === 0) return null;
  const closing = all.filter((s) => s.lastPara);
  if (closing.length) return closing[closing.length - 1].text;
  return all[all.length - 1].text;
}

const rows = [];
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) continue;
  if (!/^essence:\s*"TODO\(/m.test(m[1])) continue;
  // quy-luật nodes are chapter-length; no single sentence stands in for them.
  const nodeId = path.basename(path.dirname(file)) + '/' + path.basename(file, '.md');
  const kind = (/^kind:\s*(\S+)$/m.exec(m[1]) ?? [])[1];
  if (SKIP.has(nodeId)) { rows.push({ file, title: (/^title:\s*"([\s\S]*?)"$/m.exec(m[1]) ?? [])[1], proposal: null, reason: 'closing line is an example, not a summary' }); continue; }
  if (kind === 'quy-luat') { rows.push({ file, title: (/^title:\s*"([\s\S]*?)"$/m.exec(m[1]) ?? [])[1], proposal: null, reason: 'quy-luật — needs a human summary' }); continue; }

  const title = (/^title:\s*"([\s\S]*?)"$/m.exec(m[1]) ?? [])[1] ?? path.basename(file);
  const proposal = pick(m[2].trim());
  rows.push({ file, title, proposal });

  if (WRITE && proposal) {
    const escaped = proposal.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    fs.writeFileSync(file, raw.replace(/^essence:\s*"TODO\([^\n]*"$/m, `essence: "${escaped}"`));
  }
}

const filled = rows.filter((r) => r.proposal);
for (const r of rows) {
  console.log(`${r.proposal ? ' ' : '×'} ${r.title}`);
  console.log(`     ${r.proposal ?? '(' + (r.reason ?? 'no standalone sentence in range') + ' — TODO kept)'}`);
}
console.log(`\n${filled.length} proposed, ${rows.length - filled.length} left as TODO, of ${rows.length} nodes`);
console.log(WRITE ? 'written to frontmatter' : 'dry run — pass --write to apply');
