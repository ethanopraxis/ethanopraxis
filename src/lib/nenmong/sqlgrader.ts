/**
 * Nền Móng — SQL evidence grader (Phase F §3).
 *
 * Runs the canonical answer and the visitor's answer against two FRESH
 * in-memory SQLite databases and reports how the result sets differ. It
 * produces EVIDENCE only: the three grade buttons stay human-operated (§7 KỴ 1
 * — máy đưa bằng chứng, người giữ quyền phán đoán).
 *
 * This module is imported dynamically, and only for a track whose LangDef has
 * grader === "sqlite", so the five DSA tracks download none of it (§7 KỴ 2).
 *
 * Deliberately free of Vite-only specifiers: the `?url` import for the wasm
 * lives in the component and arrives via setWasmUrl(), so this file also
 * compiles under plain tsc for the node tests in §5.
 */
import initSqlJs, { type Database, type SqlValue, type SqlJsStatic } from "sql.js";
import type { Drill } from "./types";
import { SETUPS } from "../../data/nenmong/deck-sql";

export type Verdict =
  | { status: "match"; rows: number }
  | { status: "diff"; expectedRows: number; gotRows: number; hint: string }
  | { status: "error"; message: string };

/** A single result set: sql.js reports no result set at all for zero rows. */
export interface ResultSet {
  columns: string[];
  values: SqlValue[][];
}

/** Numbers are compared with tolerance so AVG/ROUND REALs still line up. */
const EPSILON = 1e-6;

let wasmUrl: string | undefined;

/** Browser only. In node sql.js resolves its own wasm beside the module. */
export function setWasmUrl(url: string): void {
  wasmUrl = url;
}

/** Fetch and compile the wasm ahead of the first check, without blocking (§2). */
export function prewarm(): void {
  void getSql().catch(() => { /* the real attempt will surface the error */ });
}

let sqlPromise: Promise<SqlJsStatic> | null = null;
function getSql(): Promise<SqlJsStatic> {
  sqlPromise ??= initSqlJs(wasmUrl ? { locateFile: () => wasmUrl! } : undefined);
  return sqlPromise;
}

/* ---------- comparison (pure — §5.3 tests this directly) ---------- */

function cellEqual(a: SqlValue, b: SqlValue): boolean {
  // null is its own value: never equal to 0 or to the empty string.
  if (a === null || b === null) return a === null && b === null;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < EPSILON;
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }
  return a === b;
}

const rowEqual = (a: SqlValue[], b: SqlValue[]): boolean =>
  a.length === b.length && a.every((c, i) => cellEqual(c, b[i]!));

const showCell = (c: SqlValue): string =>
  c === null ? "NULL" : c instanceof Uint8Array ? "<blob>" : String(c);

const showRow = (r: SqlValue[]): string => "(" + r.map(showCell).join(", ") + ")";

/**
 * Compare two result sets. Column NAMES are ignored — only the count matters,
 * so a different alias still matches. Rows compare as a multiset unless the
 * drill declares ordered, in which case position matters.
 */
export function compareResults(
  expected: ResultSet | null,
  got: ResultSet | null,
  ordered: boolean,
): Verdict {
  const exp = expected?.values ?? [];
  const gotRows = got?.values ?? [];

  if (exp.length === 0 && gotRows.length === 0) return { status: "match", rows: 0 };

  const expCols = expected?.columns.length ?? 0;
  const gotCols = got?.columns.length ?? 0;
  if (expected && got && expCols !== gotCols) {
    return {
      status: "diff",
      expectedRows: exp.length,
      gotRows: gotRows.length,
      hint: `số cột khác — chuẩn ${expCols}, của bạn ${gotCols}`,
    };
  }

  const diff = (hint: string): Verdict => ({
    status: "diff",
    expectedRows: exp.length,
    gotRows: gotRows.length,
    hint,
  });

  if (ordered) {
    const n = Math.min(exp.length, gotRows.length);
    for (let i = 0; i < n; i++) {
      if (!rowEqual(exp[i]!, gotRows[i]!)) {
        return diff(`dòng ${i + 1} lệch — chuẩn ${showRow(exp[i]!)}, của bạn ${showRow(gotRows[i]!)}`);
      }
    }
    if (exp.length !== gotRows.length) {
      return exp.length > gotRows.length
        ? diff(`thiếu: ${showRow(exp[n]!)}`)
        : diff(`thừa: ${showRow(gotRows[n]!)}`);
    }
    return { status: "match", rows: exp.length };
  }

  // Multiset: pair each expected row with an unmatched row from the answer.
  // Pairwise rather than key-counting because numbers compare with tolerance.
  const taken = new Array<boolean>(gotRows.length).fill(false);
  for (const row of exp) {
    const i = gotRows.findIndex((g, gi) => !taken[gi] && rowEqual(row, g));
    if (i < 0) return diff(`thiếu: ${showRow(row)}`);
    taken[i] = true;
  }
  const extra = taken.indexOf(false);
  if (extra >= 0) return diff(`thừa: ${showRow(gotRows[extra]!)}`);
  return { status: "match", rows: exp.length };
}

/* ---------- execution ---------- */

/** Last result set wins: the visitor may type several statements. */
export function lastResult(db: Database, sql: string): ResultSet | null {
  const sets = db.exec(sql);
  if (sets.length === 0) return null;
  const last = sets[sets.length - 1]!;
  return { columns: last.columns, values: last.values };
}

/** Fresh database per query — no state leaks between the two runs (§3.1). */
export async function runOnFreshDb(setup: string, sql: string): Promise<ResultSet | null> {
  const SQL = await getSql();
  const db = new SQL.Database();
  try {
    db.run(SETUPS[setup]!);
    return lastResult(db, sql);
  } finally {
    db.close();
  }
}

/**
 * Evidence for one attempt. A failure in the VISITOR's SQL is feedback, not a
 * grader failure, so it returns status "error"; a failure in the CANONICAL
 * answer means the deck is broken and throws, so the §5 tests catch it.
 */
export async function checkSql(drill: Drill, userSql: string): Promise<Verdict> {
  if (!drill.sql) throw new Error(`drill ${drill.id} has no sql block`);
  const { setup, ordered } = drill.sql;
  if (!(setup in SETUPS)) throw new Error(`unknown setup "${setup}" on drill ${drill.id}`);

  const expected = await runOnFreshDb(setup, drill.a);

  let got: ResultSet | null;
  try {
    got = await runOnFreshDb(setup, userSql);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }

  return compareResults(expected, got, ordered === true);
}
