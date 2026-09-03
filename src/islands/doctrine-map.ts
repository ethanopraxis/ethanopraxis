/**
 * The doctrine map. Geometry and edge paths arrive finished from /map.json —
 * there is no layout or simulation in the browser, only drawing and interaction.
 *
 * The semantic index below the map is the real content: this is an alternative
 * view of it, so nothing here is required to reach any page.
 */
import { readStamps } from '../lib/stamps';

interface MapNode {
  id: string; kind: string; phap?: string; quyen?: number;
  label: string; essence?: string; url: string;
  x: number; y: number; itemCount: number;
}
interface MapEdge { from: string; to: string; d: string }
interface MapData { viewBox: string; centre: MapNode; nodes: MapNode[]; edges: MapEdge[] }

const SVG = 'http://www.w3.org/2000/svg';
const el = <K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>) => {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

export async function mount(host: HTMLElement): Promise<void> {
  const src = host.dataset.src;
  if (!src) return;

  let data: MapData;
  try {
    data = await (await fetch(src)).json();
  } catch {
    return; // the semantic index is already on the page; leave it at that
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stamped = readStamps();

  const svg = el('svg', {
    viewBox: data.viewBox,
    class: 'map__svg',
    role: 'img',
    'aria-labelledby': 'map-title map-desc',
  });
  const titleEl = el('title', { id: 'map-title' });
  titleEl.textContent = 'Bản đồ hai bộ binh pháp';
  const descEl = el('desc', { id: 'map-desc' });
  descEl.textContent =
    'Sơ đồ các quyển và các mục của Binh Pháp Kiển – Khiêm và Binh Pháp Nhu – Tỉnh. ' +
    'Danh sách đầy đủ nằm ngay bên dưới bản đồ.';
  svg.append(titleEl, descEl);

  const edgeLayer = el('g', { class: 'map__edges', fill: 'none' });
  const nodeLayer = el('g', { class: 'map__nodes' });
  svg.append(edgeLayer, nodeLayer);

  const edgeEls: SVGPathElement[] = [];
  for (const edge of data.edges) {
    const p = el('path', { d: edge.d, class: 'map__edge' });
    edgeLayer.append(p);
    edgeEls.push(p);
  }

  // Centre mark: the point both doctrines hang from.
  nodeLayer.append(el('circle', { cx: data.centre.x, cy: data.centre.y, r: 5, class: 'map__centre' }));

  const nodeEls: SVGGElement[] = [];
  for (const node of data.nodes) {
    const a = el('a', { class: `map__node map__node--${node.kind}`, tabindex: 0 });
    a.setAttributeNS('http://www.w3.org/1999/xlink', 'href', node.url);
    a.setAttribute('href', node.url);

    const isQuyen = node.kind === 'quyen';
    const r = isQuyen ? 9 : 6;
    const ring = el('circle', {
      cx: node.x, cy: node.y, r,
      class: 'map__ring' + (stamped[node.id] ? ' is-visited' : ''),
    });
    a.append(ring);
    if (node.itemCount > 0) {
      a.append(el('circle', { cx: node.x + r + 4, cy: node.y - r + 1, r: 2.6, class: 'map__has-video' }));
    }
    // Hit area: the rings are small; keep them comfortably tappable.
    a.append(el('circle', { cx: node.x, cy: node.y, r: 17, class: 'map__hit' }));

    const label = el('title', {});
    label.textContent = node.label;
    a.append(label);

    a.dataset.id = node.id;
    nodeLayer.append(a);
    nodeEls.push(a as unknown as SVGGElement);

    bindPreview(a as unknown as SVGGElement, node, host);
  }

  host.querySelector('.map__placeholder')?.remove();
  host.prepend(svg);

  if (reduced || sessionStorage.getItem('ethano_map_seen')) {
    svg.classList.add('is-drawn');
    return;
  }
  sessionStorage.setItem('ethano_map_seen', '1');
  void drawIn(svg, edgeEls, nodeEls);
}

/** Preview card on hover / focus; first tap on touch, second tap navigates. */
function bindPreview(a: SVGGElement, node: MapNode, host: HTMLElement) {
  const card = host.querySelector<HTMLElement>('.map__preview');
  if (!card) return;

  const show = () => {
    card.querySelector('.map__preview-title')!.textContent = node.label;
    const essence = card.querySelector<HTMLElement>('.map__preview-essence')!;
    essence.textContent = node.essence && !/^\s*TODO\(/.test(node.essence) ? node.essence : '';
    const meta = [
      node.itemCount > 0 ? `${node.itemCount} video` : null,
      node.quyen ? `Quyển ${node.quyen}` : null,
    ].filter(Boolean).join(' · ');
    card.querySelector('.map__preview-meta')!.textContent = meta;
    card.hidden = false;
    host.dataset.active = node.id;
  };
  const hide = () => { card.hidden = true; delete host.dataset.active; };

  a.addEventListener('pointerenter', (e) => { if ((e as PointerEvent).pointerType !== 'touch') show(); });
  a.addEventListener('pointerleave', (e) => { if ((e as PointerEvent).pointerType !== 'touch') hide(); });
  a.addEventListener('focus', show);
  a.addEventListener('blur', hide);
  a.addEventListener('click', (e) => {
    // On touch, the first tap reveals; only a second tap follows the link.
    if (matchMedia('(hover: hover)').matches) return;
    if (host.dataset.active !== node.id) { e.preventDefault(); show(); }
  });
  a.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape') { hide(); (a as unknown as HTMLElement).blur(); }
  });
}

/** Ink strokes draw on, then their nodes appear. Loaded only when it will run. */
async function drawIn(svg: SVGElement, edges: SVGPathElement[], nodes: SVGGElement[]) {
  const { gsap } = await import('gsap');
  for (const p of edges) {
    const len = p.getTotalLength();
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = String(len);
  }
  gsap.set(nodes, { opacity: 0 });
  svg.classList.add('is-drawn');
  gsap.to(edges, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', stagger: 0.02 });
  gsap.to(nodes, { opacity: 1, duration: 0.35, stagger: 0.02, delay: 0.25 });
}
