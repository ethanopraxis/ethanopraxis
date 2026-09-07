import type { Drill } from "../../lib/nenmong/types";
import { DECK as PY_DECK, LEVELS as PY_LEVELS } from "./deck-python";
import { DECK as JAVA_DECK, LEVELS as JAVA_LEVELS } from "./deck-java";
import { DECK as GO_DECK, LEVELS as GO_LEVELS } from "./deck-go";
import { DECK as CPP_DECK, LEVELS as CPP_LEVELS } from "./deck-cpp";
import { DECK as TS_DECK, LEVELS as TS_LEVELS } from "./deck-typescript";

export type LangId = "py" | "java" | "go" | "cpp" | "ts";

export interface LangDef {
  id: LangId;
  label: string;
  levels: string[];
  deck: Drill[];
}

export const LANGS: LangDef[] = [
  { id: "py", label: "Python", levels: PY_LEVELS, deck: PY_DECK },
  { id: "java", label: "Java", levels: JAVA_LEVELS, deck: JAVA_DECK },
  { id: "go", label: "Go", levels: GO_LEVELS, deck: GO_DECK },
  { id: "cpp", label: "C++", levels: CPP_LEVELS, deck: CPP_DECK },
  { id: "ts", label: "TypeScript", levels: TS_LEVELS, deck: TS_DECK },
];

export const LANG_BY_ID: Record<LangId, LangDef> = Object.fromEntries(
  LANGS.map((l) => [l.id, l]),
) as Record<LangId, LangDef>;

export const DEFAULT_LANG: LangId = "py";
