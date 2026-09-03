export interface Chapter {
  seconds: number;
  label: string;
  stamp: string;
}

const LINE = /^\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–—:]?\s*(.+?)\s*$/;

/** Parse "0:00 Title" lines out of a YouTube description. */
export function parseChapters(description: string): Chapter[] {
  const out: Chapter[] = [];
  for (const line of description.split('\n')) {
    const m = LINE.exec(line);
    if (!m) continue;
    const [, h, mm, ss, label] = m;
    const seconds = (Number(h ?? 0) * 3600) + (Number(mm) * 60) + Number(ss);
    if (out.length === 0 && seconds !== 0) continue; // a real list starts at 0:00
    out.push({ seconds, label, stamp: `${h ? h + ':' : ''}${mm}:${ss}` });
  }
  return out.length >= 2 ? out : [];
}

/** The description with its chapter lines removed. */
export function stripChapters(description: string): string {
  if (parseChapters(description).length === 0) return description;
  return description
    .split('\n')
    .filter((line) => !LINE.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
