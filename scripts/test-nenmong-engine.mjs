/**
 * Nền Móng — engine + deck tests (§8.1). Zero dependencies.
 *
 * The engine is TypeScript, so it is compiled to a temp dir with the repo's
 * own tsc and required from there. CommonJS is used deliberately: tsc does not
 * rewrite extensionless specifiers, which Node's ESM loader would reject.
 *
 * Run: npm run test:nenmong
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), "nenmong-test-"));

process.stdout.write("compiling engine + decks + concepts… ");
try {
  execFileSync(
  process.execPath,
  [
    path.join(ROOT, "node_modules/typescript/lib/tsc.js"),
    path.join(ROOT, "src/lib/nenmong/engine.ts"),
    path.join(ROOT, "src/data/nenmong/index.ts"),
    path.join(ROOT, "src/data/nenmong/concepts.ts"),
    "--outDir", OUT,
    "--rootDir", path.join(ROOT, "src"),
    "--module", "commonjs",
    "--target", "es2022",
    // CommonJS emit keeps extensionless specifiers resolvable; tsc does not
    // rewrite them, which Node's ESM loader would reject.
    "--moduleResolution", "node",
    "--ignoreDeprecations", "6.0",
    "--strict",
    "--skipLibCheck",
    // TS6 refuses to combine file arguments with the repo tsconfig.
    "--ignoreConfig",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (err) {
  console.error("\ntsc failed:\n" + String(err.stdout ?? "") + String(err.stderr ?? ""));
  process.exit(1);
}
// /tmp has no package.json, but be explicit so "type": "module" never leaks in.
fs.writeFileSync(path.join(OUT, "package.json"), JSON.stringify({ type: "commonjs" }));
console.log("ok");

const req = createRequire(path.join(OUT, "package.json"));
const E = req(path.join(OUT, "lib/nenmong/engine.js"));
const { LANGS } = req(path.join(OUT, "data/nenmong/index.js"));
const { CONCEPTS } = req(path.join(OUT, "data/nenmong/concepts.js"));

const TODAY = "2026-03-01";
const input = (code = "", id = "x", secs = 7) => ({ id, code, secs });
const node = (over = {}) => ({ ...E.freshNode(), ...over });

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
    passed++;
    console.log("  ok   " + name);
  } catch (err) {
    console.error("  FAIL " + name + "\n       " + err.message);
    process.exitCode = 1;
  }
};

/* 1 — date arithmetic across month and year boundaries */
check("addDays crosses month and year boundaries", () => {
  assert.equal(E.addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(E.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(E.addDays("2026-03-01", -1), "2026-02-28");
});

/* 2 — build: any grade schedules tomorrow; sai also journals */
check("build, any grade -> st=b, iv=0, due=+1", () => {
  for (const g of ["dung", "lech", "sai"]) {
    const r = E.applyBuild(node(), g, TODAY, input("code"));
    assert.equal(r.node.st, "b");
    assert.equal(r.node.iv, 0);
    assert.equal(r.node.due, "2026-03-02");
    assert.equal(r.node.at, 1);
  }
});
check("build sai increments miss, sets lastMissCode, journals", () => {
  const r = E.applyBuild(node(), "sai", TODAY, input("nums[i]", "l1-enum", 12));
  assert.equal(r.node.miss, 1);
  assert.equal(r.node.lastMissCode, "nums[i]");
  assert.ok(r.journal, "expected a journal entry");
  assert.deepEqual(r.journal, { d: TODAY, id: "l1-enum", g: "sai", code: "nums[i]", secs: 12 });
});
check("build dung clears lastMissCode and writes no journal", () => {
  const r = E.applyBuild(node({ lastMissCode: "old" }), "dung", TODAY, input("ok"));
  assert.equal(r.node.lastMissCode, null);
  assert.equal(r.journal, undefined);
});

/* 3 — survey */
check("survey dung -> st=b, iv=1, due=+2, lastMissCode cleared", () => {
  const r = E.applySurvey(node({ lastMissCode: "old" }), "dung", TODAY);
  assert.equal(r.node.st, "b");
  assert.equal(r.node.iv, 1);
  assert.equal(r.node.due, "2026-03-03");
  assert.equal(r.node.lastMissCode, null);
  assert.equal(r.node.at, 1);
});
check("survey lech/sai -> stays u, only at increments, no journal", () => {
  for (const g of ["lech", "sai"]) {
    const r = E.applySurvey(node(), g, TODAY);
    assert.equal(r.node.st, "u");
    assert.equal(r.node.iv, 0);
    assert.equal(r.node.due, null);
    assert.equal(r.node.at, 1);
    assert.equal(r.journal, undefined);
  }
});

/* 4 — gate dung: seals and advances, capped at the last interval */
check("gate dung from b/iv=0 -> s, iv=1, due=+2, cr=false", () => {
  const r = E.applyGate(node({ st: "b", iv: 0, lastMissCode: "old", cr: true }), "dung", TODAY, input());
  assert.equal(r.node.st, "s");
  assert.equal(r.node.iv, 1);
  assert.equal(r.node.due, "2026-03-03");
  assert.equal(r.node.cr, false);
  assert.equal(r.node.lastMissCode, null);
  assert.equal(r.journal, undefined);
});
check("gate dung from iv=4 -> iv=5, due=+30", () => {
  const r = E.applyGate(node({ st: "s", iv: 4 }), "dung", TODAY, input());
  assert.equal(r.node.iv, 5);
  assert.equal(r.node.due, "2026-03-31");
});
check("gate dung from iv=5 (last) caps at iv=5, due=+30", () => {
  const r = E.applyGate(node({ st: "s", iv: 5 }), "dung", TODAY, input());
  assert.equal(r.node.iv, 5);
  assert.equal(r.node.due, "2026-03-31");
});

/* 5 — gate lech */
check("gate lech -> due=+1, st/iv unchanged, journal grade lech", () => {
  const r = E.applyGate(node({ st: "s", iv: 3 }), "lech", TODAY, input("half", "l2-pal", 30));
  assert.equal(r.node.st, "s");
  assert.equal(r.node.iv, 3);
  assert.equal(r.node.due, "2026-03-02");
  assert.deepEqual(r.journal, { d: TODAY, id: "l2-pal", g: "lech", code: "half", secs: 30 });
});

/* 6 — gate sai */
check("gate sai on a SEALED node -> u, iv=0, due=null, cr=true, miss+1", () => {
  const r = E.applyGate(node({ st: "s", iv: 3, due: "2026-03-01", miss: 2 }), "sai", TODAY, input("bad"));
  assert.equal(r.node.st, "u");
  assert.equal(r.node.iv, 0);
  assert.equal(r.node.due, null);
  assert.equal(r.node.cr, true);
  assert.equal(r.node.miss, 3);
  assert.equal(r.journal.g, "sai");
});
check("gate sai on a BUILT node leaves cr false", () => {
  const r = E.applyGate(node({ st: "b", iv: 0 }), "sai", TODAY, input("bad"));
  assert.equal(r.node.st, "u");
  assert.equal(r.node.cr, false);
});

/* 7 — 600-char truncation */
check("code truncates to 600 chars in journal and lastMissCode", () => {
  const long = "z".repeat(1000);
  const g = E.applyGate(node({ st: "b" }), "sai", TODAY, input(long));
  assert.equal(g.node.lastMissCode.length, 600);
  assert.equal(g.journal.code.length, 600);
  const b = E.applyBuild(node(), "sai", TODAY, input(long));
  assert.equal(b.node.lastMissCode.length, 600);
  assert.equal(b.journal.code.length, 600);
  const l = E.applyGate(node({ st: "s" }), "lech", TODAY, input(long));
  assert.equal(l.journal.code.length, 600);
});

/* 8 — streak */
check("bumpStreak: same day no-op, consecutive increments, gap resets", () => {
  assert.deepEqual(E.bumpStreak({ n: 4, last: TODAY }, TODAY), { n: 4, last: TODAY });
  assert.deepEqual(E.bumpStreak({ n: 4, last: "2026-02-28" }, TODAY), { n: 5, last: TODAY });
  assert.deepEqual(E.bumpStreak({ n: 9, last: "2026-02-20" }, TODAY), { n: 1, last: TODAY });
  assert.deepEqual(E.bumpStreak({ n: 0, last: null }, TODAY), { n: 1, last: TODAY });
});

/* 9 — deck lint across all five decks */
const EXPECTED = { py: 46, java: 46, go: 46, cpp: 45, ts: 47 };
check("deck lint: sizes, unique ids, lv range, non-empty t/p/a", () => {
  let total = 0;
  assert.equal(LANGS.length, 5);
  for (const lang of LANGS) {
    const { id, deck, levels } = lang;
    assert.equal(deck.length, EXPECTED[id], `${id}: expected ${EXPECTED[id]} blocks, got ${deck.length}`);
    total += deck.length;
    assert.equal(new Set(deck.map((d) => d.id)).size, deck.length, `${id}: duplicate drill id`);
    assert.equal(levels.length, 6, `${id}: expected 6 level labels`);
    for (const d of deck) {
      assert.ok(Number.isInteger(d.lv) && d.lv >= 0 && d.lv <= 5, `${id}/${d.id}: lv out of range (${d.lv})`);
      for (const f of ["t", "p", "a"]) {
        assert.ok(typeof d[f] === "string" && d[f].trim().length > 0, `${id}/${d.id}: empty ${f}`);
      }
      if (d.v !== undefined) {
        assert.ok(Array.isArray(d.v) && d.v.every((x) => typeof x === "string" && x.trim()), `${id}/${d.id}: bad variants`);
      }
    }
  }
  assert.equal(total, 230, `expected 230 blocks across all decks, got ${total}`);
});

/* ── symmetry lint (phase E §4) ────────────────────────────────────────────
   Adapted from the provided lint-symmetry.mjs. Semantics are kept exactly;
   only the module loading changes — the reference imported from ./dist, this
   uses the temp-dir CommonJS build the rest of this file already relies on. */

console.log("\n" + LANGS.map((l) => `${l.id}:${l.deck.length}`).join("  ") + `  — TỔNG ${LANGS.reduce((n, l) => n + l.deck.length, 0)}`);

const IDS = Object.fromEntries(LANGS.map((l) => [l.id, new Set(l.deck.map((d) => d.id))]));
const claimed = Object.fromEntries(LANGS.map((l) => [l.id, new Set()]));

/* §4.2 — every row covers all five languages; every drill cell names a real
   id; a valid drill cell marks that id as entered in the ledger. */
check("concepts: every row covers 5 languages and points at real drills", () => {
  const problems = [];
  for (const row of CONCEPTS) {
    const langs = Object.keys(row.cells);
    if (langs.length !== 5) problems.push(`${row.concept}: ${langs.length}/5 ngôn ngữ`);
    for (const [lang, cell] of Object.entries(row.cells)) {
      if (!("drill" in cell)) continue;
      if (!IDS[lang]?.has(cell.drill)) problems.push(`${row.concept}.${lang} → id không tồn tại: ${cell.drill}`);
      else claimed[lang].add(cell.drill);
    }
  }
  assert.deepEqual(problems, [], "\n       " + problems.join("\n       "));
});

/* §4.3 — auto-group every drill by id suffix; python ids carry no prefix. */
const strip = (lang, id) => (lang === "py" ? id : id.replace(/^[jgct]-/, ""));
const groups = new Map();
for (const l of LANGS) {
  for (const d of l.deck) {
    const s = strip(l.id, d.id);
    if (!groups.has(s)) groups.set(s, new Map());
    groups.get(s).set(l.id, d.id);
  }
}

let warn = 0;
check("symmetry: no unexplained asymmetry (1 < k < 5 must be fully in the ledger)", () => {
  const failures = [];
  for (const [suffix, m] of groups) {
    const k = m.size;
    if (k === 5) continue;
    const allClaimed = [...m.entries()].every(([lang, id]) => claimed[lang].has(id));
    if (k === 1) { if (!allClaimed) warn++; continue; }
    if (!allClaimed) failures.push(`'${suffix}' ở [${[...m.keys()].join(", ")}]`);
  }
  assert.deepEqual(failures, [], "BẤT ĐỐI XỨNG chưa giải thích:\n       " + failures.join("\n       "));
});
console.log(`đối xứng: ${process.exitCode ? "có" : "0"} FAIL · ${warn} khối đơn nhất chưa vào sổ (WARN)`);

fs.rmSync(OUT, { recursive: true, force: true });
console.log(`\n${passed} check(s) passed` + (process.exitCode ? " — WITH FAILURES" : ""));
