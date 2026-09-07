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

process.stdout.write("compiling engine + decks + concepts + grader… ");
try {
  execFileSync(
  process.execPath,
  [
    path.join(ROOT, "node_modules/typescript/lib/tsc.js"),
    path.join(ROOT, "src/lib/nenmong/engine.ts"),
    path.join(ROOT, "src/data/nenmong/index.ts"),
    path.join(ROOT, "src/data/nenmong/concepts.ts"),
    path.join(ROOT, "src/lib/nenmong/sqlgrader.ts"),
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
// The compiled grader requires "sql.js" by bare specifier; the temp dir needs a
// node_modules to resolve it from.
try { fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(OUT, "node_modules"), "dir"); } catch { /* exists */ }
console.log("ok");

const req = createRequire(path.join(OUT, "package.json"));
const E = req(path.join(OUT, "lib/nenmong/engine.js"));
const { LANGS } = req(path.join(OUT, "data/nenmong/index.js"));
const { CONCEPTS } = req(path.join(OUT, "data/nenmong/concepts.js"));
const GRADER = req(path.join(OUT, "lib/nenmong/sqlgrader.js"));
const { SETUPS } = req(path.join(OUT, "data/nenmong/deck-sql.js"));

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
const EXPECTED = { py: 46, java: 46, go: 46, cpp: 45, ts: 47, sql: 37 };
check("deck lint: sizes, unique ids, lv range, non-empty t/p/a", () => {
  let total = 0;
  assert.equal(LANGS.length, 6);
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
  assert.equal(total, 267, `expected 267 blocks across all decks, got ${total}`);
});

/* ── symmetry lint (phase E §4) ────────────────────────────────────────────
   Adapted from the provided lint-symmetry.mjs. Semantics are kept exactly;
   only the module loading changes — the reference imported from ./dist, this
   uses the temp-dir CommonJS build the rest of this file already relies on. */

console.log("\n" + LANGS.map((l) => `${l.id}:${l.deck.length}`).join("  ") + `  — TỔNG ${LANGS.reduce((n, l) => n + l.deck.length, 0)}`);

/* Symmetry is a property of the five DSA decks, which teach the same concepts
   in five languages. SQL is its own subject with no counterpart deck, so it is
   excluded from the auto-group and gets structural linting only (§5.1). */
const SYMMETRY = ["py", "java", "go", "cpp", "ts"];
const DSA = LANGS.filter((l) => SYMMETRY.includes(l.id));
const IDS = Object.fromEntries(DSA.map((l) => [l.id, new Set(l.deck.map((d) => d.id))]));
const claimed = Object.fromEntries(DSA.map((l) => [l.id, new Set()]));

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
for (const l of DSA) {
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

const compareStatus = (a, b, ordered) => GRADER.compareResults(a, b, ordered).status;

/* ── SQL track (phase F §5.2, §5.3) ───────────────────────────────────────── */

const checkAsync = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log("  ok   " + name);
  } catch (err) {
    console.error("  FAIL " + name + "\n       " + err.message);
    process.exitCode = 1;
  }
};

const sqlDeck = LANGS.find((l) => l.id === "sql").deck;
const rs = (columns, values) => ({ columns, values });

/* §5.2 — every canonical answer must actually run against its setup. A broken
   canonical throws (§3.7), which is exactly what this catches. */
await checkAsync("SQL: every drill.sql canonical answer runs on its setup", async () => {
  const runnable = sqlDeck.filter((d) => d.sql);
  assert.equal(runnable.length, 31, `expected 31 executable drills, got ${runnable.length}`);
  for (const d of runnable) {
    assert.ok(SETUPS[d.sql.setup], `${d.id}: unknown setup "${d.sql.setup}"`);
    const res = await GRADER.runOnFreshDb(d.sql.setup, d.a);
    const rows = res ? res.values.length : 0;
    assert.ok(rows >= 0, `${d.id}: negative row count`);
  }
});

/* The pair is a test OF THE COMPARISON: two different formulations of the same
   question must agree as multisets. */
await checkAsync("SQL: q-l4-corr and q-l4-cte agree as multisets", async () => {
  const corr = sqlDeck.find((d) => d.id === "q-l4-corr");
  const cte = sqlDeck.find((d) => d.id === "q-l4-cte");
  assert.ok(corr && cte, "the corr/CTE pair is missing from the deck");
  const a = await GRADER.runOnFreshDb(corr.sql.setup, corr.a);
  const b = await GRADER.runOnFreshDb(cte.sql.setup, cte.a);
  const v = GRADER.compareResults(a, b, false);
  assert.equal(v.status, "match", `expected a match, got ${JSON.stringify(v)}`);
});

/* An `ordered` drill must really be order-sensitive end to end. */
await checkAsync("SQL: an ordered drill rejects the same rows reversed", async () => {
  const d = sqlDeck.find((x) => x.sql && x.sql.ordered === true);
  assert.ok(d, "no ordered drill in the deck");
  const expected = await GRADER.runOnFreshDb(d.sql.setup, d.a);
  const reversed = { columns: expected.columns, values: [...expected.values].reverse() };
  assert.equal(GRADER.compareResults(expected, reversed, true).status, "diff");
  assert.equal(GRADER.compareResults(expected, reversed, false).status, "match");
});

/* §5.3 — the comparison rules, pinned. */
check("compare: row order is irrelevant when ordered=false", () => {
  const a = rs(["ten", "luong"], [["An", 3000], ["Binh", 2500]]);
  const b = rs(["ten", "luong"], [["Binh", 2500], ["An", 3000]]);
  assert.equal(compareStatus(a, b, false), "match");
  assert.equal(compareStatus(a, b, true), "diff");
});
check("compare: column aliases are ignored, column COUNT is not", () => {
  assert.equal(compareStatus(rs(["ten"], [["An"]]), rs(["name"], [["An"]]), false), "match");
  assert.equal(compareStatus(rs(["a", "b"], [[1, 2]]), rs(["a"], [[1]]), false), "diff");
});
check("compare: numbers match within 1e-6, differ beyond it", () => {
  assert.equal(compareStatus(rs(["v"], [[2500]]), rs(["v"], [[2500.0]]), false), "match");
  assert.equal(compareStatus(rs(["v"], [[2666.6666666666665]]), rs(["v"], [[2666.666666666667]]), false), "match");
  assert.equal(compareStatus(rs(["v"], [[2666.666666]]), rs(["v"], [[2667]]), false), "diff");
});
check("compare: null is neither 0 nor the empty string", () => {
  assert.equal(compareStatus(rs(["v"], [[null]]), rs(["v"], [[0]]), false), "diff");
  assert.equal(compareStatus(rs(["v"], [[null]]), rs(["v"], [[""]]), false), "diff");
  assert.equal(compareStatus(rs(["v"], [[null]]), rs(["v"], [[null]]), false), "match");
});
check("compare: an empty result set matches another empty one", () => {
  assert.equal(compareStatus(null, null, false), "match");
  assert.equal(compareStatus(rs(["v"], [[1]]), null, false), "diff");
});

fs.rmSync(OUT, { recursive: true, force: true });
console.log(`\n${passed} check(s) passed` + (process.exitCode ? " — WITH FAILURES" : ""));
