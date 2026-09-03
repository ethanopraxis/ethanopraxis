import { getCollection } from 'astro:content';
import rawVideos from '../data/videos.json';

export interface Item {
  id: string;
  type: 'video' | 'short' | 'series-episode' | 'course-lesson';
  title: string;
  description: string;
  publishedAt: string;
  durationSec: number;
  youtubeId?: string;
  series?: string;
  domain?: string;
  /** dieu ids, e.g. "kien-khiem/dieu-17" */
  method: string[];
  day?: number;
  course?: string;
  module?: string;
  order?: number;
  draft: boolean;
}

/** A raw upload with no curated entry still gets a page; type comes from length. */
const SHORT_MAX_SEC = 90;

/**
 * The unified catalogue: the raw YouTube feed merged with curated entries in
 * src/content/items. A curated entry with a matching youtubeId wins on every
 * field it sets. Drafts are dropped from production builds — the single flag
 * that gates Đại Nguyện.
 */
export async function getCatalog(): Promise<Item[]> {
  const curated = await getCollection('items');
  const byYoutubeId = new Map(
    curated.filter((c) => c.data.youtubeId).map((c) => [c.data.youtubeId!, c])
  );

  const items: Item[] = rawVideos.map((v) => {
    const c = byYoutubeId.get(v.id);
    return {
      id: v.id,
      type: c?.data.type ?? (v.durationSec <= SHORT_MAX_SEC ? 'short' : 'video'),
      title: c?.data.title ?? v.title,
      description: v.description,
      publishedAt: v.publishedAt,
      durationSec: v.durationSec,
      youtubeId: v.id,
      series: c?.data.series,
      domain: c?.data.domain?.id,
      method: c?.data.method ?? [],
      day: c?.data.day,
      course: c?.data.course,
      module: c?.data.module,
      order: c?.data.order,
      draft: c?.data.draft ?? false,
    };
  });

  // Curated entries that are not backed by a YouTube upload stand on their own.
  for (const c of curated) {
    if (c.data.youtubeId && byYoutubeId.has(c.data.youtubeId)) continue;
    items.push({
      id: c.id,
      type: c.data.type,
      title: c.data.title ?? c.id,
      description: '',
      publishedAt: new Date(0).toISOString(),
      durationSec: 0,
      youtubeId: c.data.youtubeId,
      series: c.data.series,
      domain: c.data.domain?.id,
      method: c.data.method,
      day: c.data.day,
      course: c.data.course,
      module: c.data.module,
      order: c.data.order,
      draft: c.data.draft,
    });
  }

  const visible = import.meta.env.PROD ? items.filter((i) => !i.draft) : items;
  return visible.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

/** Items tagged with a given doctrine node id. */
export const itemsForMethod = (items: Item[], nodeId: string): Item[] =>
  items.filter((i) => i.method.includes(nodeId));
