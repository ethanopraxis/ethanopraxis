import { LANGS } from "./dist/data/nenmong/index.js";
import { CONCEPTS } from "./dist/data/nenmong/concepts.js";

const IDS = {}; let total = 0, errors = 0;
for (const l of LANGS) {
  IDS[l.id] = new Set();
  for (const d of l.deck) {
    total++;
    if (IDS[l.id].has(d.id)) { console.error(`[${l.id}] trùng id ${d.id}`); errors++; }
    IDS[l.id].add(d.id);
    if (!(d.lv >= 0 && d.lv <= 5) || !d.p || !d.a || !d.t) { console.error(`[${l.id}] ${d.id} hỏng field`); errors++; }
  }
}
console.log(LANGS.map(l => `${l.id}:${l.deck.length}`).join("  "), `— TỔNG ${total}`);

const claimed = {}; for (const l of LANGS) claimed[l.id] = new Set();
for (const row of CONCEPTS) {
  const langs = Object.keys(row.cells);
  if (langs.length !== 5) { console.error(`concepts: ${row.concept} có ${langs.length}/5 ngôn ngữ`); errors++; }
  for (const [lang, cell] of Object.entries(row.cells)) {
    if ("drill" in cell) {
      if (!IDS[lang]?.has(cell.drill)) { console.error(`concepts: ${row.concept}.${lang} → id không tồn tại: ${cell.drill}`); errors++; }
      else claimed[lang].add(cell.drill);
    }
  }
}

const strip = (lang, id) => (lang === "py" ? id : id.replace(/^[jgct]-/, ""));
const groups = new Map();
for (const l of LANGS) for (const d of l.deck) {
  const s = strip(l.id, d.id);
  if (!groups.has(s)) groups.set(s, new Map());
  groups.get(s).set(l.id, d.id);
}
let fail = 0, warn = 0;
for (const [s, m] of groups) {
  const k = m.size;
  if (k === 5) continue;
  const allClaimed = [...m.entries()].every(([lang, id]) => claimed[lang].has(id));
  if (k === 1) { if (!allClaimed) warn++; continue; }
  if (!allClaimed) { console.error(`BẤT ĐỐI XỨNG chưa giải thích: '${s}' ở [${[...m.keys()].join(", ")}]`); fail++; }
}
console.log(`đối xứng: ${fail} FAIL · ${warn} khối đơn nhất chưa vào sổ (WARN)`);
process.exit(errors + fail ? 1 : 0);
