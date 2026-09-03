/**
 * Fold Vietnamese text for the search index ONLY. Never fold displayed text.
 * Diaspora readers often type without diacritics: "dao gieng khong day" has to
 * reach "đào giếng không đáy".
 */
export const foldVi = (s: string): string =>
  s.toLowerCase()
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')  // strips tone + vowel marks
   .replace(/đ/g, 'd');              // đ (U+0111) has NO NFD decomposition
