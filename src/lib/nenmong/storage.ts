/**
 * Nền Móng — localStorage adapter, namespaced per language.
 *
 * Async signatures are kept from the reference's window.storage adapter so the
 * component's call sites are unchanged (§7.3). Every entry point is safe when
 * there is no localStorage (astro check / SSR) or when it throws (private mode).
 *
 * Merge-on-load and the daily buildsToday reset stay in the component, exactly
 * where the reference does them, because they need the current language's deck.
 */
import { DEFAULT_LANG, type LangId } from "../../data/nenmong/index";
import type { AppState } from "./engine";

const keyFor = (lang: LangId) => `nenmong-v1:${lang}`;
const LANG_KEY = "nenmong-lang";
const VALID: readonly LangId[] = ["py", "java", "go", "cpp", "ts"];

const store = (): Storage | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage;
  } catch {
    return null;
  }
};

export async function loadState(lang: LangId): Promise<AppState | null> {
  try {
    const s = store();
    if (!s) return null;
    const raw = s.getItem(keyFor(lang));
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

export async function saveState(lang: LangId, s: AppState): Promise<boolean> {
  try {
    const st = store();
    if (!st) return false;
    st.setItem(keyFor(lang), JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** Clears ONLY this language. `nenmong-lang` is never wiped (§5). */
export async function clearState(lang: LangId): Promise<void> {
  try {
    store()?.removeItem(keyFor(lang));
  } catch {
    /* nothing to do */
  }
}

export function loadLang(): LangId {
  try {
    const raw = store()?.getItem(LANG_KEY);
    return VALID.includes(raw as LangId) ? (raw as LangId) : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function saveLang(l: LangId): void {
  try {
    store()?.setItem(LANG_KEY, l);
  } catch {
    /* nothing to do */
  }
}
