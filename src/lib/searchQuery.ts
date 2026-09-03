/**
 * Query-side stopwords. The index keeps every word; only what the visitor types
 * is trimmed, so nothing becomes unfindable.
 *
 * These are the words people wrap a search in ("tìm video về …") plus the
 * commonest Vietnamese function words. Folded forms, because this runs after
 * foldVi. Without this, "tim video ve dao gieng" matches "Tìm …" and "Vẽ …"
 * titles as strongly as the wells content it is actually asking for.
 *
 * Deliberately short: an over-eager list makes real doctrine terms unfindable.
 * "co" is absent on purpose — "có nước" is a Thăm Thủy verdict.
 */
const STOPWORDS = new Set([
  // what people wrap a query in
  'video', 'clip', 'xem', 'tim', 'kiem', 'bai',
  // function words
  've', 'cua', 'va', 'voi', 'cho', 'la', 'thi', 'ma', 'cac', 'nhung', 'mot', 'nao', 'gi',
]);

/**
 * Drop stopwords, but never everything: a query made only of them is left
 * alone so "tìm" still finds "Tìm assumption có sức phá lớn nhất".
 */
export function queryTerms(folded: string): string {
  const words = folded.split(/\s+/).filter(Boolean);
  const kept = words.filter((w) => !STOPWORDS.has(w));
  return (kept.length ? kept : words).join(' ');
}
