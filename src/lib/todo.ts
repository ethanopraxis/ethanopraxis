/** Editorial placeholders live in the files for the owner, never on the page. */
export const isTodo = (s: string | undefined | null): boolean =>
  !!s && /^\s*TODO\(/.test(s);

export const shown = (s: string | undefined | null): string | null =>
  s && !isTodo(s) ? s : null;
