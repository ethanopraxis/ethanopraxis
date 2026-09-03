import { getCollection, type CollectionEntry } from 'astro:content';
import quyenData from '../data/doctrine-quyen.json';

export type DieuEntry = CollectionEntry<'dieu'>;
export type Phap = 'kien-khiem' | 'nhu-tinh';

export const PHAP_TITLE: Record<Phap, string> = {
  'kien-khiem': 'Binh Pháp Kiển – Khiêm',
  'nhu-tinh': 'Binh Pháp Nhu – Tỉnh',
};

export interface Quyen {
  phap: Phap;
  quyen: number;
  roman: string;
  title: string;
  subtitle: string | null;
  preamble: string;
  trailing: string;
  nodes: DieuEntry[];
}

const romanOf = (n: number) =>
  ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'][n] ?? String(n);

/** Every node of one binh pháp, grouped into its quyển, in reading order. */
export async function getQuyens(phap: Phap): Promise<Quyen[]> {
  const all = (await getCollection('dieu')).filter((d) => d.data.phap === phap);
  const byQuyen = new Map<number, DieuEntry[]>();
  for (const node of all) {
    if (!byQuyen.has(node.data.quyen)) byQuyen.set(node.data.quyen, []);
    byQuyen.get(node.data.quyen)!.push(node);
  }

  return [...byQuyen.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([quyen, nodes]) => {
      const meta = quyenData.find((q) => q.phap === phap && q.quyen === quyen);
      nodes.sort((a, b) => a.data.order - b.data.order);
      return {
        phap,
        quyen,
        roman: meta?.roman ?? romanOf(quyen),
        title: meta?.title ?? nodes[0]!.data.quyenTitle,
        subtitle: meta?.subtitle ?? null,
        preamble: meta?.preamble ?? '',
        trailing: meta?.trailing ?? '',
        nodes,
      };
    });
}

/** Front and back matter that belongs to no node (Cách Đọc, Đại Kết). */
export const getMatter = (phap: Phap, which: 0 | 99) =>
  quyenData.find((q) => q.phap === phap && q.quyen === which) ?? null;

/** A node id as used on items: "kien-khiem/dieu-17". */
export const nodeId = (entry: DieuEntry) => `${entry.data.phap}/${entry.id.split('/').pop()}`;

export const nodeSlug = (entry: DieuEntry) => entry.id.split('/').pop()!;
