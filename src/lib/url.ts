/** Prefix a site-root path with Astro's configured `base` (GitHub Pages ships under /ethanopraxis/). */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}
