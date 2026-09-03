/**
 * Đóng dấu — visitor progress as vermilion seals. No accounts, no server.
 * Storage key `ethano.stamps.v1`: { [nodeOrItemId]: epochMillis }.
 *
 * Browser-only: every entry point returns a safe empty value when there is no
 * `window` (build/SSR) or when storage is unavailable (private mode, blocked).
 */
const KEY = 'ethano.stamps.v1';

export type Stamps = Record<string, number>;

const store = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function readStamps(): Stamps {
  const s = store();
  if (!s) return {};
  try {
    const parsed = JSON.parse(s.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Stamps) : {};
  } catch {
    return {};
  }
}

export function isStamped(id: string): boolean {
  return id in readStamps();
}

/** Stamp an id. Returns the new set, or the old one if storage is unavailable. */
export function stamp(id: string): Stamps {
  const s = store();
  const next = { ...readStamps(), [id]: Date.now() };
  try {
    s?.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota or blocked — progress is a nicety, never an error */
  }
  return next;
}

export function unstamp(id: string): Stamps {
  const s = store();
  const next = readStamps();
  delete next[id];
  try {
    s?.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}
