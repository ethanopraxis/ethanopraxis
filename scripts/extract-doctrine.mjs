/**
 * PDFs in docs/source/ -> src/content/dieu/<phap>/<node>.md  (+ src/data/doctrine-quyen.json)
 *
 * Doctrine text is sacred: this script copies, it never composes. Where the
 * source offers no verbatim line for a field, the field gets a TODO(owner)
 * rather than a sentence written by a machine. Every extracted title is checked
 * against doctrine-seed.json and mismatches are reported, not silently accepted.
 *
 * Run: node scripts/extract-doctrine.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { extractPageLines } from './lib/pdf-text.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/doctrine-seed.json'), 'utf8'));
const PDFS = { 'kien-khiem': 'BinhPhapKienKhiem.pdf', 'nhu-tinh': 'BinhPhapNhuTinh.pdf' };

/** Build a regex source tolerant of the PDF's letter-spacing ("Đ I Ề U"). */
const sp = (s) => [...s].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
const despace = (s) => s.replace(/\s+/g, '');
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14 };
const ORDINAL = { 'NHẤT': 1, 'NHỊ': 2, 'TAM': 3, 'TỨ': 4, 'NGŨ': 5, 'LỤC': 6, 'THẤT': 7 };
// The mệnh lệnh are numbered in plain Vietnamese ("THỨ HAI"), not Sino-Vietnamese.
const MENH_LENH_ORDINAL = { 'NHẤT': 1, 'HAI': 2, 'BA': 3 };

const RE = {
  quyen: new RegExp(`^${sp('QUYỂN')}\\s*([IVX\\s]+)$`),
  dieu: new RegExp(`^${sp('ĐIỀU')}\\s*([\\d\\s]+)$`),
  ky: new RegExp(`^${sp('KỴ')}\\s*(\\d)\\s*(.*)$`),
  tran: new RegExp(`^${sp('TRẬN')}\\s*([IVX\\s]+)\\s*—\\s*(.*)$`),
  menhLenh: new RegExp(`^${sp('MỆNHLỆNHTHỨ')}\\s*(.*)$`),
  moDau: new RegExp(`^${sp('MỞĐẦU')}$`),
  ket: new RegExp(`^${sp('KẾT')}$`),
  pageNum: /^—\s*\d+\s*—$/,
  ornament: /^—?\s*◆\s*—?$/,
};

/**
 * The source sets many labels in spaced small caps with no space before the text
 * that follows ("KIỂM BẰNGViết ra…"). Detect them by shape rather than by a list,
 * so a label we have not seen still splits correctly.
 */
const SPACED_LABELS = { 'KHÔNGPHẢI': 'KHÔNG PHẢI', 'MÀLÀ': 'MÀ LÀ' };

function splitLabel(text) {
  const numbered = /^(\d{1,2})(\p{Lu}\p{Ll}+)$/u.exec(text);
  if (numbered) return { label: `${numbered[1]} ${numbered[2]}`, rest: '' };
  const m = /^(\p{Lu}[\p{Lu}\s]{1,38}?)(\p{Lu}\p{Ll}.*)$/u.exec(text);
  if (!m) return null;
  const raw = m[1].trim().replace(/\s+/g, ' ');
  const bare = despace(raw);
  if (bare.length < 3) return null;
  if (/^[IVX]+$/.test(bare)) return null; // table-of-contents numerals
  // A fully letter-spaced label has lost its word breaks; restore known ones.
  const label = raw.split(' ').every((t) => [...t].length === 1) ? (SPACED_LABELS[bare] ?? bare) : raw;
  return { label, rest: m[2].trim() };
}

const isOrdinal = (text) => ORDINAL[despace(text)] ?? null;

/** Compare titles ignoring quote style and a trailing full stop. */
const normTitle = (s) => despace(s).replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/\.$/, '');

function loadLines(phap) {
  const buf = fs.readFileSync(path.join(ROOT, 'docs/source', PDFS[phap]));
  const out = [];
  extractPageLines(buf).forEach((lines, i) => {
    for (const l of lines) {
      if (RE.pageNum.test(l.text) || RE.ornament.test(l.text)) continue;
      out.push({ page: i + 1, y: l.y, text: l.text });
    }
  });
  return out;
}

/** Median line leading, used to tell a wrapped line from a new paragraph. */
function medianLeading(lines) {
  const gaps = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].page !== lines[i - 1].page) continue;
    const g = lines[i - 1].y - lines[i].y;
    if (g > 1 && g < 40) gaps.push(g);
  }
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)] || 14;
}

/** Turn positioned lines into markdown, preserving wording and line structure. */
function toMarkdown(lines, leading) {
  const blocks = [];
  let para = null;
  const flush = () => { if (para) { blocks.push({ type: 'p', text: para.join(' ') }); para = null; } };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const prev = lines[i - 1];
    const gap = prev && prev.page === l.page ? prev.y - l.y : Infinity;

    if (/^[•·]/.test(l.text)) {
      flush();
      const item = l.text.replace(/^[•·]\s*/, '');
      const last = blocks[blocks.length - 1];
      if (last?.type === 'ul') last.items.push(item);
      else blocks.push({ type: 'ul', items: [item] });
      continue;
    }

    const labelled = splitLabel(l.text);
    if (labelled) {
      flush();
      para = [`**${labelled.label}**${labelled.rest ? ' ' + labelled.rest : ''}`];
      continue;
    }

    // A line that ends a sentence or introduces one is its own display line;
    // only a line broken mid-sentence is a wrap to be rejoined.
    const isWrap = prev && gap <= leading * 1.35 && !/[:?!…]$/.test(prev.text);
    if (!isWrap) flush();
    (para ??= []).push(l.text);
  }
  flush();
  return blocks
    .map((b) => (b.type === 'ul' ? b.items.map((i) => '- ' + i).join('\n') : b.text))
    .join('\n\n');
}

/** Pull "Sai khi: …" and the KIỂM BẰNG callout out of a section into frontmatter. */
function liftCallouts(lines) {
  const body = [];
  let saiKhi = null;
  let kiemBang = null;
  let mode = null;

  for (const l of lines) {
    const labelled = splitLabel(l.text);
    if (labelled?.label === 'KIỂM BẰNG') { kiemBang = [labelled.rest]; mode = kiemBang; continue; }
    if (/^Sai khi:/.test(l.text)) { saiKhi = [l.text.replace(/^Sai khi:\s*/, '')]; mode = saiKhi; continue; }
    // Continue the callout only while the previous line is mid-sentence.
    if (mode && !labelled && !/^[•·]/.test(l.text) && !/[.!?…]$/.test(mode[mode.length - 1])) {
      mode.push(l.text);
      continue;
    }
    mode = null;
    body.push(l);
  }
  return { body, saiKhi: saiKhi?.join(' ') ?? null, kiemBang: kiemBang?.join(' ') ?? null };
}

// ---------------------------------------------------------------- segmentation

/** Walk one document and bucket every line under a seed node id or a quyển. */
function segment(phap, lines) {
  const sections = new Map();   // nodeId -> { titleLine, lines[] }
  const quyens = new Map();     // roman  -> { title, subtitle, preamble[], trailing[] }
  const seedByQuyen = new Map();
  for (const n of SEED.filter((n) => n.phap === phap)) {
    if (!seedByQuyen.has(n.quyen)) seedByQuyen.set(n.quyen, []);
    seedByQuyen.get(n.quyen).push(n);
  }

  let quyenRoman = null;
  let quyenNum = null;
  let target = null;        // current node bucket
  let awaitingTitle = null; // node id whose title is the next line
  let headerCountdown = 0;  // quyển title + subtitle lines
  let quyenHasNode = false;

  const startNode = (id, titleLine) => {
    if (!id) { target = null; return; }
    quyenHasNode = true;
    sections.set(id, { titleLine: titleLine ?? null, lines: [] });
    target = sections.get(id);
  };
  const nodeIn = (q, pred) => (seedByQuyen.get(q) ?? []).find(pred)?.id ?? null;

  for (const l of lines) {
    const t = l.text;

    if (RE.moDau.test(t) || RE.ket.test(t)) {
      quyenRoman = RE.moDau.test(t) ? 'MỞ ĐẦU' : 'KẾT';
      quyenNum = RE.moDau.test(t) ? 0 : 99;
      quyens.set(quyenRoman, { quyen: quyenNum, title: null, subtitle: null, preamble: [], trailing: [] });
      headerCountdown = RE.moDau.test(t) ? 2 : 1;
      target = null;
      quyenHasNode = false;
      continue;
    }

    const mq = RE.quyen.exec(t);
    if (mq) {
      quyenRoman = despace(mq[1]);
      quyenNum = ROMAN[quyenRoman];
      quyens.set(quyenRoman, { quyen: quyenNum, title: null, subtitle: null, preamble: [], trailing: [] });
      headerCountdown = 2;
      target = null;
      quyenHasNode = false;
      // A quy* that maps to exactly one node takes the whole quyển as its body.
      const members = seedByQuyen.get(quyenNum) ?? [];
      if (members.length === 1 && members[0].kind === 'quy-luat') startNode(members[0].id, null);
      continue;
    }
    if (headerCountdown > 0 && quyenRoman) {
      const q = quyens.get(quyenRoman);
      if (q.title === null) q.title = t; else q.subtitle = t;
      headerCountdown--;
      continue;
    }

    const md = RE.dieu.exec(t);
    if (md) { awaitingTitle = nodeIn(quyenNum, (n) => n.kind === 'dieu' && n.number === Number(despace(md[1]))); startNode(awaitingTitle, null); continue; }

    const mk = RE.ky.exec(t);
    if (mk) { startNode(nodeIn(quyenNum, (n) => n.kind === 'ky' && n.number === Number(mk[1])), mk[2].trim()); continue; }

    const mt = RE.tran.exec(t);
    if (mt) { startNode(nodeIn(quyenNum, (n) => n.kind === 'tran' && n.number === ROMAN[despace(mt[1])]), null); continue; }

    const mm = RE.menhLenh.exec(t);
    if (mm) { awaitingTitle = nodeIn(quyenNum, (n) => n.kind === 'menh-lenh' && n.number === MENH_LENH_ORDINAL[despace(mm[1])]); startNode(awaitingTitle, null); continue; }

    const ord = isOrdinal(t);
    if (ord && quyenNum !== null) {
      const id = nodeIn(quyenNum, (n) => (n.kind === 'nguyen-tac' || n.kind === 'that-bai') && n.number === ord);
      if (id) { awaitingTitle = id; startNode(id, null); continue; }
    }

    // "Bốn dòng viết trước" is a plain heading, not letter-spaced.
    if (despace(t) === despace('Bốn dòng viết trước')) {
      const id = nodeIn(quyenNum, (n) => n.id.endsWith('bon-dong-viet-truoc'));
      if (id) { startNode(id, t); continue; }
    }

    if (awaitingTitle) {
      const s = sections.get(awaitingTitle);
      if (s) s.titleLine = t;
      awaitingTitle = null;
      continue;
    }

    if (target) target.lines.push(l);
    else if (quyenRoman) quyens.get(quyenRoman)[quyenHasNode ? 'trailing' : 'preamble'].push(l);
  }
  return { sections, quyens };
}

/** Khẩu quyết are couplets, not prose sections — pair them by their first line. */
function pairKhauQuyet(phap, lines, sections) {
  if (phap !== 'nhu-tinh') return;
  for (const n of SEED.filter((n) => n.phap === phap && n.kind === 'khau-quyet')) {
    const first = n.title.split('—')[0].trim();
    const idx = lines.findIndex((l) => despace(l.text).startsWith(despace(first)));
    if (idx < 0) continue;
    sections.set(n.id, { titleLine: n.title, lines: [lines[idx], lines[idx + 1]].filter(Boolean) });
  }
}

// ---------------------------------------------------------------- generation

const yamlEscape = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const report = { written: 0, todoBody: 0, todoEssence: 0, todoBodyIds: [], titleMismatch: [], unassigned: [] };
const quyenOut = [];

for (const phap of Object.keys(PDFS)) {
  const lines = loadLines(phap);
  const leading = medianLeading(lines);
  const { sections, quyens } = segment(phap, lines);
  pairKhauQuyet(phap, lines, sections);

  for (const roman of [...quyens.keys()]) {
    const q = quyens.get(roman);
    quyenOut.push({
      phap, quyen: q.quyen, roman,
      title: q.title, subtitle: q.subtitle,
      preamble: toMarkdown(q.preamble, leading),
      trailing: toMarkdown(q.trailing, leading),
    });
    if (q.trailing.length) report.unassigned.push(`${phap} quyển ${roman}: ${q.trailing.length} line(s)`);
  }

  for (const node of SEED.filter((n) => n.phap === phap)) {
    const sec = sections.get(node.id);
    const dir = path.join(ROOT, 'src/content/dieu', phap);
    fs.mkdirSync(dir, { recursive: true });

    let essence = null;
    let bodyMd = '';
    let saiKhi = null;
    let kiemBang = null;

    if (sec && sec.lines.length) {
      const lifted = liftCallouts(sec.lines);
      saiKhi = lifted.saiKhi;
      kiemBang = lifted.kiemBang;
      let body = lifted.body;

      // Kinds whose source prints a one-line gloss directly under the title:
      // take it verbatim as the essence rather than writing one.
      const GLOSSED = new Set(['nguyen-tac', 'that-bai', 'menh-lenh', 'tran', 'ky', 'khau-quyet']);
      if (GLOSSED.has(node.kind) && body.length && body[0].text.length <= 120) {
        essence = body[0].text;
        body = body.slice(1);
      }
      bodyMd = toMarkdown(body, leading);

      if (sec.titleLine && normTitle(sec.titleLine) !== normTitle(node.title)) {
        report.titleMismatch.push(`${node.id}\n    seed: ${node.title}\n    pdf : ${sec.titleLine}`);
      }
    }

    // An empty body is legitimate where the source gives a single line and that
    // line became the essence (the kỵ and the mệnh lệnh are exactly one line each).
    // Only a section that was never found is a real gap.
    if (!sec || !sec.lines.length) {
      bodyMd = 'TODO(owner): verify wording — no matching section found in the source PDF.';
      report.todoBody++; report.todoBodyIds.push(node.id);
    }
    if (!essence) { essence = 'TODO(owner): verify wording'; report.todoEssence++; }

    const fm = [
      '---',
      `phap: ${node.phap}`,
      `kind: ${node.kind}`,
      `quyen: ${node.quyen}`,
      `quyenTitle: ${yamlEscape(node.quyenTitle)}`,
      `order: ${node.order}`,
      ...(node.number !== undefined ? [`number: ${node.number}`] : []),
      `title: ${yamlEscape(node.title)}`,
      `essence: ${yamlEscape(essence)}`,
      ...(saiKhi ? [`saiKhi: ${yamlEscape(saiKhi)}`] : []),
      ...(kiemBang ? [`kiemBang: ${yamlEscape(kiemBang)}`] : []),
      '---',
      '',
    ].join('\n');

    fs.writeFileSync(path.join(dir, node.id.split('/')[1] + '.md'), fm + bodyMd + '\n');
    report.written++;
  }
}

fs.writeFileSync(
  path.join(ROOT, 'src/data/doctrine-quyen.json'),
  JSON.stringify(quyenOut, null, 2) + '\n'
);

console.log(`wrote ${report.written} node files, ${quyenOut.length} quyển records`);
console.log(`TODO bodies: ${report.todoBody}   TODO essences: ${report.todoEssence}`);
if (report.todoBodyIds.length) console.log('  no body: ' + report.todoBodyIds.join(', '));
if (report.titleMismatch.length) {
  console.log(`\ntitle mismatches vs seed (${report.titleMismatch.length}):`);
  for (const m of report.titleMismatch) console.log('  ' + m);
}
if (report.unassigned.length) {
  console.log(`\ntext not attached to any node (kept in doctrine-quyen.json):`);
  for (const u of report.unassigned) console.log('  ' + u);
}
