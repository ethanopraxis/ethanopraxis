import type { APIRoute } from 'astro';
import { line, curveBasis } from 'd3-shape';
import { getQuyens, nodeSlug, type Phap } from '../lib/doctrine';
import { getCatalog, itemsForMethod } from '../lib/catalog';
import { href } from '../lib/url';

/* Geometry is fixed by PLAN.md §7 and computed here, at build time: the browser
   receives finished coordinates, never a force simulation. */
const CX = 360;
const CY = 320;
const R1 = 170;   // quyển anchors
const R2 = 265;   // nodes
const FAN = 28;   // degrees either side of a quyển anchor
const JITTER = 8; // px, seeded by node id so every build is identical

const HEMISPHERE: Record<Phap, [number, number]> = {
  'kien-khiem': [100, 260],
  'nhu-tinh': [-80, 80],
};

/** FNV-1a: a small stable hash so the jitter is the same on every build. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const jitter = (id: string, axis: number) => {
  const h = hash(id + ':' + axis);
  return ((h % 2001) / 1000 - 1) * JITTER;
};

const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY - r * Math.sin(rad)] as const;
};

/** A gentle ink curve that still meets both endpoints exactly. */
function edgePath(a: readonly [number, number], b: readonly [number, number]): string {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const bow = 7;
  const control: [number, number] = [mx - (dy / len) * bow, my + (dx / len) * bow];
  // Doubling the endpoints makes the B-spline pass through them.
  return line().curve(curveBasis)([a as [number, number], a as [number, number], control, b as [number, number], b as [number, number]]) ?? '';
}

export const GET: APIRoute = async () => {
  const catalog = await getCatalog();
  const nodes: unknown[] = [];
  const edges: unknown[] = [];

  const centre = { id: 'ethano', kind: 'centre', label: 'Ethano', x: CX, y: CY, url: href('/') };

  for (const phap of Object.keys(HEMISPHERE) as Phap[]) {
    const quyens = await getQuyens(phap);
    const [start, end] = HEMISPHERE[phap];
    const span = end - start;

    quyens.forEach((q, qi) => {
      const angle = start + ((qi + 0.5) / quyens.length) * span;
      const [ax, ay] = polar(angle, R1);
      const anchorId = `${phap}/quyen-${q.quyen}`;
      nodes.push({
        id: anchorId, kind: 'quyen', phap, quyen: q.quyen,
        label: q.title, essence: q.subtitle ?? '',
        url: href(`/binh-phap/${phap}/#quyen-${q.quyen}`),
        x: ax, y: ay, itemCount: 0,
      });
      edges.push({ from: 'ethano', to: anchorId, d: edgePath([CX, CY], [ax, ay]) });

      const n = q.nodes.length;
      q.nodes.forEach((node, ni) => {
        // Fan the children around their anchor; a lone child sits on the spoke.
        const offset = n === 1 ? 0 : -FAN + (ni / (n - 1)) * FAN * 2;
        const [bx, by] = polar(angle + offset, R2);
        const id = `${phap}/${nodeSlug(node)}`;
        const x = bx + jitter(id, 0);
        const y = by + jitter(id, 1);
        nodes.push({
          id, kind: node.data.kind, phap, quyen: q.quyen,
          label: node.data.title, essence: node.data.essence,
          url: href(`/binh-phap/${phap}/${nodeSlug(node)}/`),
          x, y, itemCount: itemsForMethod(catalog, id).length,
        });
        edges.push({ from: anchorId, to: id, d: edgePath([ax, ay], [x, y]) });
      });
    });
  }

  return new Response(
    JSON.stringify({ viewBox: `0 0 720 640`, centre, nodes, edges }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
