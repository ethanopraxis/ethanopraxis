/**
 * Nền Móng — pure logic. No DOM, no storage, no LangId.
 *
 * Transcribed from docs/reference/nen-mong-v0.jsx (gradeGate / gradeBuild /
 * gradeSurvey / bumpStreak). Behaviour is frozen: see KỴ 5. The transitions
 * return new objects rather than mutating, so callers stay explicit.
 */
import type { Drill, Grade } from "./types";

export const INTERVALS = [1, 2, 4, 7, 14, 30] as const;
export const DAILY_BATCH = 6;

/** Journal and lastMissCode keep at most this many characters of typed code. */
const MAX_CODE = 600;

export type NodeStatus = "u" | "b" | "s";

export interface NodeState {
  st: NodeStatus;
  iv: number;
  due: string | null;
  at: number;
  miss: number;
  lastMissCode: string | null;
  cr: boolean;
}

export interface JournalEntry {
  d: string;
  id: string;
  g: Grade;
  code: string;
  secs: number;
}

export interface Streak {
  n: number;
  last: string | null;
}

export interface AppState {
  nodes: Record<string, NodeState>;
  journal: JournalEntry[];
  streak: Streak;
  lastBuildDate: string | null;
  buildsToday: number;
  surveyDone: boolean;
}

/** What a grade carries besides the grade itself. */
export interface GradeInput {
  id: string;
  code: string;
  secs: number;
}

export interface GradeResult {
  node: NodeState;
  journal?: JournalEntry;
}

/* ---------- date utils ---------- */

export function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

export function addDays(s: string, n: number): string {
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const dt = new Date(y, m - 1, d + n);
  const p = (v: number) => String(v).padStart(2, "0");
  return dt.getFullYear() + "-" + p(dt.getMonth() + 1) + "-" + p(dt.getDate());
}

/* ---------- state constructors ---------- */

export function freshNode(): NodeState {
  return { st: "u", iv: 0, due: null, at: 0, miss: 0, lastMissCode: null, cr: false };
}

export function defaultState(deck: Drill[]): AppState {
  const nodes: Record<string, NodeState> = {};
  deck.forEach((d) => {
    nodes[d.id] = freshNode();
  });
  return {
    nodes,
    journal: [],
    streak: { n: 0, last: null },
    lastBuildDate: null,
    buildsToday: 0,
    surveyDone: false,
  };
}

const truncate = (code: string) => code.slice(0, MAX_CODE);

/* ---------- transitions ---------- */

/** Nghiệm thu. Passing seals and advances the interval; failing unseals. */
export function applyGate(
  node: NodeState,
  g: Grade,
  today: string,
  input: GradeInput,
): GradeResult {
  const nd: NodeState = { ...node };
  nd.at += 1;

  if (g === "dung") {
    nd.iv = Math.min(nd.iv + 1, INTERVALS.length - 1);
    nd.due = addDays(today, INTERVALS[nd.iv]!);
    nd.st = "s";
    nd.cr = false;
    nd.lastMissCode = null;
    return { node: nd };
  }

  if (g === "lech") {
    nd.due = addDays(today, 1);
    return {
      node: nd,
      journal: { d: today, id: input.id, g, code: truncate(input.code), secs: input.secs },
    };
  }

  // sai — a sealed node that fails is cracked, and stays cracked.
  const wasSealed = nd.st === "s";
  nd.st = "u";
  nd.iv = 0;
  nd.due = null;
  nd.cr = wasSealed || nd.cr;
  nd.miss += 1;
  nd.lastMissCode = input.code ? truncate(input.code) : nd.lastMissCode;
  return {
    node: nd,
    journal: { d: today, id: input.id, g: "sai", code: truncate(input.code ?? ""), secs: input.secs },
  };
}

/** Xây. Any grade puts the block on tomorrow's gate. */
export function applyBuild(
  node: NodeState,
  g: Grade,
  today: string,
  input: GradeInput,
): GradeResult {
  const nd: NodeState = { ...node };
  nd.at += 1;
  nd.st = "b";
  nd.iv = 0;
  nd.due = addDays(today, 1);

  if (g === "sai") {
    nd.miss += 1;
    nd.lastMissCode = input.code ? truncate(input.code) : nd.lastMissCode;
    return {
      node: nd,
      journal: { d: today, id: input.id, g: "sai", code: truncate(input.code ?? ""), secs: input.secs },
    };
  }

  nd.lastMissCode = null;
  return { node: nd };
}

/** Khảo sát. Only a pass schedules the block; a miss just counts the attempt. */
export function applySurvey(node: NodeState, g: Grade, today: string): { node: NodeState } {
  const nd: NodeState = { ...node };
  nd.at += 1;
  if (g === "dung") {
    nd.st = "b";
    nd.iv = 1;
    nd.due = addDays(today, 2);
    nd.lastMissCode = null;
  }
  return { node: nd };
}

/** Same day is a no-op; a consecutive day increments; any gap resets to 1. */
export function bumpStreak(streak: Streak, today: string): Streak {
  if (streak.last === today) return { ...streak };
  return {
    n: streak.last === addDays(today, -1) ? streak.n + 1 : 1,
    last: today,
  };
}
