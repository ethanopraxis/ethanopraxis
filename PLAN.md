# ETHANO — Website Build Plan

Spec for building the Ethano discovery site. Read fully before writing code.
Execute phase by phase. **Stop at the end of each phase** and wait for the owner's confirmation.
Track progress by checking the boxes in the Phases section.

---

## 1. What this is

A static website for the Vietnamese YouTube channel **Ethano** (@EthanoPraxis) that turns two
original doctrines — **Binh Pháp Kiển–Khiêm** and **Binh Pháp Nhu–Tỉnh** — into the site's
navigation system. Videos, exploration series (Thăm Thủy), and future courses (LeetCode,
system design, ML) hang off the doctrine structure. Hosted on GitHub Pages, custom domain
via GoDaddy, zero servers.

Core ideas already decided (do not relitigate):

1. **Two orthogonal axes.** `phương pháp` (the doctrines — how to think) × `địa hình`
   (domains it's applied to — quantum computing, poker, LeetCode, history…). Every content
   item is tagged on both axes.
2. **The doctrine map is the homepage** — a radial ink map, not a video grid. Clicking a
   node drills into that node's detail page.
3. **Thăm Thủy is a public ledger** — each explored topic shows its *bốn dòng viết trước*
   (giả thuyết / chỉ số dẫn đường / ngân sách / điều kiện dừng) and ends with a stamped
   verdict: `có nước` or `khô`.
4. **Đóng dấu** — visitor progress lives in localStorage as vermilion seal stamps. No accounts.
5. **Đại Nguyện** (lifetime goals view) is built behind `draft: true` — functional locally,
   excluded from the public build until the owner flips it.

Audience: Vietnamese-speaking professionals, VN + diaspora, **mobile-heavy**. Performance
and diacritic handling are first-class requirements, not polish.

---

## 2. Brand system (immutable)

The visual identity already exists (thumbnails, banner, PDFs). Match it exactly.

### Design tokens — write to `src/styles/tokens.css`

```css
:root {
  /* paper + ink */
  --paper:        #F2EADA;  /* aged paper — page background */
  --paper-warm:   #FBF6EA;  /* card / raised paper */
  --paper-shadow: #E7DDC6;  /* blotches, subtle fills */
  --ink:          #2A241C;  /* primary ink — text, strokes */
  --ink-soft:     #5C5347;  /* secondary text */
  --ink-faint:    #8A7F6C;  /* muted text, captions */
  --line:         #C9BEA6;  /* hairline rules, borders */
  --vermilion:    #B13125;  /* seals, verdicts, accents — use sparingly */
  --vermilion-ink:#8E2318;  /* vermilion text on paper (darker for contrast) */

  /* type */
  --font-serif: 'Lora Variable', Lora, Georgia, 'Times New Roman', serif;
  --step--1: clamp(0.83rem, 0.80rem + 0.15vw, 0.94rem);
  --step-0:  clamp(1.00rem, 0.95rem + 0.25vw, 1.13rem);
  --step-1:  clamp(1.25rem, 1.15rem + 0.50vw, 1.50rem);
  --step-2:  clamp(1.56rem, 1.35rem + 1.00vw, 2.25rem);
  --step-3:  clamp(1.95rem, 1.55rem + 2.00vw, 3.40rem);

  /* rhythm */
  --space-1: 0.5rem; --space-2: 1rem; --space-3: 1.5rem;
  --space-4: 2.5rem; --space-5: 4rem;
  --radius-seal: 4px;
  --measure: 68ch;
}
```

### Aesthetic rules

- Everything sits on `--paper`. **No white cards, no drop shadows, no gradients.** Elevation
  is expressed with `--paper-warm` fill + 1px `--line` border + a 1–2° rotation for
  "placed on the desk" objects (preview cards, seals).
- `--vermilion` is reserved for **meaning**: seals, verdicts, "has video" markers, active
  states, châu phê margin annotations. Never decorative. If a page has vermilion in more
  than ~3 places, it's wrong.
- Typography is Lora everywhere (self-host via `@fontsource-variable/lora`). Body ≥ 16px,
  line-height 1.7, max line length `--measure`. Diacritics must never be stripped in
  displayed text — folding is for the search index only.
- Ink strokes (SVG): `stroke: var(--ink)`, `stroke-linecap: round`, varying widths
  1.5–2.5px, slight curvature. Hand-drawn wobble via rough.js only where it reads well.
- Motion discipline: motion only for **meaning** (navigation, revelation, completion).
  No ambient looping animation. Every animation respects `prefers-reduced-motion`
  (skip to final state, never just slow down). One signature visual per page, maximum.
- Language: `<html lang="vi">`. UI copy in Vietnamese. Leave `TODO(owner):` comments for
  any Vietnamese copy you are not certain of — **never invent doctrine wording**; quote it
  verbatim from the source PDFs.

---

## 3. Tech stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro** (latest stable, ≥ v5), TypeScript strict, `output: 'static'` | Content Layer collections; islands architecture |
| UI framework | **None** | Astro components + vanilla TS islands. Do NOT add React/Vue/Svelte/Tailwind |
| Animation | **GSAP** + ScrollTrigger | draw-on strokes, scrollytelling, stamp press |
| Layout math | **D3 modules only**: `d3-hierarchy`, `d3-selection`, `d3-zoom`, `d3-shape` | no monolithic `d3` import |
| Hand-drawn strokes | `roughjs` (optional, per-visual) | |
| Search | **@orama/orama** client-side | docs shipped as JSON, index built in the browser |
| Fonts | `@fontsource-variable/lora` | self-hosted, `font-display: swap` |
| Sitemap | `@astrojs/sitemap` | |
| Sync/enrich scripts | Node 22, plain `.mjs`, no extra deps beyond `zod` | run in GitHub Actions |
| Package manager | npm | commit `package-lock.json` |

`astro.config.mjs` must read `site` and `base` from env so the same build works on
`<user>.github.io/<repo>` (before the domain) and on the custom domain (after):

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.github.io/ethano-site',
  base: process.env.BASE_PATH ?? '/',
  output: 'static',
  integrations: [sitemap()],
});
```

---

## 4. Repository layout

```
ethano-site/
├─ PLAN.md                  ← this file
├─ CLAUDE.md                ← conventions for Claude Code
├─ astro.config.mjs
├─ package.json
├─ public/
│  ├─ CNAME                 ← created in Phase 2 (custom domain)
│  ├─ favicon.svg           ← vermilion seal "E"
│  └─ og/                   ← generated OG images (Phase 2)
├─ docs/
│  └─ source/               ← the owner drops BinhPhapKienKhiem.pdf + BinhPhapNhuTinh.pdf here
├─ scripts/
│  ├─ sync-youtube.mjs      ← YouTube Data API → src/data/videos.json
│  ├─ build-search.mjs      ← catalog → public/search-docs.json (folded)
│  ├─ enrich.mjs            ← optional, Phase 3 (aliases via Anthropic API)
│  └─ extract-doctrine.mjs  ← one-off: PDFs → full điều body text (Phase 1)
├─ src/
│  ├─ styles/               ← tokens.css, base.css, prose.css
│  ├─ data/
│  │  ├─ doctrine-seed.json ← Appendix A of this file, verbatim
│  │  ├─ videos.json        ← machine-written by sync; never hand-edit
│  │  └─ enrichment.json    ← machine-written by enrich; optional
│  ├─ content/
│  │  ├─ dieu/              ← one .md per doctrine node (body = full text)
│  │  ├─ items/             ← curated overrides/extra items (.md)
│  │  ├─ domains/           ← địa hình (.md)
│  │  ├─ wells/             ← Thăm Thủy explorations (.md)
│  │  └─ goals/             ← Đại Nguyện (.md, draft by default)
│  ├─ content.config.ts     ← zod schemas (§5)
│  ├─ lib/
│  │  ├─ catalog.ts         ← merges videos.json + content/items → unified Item[]
│  │  ├─ foldVi.ts          ← diacritic folding (§8)
│  │  ├─ chapters.ts        ← parse "0:00 Title" lines from descriptions
│  │  └─ stamps.ts          ← localStorage đóng dấu API
│  ├─ islands/
│  │  ├─ doctrine-map.ts    ← homepage map (D3 + GSAP)
│  │  ├─ search.ts          ← Orama island, lazy-loaded
│  │  └─ stamp.ts           ← seal-press animation
│  ├─ components/           ← .astro: Seal, VideoFacade, ChauPheNote, WellIcon, VerdictSeal…
│  ├─ layouts/Base.astro
│  └─ pages/                ← §6
└─ .github/workflows/
   ├─ deploy.yml
   └─ sync.yml
```

---

## 5. Content model — `src/content.config.ts`

Single source of truth. Use Astro Content Layer with glob loaders.

```ts
import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const dieu = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/dieu' }),
  schema: z.object({
    phap: z.enum(['kien-khiem', 'nhu-tinh']),
    kind: z.enum(['dieu', 'ky', 'nguyen-tac', 'tran', 'that-bai',
                  'menh-lenh', 'khau-quyet', 'quy-luat', 'buoc']),
    quyen: z.number(),                 // quyển number (0 = mở đầu)
    quyenTitle: z.string(),            // e.g. "Chứng Thực"
    order: z.number(),                 // position within quyển
    number: z.number().optional(),     // Điều 17 → 17
    title: z.string(),                 // verbatim from PDF
    essence: z.string(),               // one line, ≤ 90 chars — the owner reviews
    saiKhi: z.string().optional(),     // "Sai khi:" text where the PDF has it
    kiemBang: z.string().optional(),   // "Kiểm bằng:" text where the PDF has it
  }),
});

const items = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/items' }),
  schema: z.object({
    type: z.enum(['video', 'short', 'series-episode', 'course-lesson']),
    title: z.string().optional(),          // overrides YouTube title if set
    youtubeId: z.string().optional(),
    series: z.string().optional(),         // 'tham-thuy' | 'dinh-luat-cai-gieng' | …
    domain: reference('domains').optional(),
    method: z.array(z.string()).default([]), // dieu ids, e.g. "kien-khiem/dieu-17"
    day: z.number().optional(),            // Thăm Thủy day 1..7
    course: z.string().optional(),         // 'leetcode' (Phase 3)
    module: z.string().optional(),
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

const domains = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/domains' }),
  schema: z.object({
    name: z.string(),                      // "Quantum computing"
    viName: z.string(),                    // "Điện toán lượng tử"
  }),
});

const wells = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/wells' }),
  schema: z.object({
    domain: reference('domains'),
    startDate: z.coerce.date(),
    giaThuyet: z.string(),
    chiSo: z.string(),
    nganSach: z.string(),                  // "7 ngày"
    dieuKienDung: z.string(),
    verdict: z.enum(['co-nuoc', 'kho', 'pending']).default('pending'),
    verdictDate: z.coerce.date().optional(),
    verdictNote: z.string().optional(),
  }),
});

const goals = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/goals' }),
  schema: z.object({
    cluster: z.string(),                   // "IT — giếng chính", "Khoa học — địa hình", …
    role: z.enum(['gieng-chinh', 'dia-hinh', 'duong-sinh', 'moi-truong']),
    tran: z.number().min(1).max(7),        // current trận stage
    giaThuyet: z.string(), chiSo: z.string(),
    nganSach: z.string(), dieuKienDung: z.string(),
    nextReview: z.coerce.date(),           // 90-day cadence
    draft: z.boolean().default(true),      // Đại Nguyện ships draft-only
  }),
});

export const collections = { dieu, items, domains, wells, goals };
```

**`videos.json` merge rule** (`src/lib/catalog.ts`): the sync script writes raw feed data
(`id, title, description, publishedAt, duration, thumbnails, tags`). A curated
`content/items/*.md` entry with matching `youtubeId` **overrides/extends** the raw record.
Raw videos with no curated entry still get a `/video/[id]` page with `type` inferred from
duration (`≤ 90s → short`). Items with `draft: true` are excluded when
`import.meta.env.PROD` — this single flag gates Đại Nguyện.

---

## 6. URL map

| Route | Page |
|---|---|
| `/` | Doctrine map + search + latest 6 items |
| `/binh-phap/[phap]/` | One doctrine: quyển index, khẩu quyết strip |
| `/binh-phap/[phap]/[node]/` | Node detail (điều/trận/nguyên tắc…): full text, sai khi, kiểm bằng, tagged items, prev/next |
| `/dia-hinh/` | All domains, grouped by well status |
| `/dia-hinh/[domain]/` | Domain page: its well (if any) + all items |
| `/tham-thuy/` | Terrain map of wells + ledger table |
| `/tham-thuy/[domain]/` | One exploration: bốn dòng card → 7 day-chapters → verdict seal |
| `/video/[id]/` | Video page, châu phê layout |
| `/series/[series]/` | Series index |
| `/tim/` | Full search page (the header search box also works everywhere) |
| `/hanh-trinh/` | Spiral life-journey (Phase 3) |
| `/khoa-hoc/[course]/…` | Courses (Phase 3) |
| `/dai-nguyen/` | Đại Nguyện (draft-gated, Phase 3) |
| `/map.json` | Endpoint: doctrine map nodes+edges with precomputed positions |

Slugs: lowercase, folded, hyphenated (`dieu-17`, `quantum-computing`, `tham-thuy`).
Display text keeps full diacritics always.

---

## 7. Page specifications

### Base layout (`src/layouts/Base.astro`)
Header: seal logo (vermilion square, −3° rotation, white "E") + wordmark "Ethano" + nav
(`Binh pháp · Địa hình · Thăm Thủy · Series · Tìm`) + inline search box (the search island
attaches to it). Footer: hairline rule, one rotating khẩu quyết line in italic, small seal,
links. Include skip-link, `lang="vi"`, canonical URL, OG tags. Paper background everywhere.

### `/` — Home
1. Hero: `--step-3` headline "Binh pháp cho những quyết định không có công thức",
   search box with brush-stroke underline (SVG path, draws on focus).
2. **Doctrine map island** (spec below), `client:visible`.
3. Below the map, always rendered: a **semantic index** — `<details>` per quyển listing all
   node links. This is the no-JS fallback, the screen-reader path, and the SEO surface.
4. "Mới đào" — latest 6 items as paper cards (thumbnail, title, type chip).

### `/map.json` — map data endpoint (`src/pages/map.json.ts`)
Build-time JSON: `{ nodes: [...], edges: [...] }`. Positions are **precomputed and
deterministic** (no client-side force simulation):
- Center node at (360, 320), viewBox `0 0 720 640`.
- Two hemispheres: `kien-khiem` occupies angles 100°→260°, `nhu-tinh` −80°→80°.
- Quyển anchors on ring R1 = 170px, evenly spaced within their hemisphere.
- Child nodes fan ±28° around their quyển anchor on ring R2 = 265px.
- Organic jitter: ±8px offset seeded by a stable hash of the node id (same every build).
- Each node: `{ id, url, label, phap, kind, quyen, itemCount }`.

### Doctrine map island (`src/islands/doctrine-map.ts`)
- Renders SVG from `/map.json`. Curved ink edges (`d3-shape` `curveBasis`), node = ink ring;
  `itemCount > 0` → small vermilion dot; visited (from `stamps.ts`) → ring gets light ink fill.
- Every node is an SVG `<a href>` — keyboard focusable, visible focus ring.
- Interaction: hover / first tap / focus → preview card (paper card, −1.5° rotation:
  title, essence, `n video · Quyển X`). Second tap or Enter → navigate. Esc closes.
- Entry animation: strokes draw in via `stroke-dashoffset` (GSAP, 0.9s, stagger 0.02),
  nodes fade after their edge. Skip entirely if `prefers-reduced-motion` or if
  `sessionStorage.ethano_map_seen` is set. **No idle/looping animation.**
- Budget: island + d3 modules + gsap core ≤ 35 KB gz. Load GSAP only in this island.

### `/binh-phap/[phap]/[node]/` — node detail
Breadcrumb → quyển label (small caps, letter-spaced) → `--step-2` title → essence in italic.
Body = full verbatim text from the PDF (prose styles, `--measure` width). If present:
`saiKhi` and `kiemBang` as bordered callouts (1px `--line`, vermilion label). Then:
"Video áp dụng điều này" item cards; domain chips; prev/next within the quyển. The page
must be excellent with **zero** items (the doctrine alone is the content).

### `/video/[id]/` — châu phê layout
- ≥ 900px: CSS grid `minmax(0,1fr) 240px`. Main column: `VideoFacade` + title + description
  (linkified, chapters stripped). Margin column: vermilion annotations in the châu phê
  spirit — chapter list (from `chapters.ts`, each seeks the player), method chips
  (linked điều), domain, series, publish date, đóng dấu button.
- < 900px: margin notes render inline below the player.
- `VideoFacade.astro`: thumbnail `https://i.ytimg.com/vi/{id}/hqdefault.jpg` + play button;
  click injects the iframe (`youtube-nocookie.com`, `autoplay=1`). No iframe on page load.
  Chapter links before first play → inject with `start=` param.

### `/tham-thuy/` — terrain + ledger
- Static SVG terrain generated at build from the `wells` collection: contour lines, one
  well icon per exploration. Position: deterministic hash of domain id into a 3-band grid.
  States: `co-nuoc` → ink well + vermilion seal "Có nước" (±4° rotation);
  `kho` → outline well + gray-ink outline seal "Khô"; `pending` → vermilion dashed ring +
  "ngày N/7" (N = days since `startDate`, capped at 7). Unexplored domains (in `domains`
  but no well) → dashed ellipse, 55% opacity, "chưa thăm dò".
- Below: the **ledger table** — every exploration, start date, verdict, link. Sortable not
  required; honesty is the feature: dry wells stay visible forever.

### `/tham-thuy/[domain]/` — one exploration
Bốn-dòng card first (paper card, −1° rotation, vermilion "◆ Bốn dòng viết trước" label,
the four lines verbatim from frontmatter). Then day chapters 1–7 (items where
`series=tham-thuy`, matching domain, ordered by `day`; missing days render as dashed
placeholders). Verdict seal last — pending renders as a dashed empty seal with the text
"chưa phán quyết".

### `/tim/` — search page
Big search input autofocused, facet chips (`Loại · Binh pháp · Địa hình`), result list
(title, type chip, essence/desc snippet, method chips). Doctrine nodes are searchable and
ranked alongside videos.

---

## 8. Search v1 (lexical, feels smart)

### `src/lib/foldVi.ts` — use verbatim, index AND query side
```ts
export const foldVi = (s: string): string =>
  s.toLowerCase()
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')  // strips tone + vowel marks
   .replace(/đ/g, 'd');              // đ (U+0111) has NO NFD decomposition
```
Diaspora users often type without diacritics; "dao gieng khong day" must match
"đào giếng không đáy". Folding is index-internal only — never fold displayed text.

### `scripts/build-search.mjs`
Runs as `prebuild`. Reads `src/data/videos.json`, curated items, and all `dieu` frontmatter
(tiny local frontmatter parser, no new deps). Merges `src/data/enrichment.json` aliases if
the file exists. Writes `public/search-docs.json`:
```json
[{ "id": "...", "url": "/video/abc/", "type": "video", "title": "…", "desc": "…≤200 chars",
   "folded": "<foldVi(title + desc + aliases + method titles + domain)>",
   "phap": "nhu-tinh", "domain": "poker" }]
```

### `src/islands/search.ts`
Attached to every search box. On first focus/keydown: dynamic-import `@orama/orama`,
fetch `search-docs.json`, `create` + `insertMultiple`, then search on the `folded` field
with `foldVi(query)`, `tolerance: 1`, facet filters via `where`. Debounce 120 ms. Results
render into a paper dropdown (home/header) or the `/tim/` list. Nothing search-related
loads before first interaction.

Phase 3 upgrades (do NOT build in Phase 1): `scripts/enrich.mjs` (Anthropic API generates
12–18 viewer-phrased Vietnamese queries per item, with and without diacritics, into
`enrichment.json`; skip gracefully when `ANTHROPIC_API_KEY` is absent) and precomputed
embeddings + Orama hybrid mode with an optional Cloudflare Worker query-embedding proxy.

---

## 9. Data pipeline

### `scripts/sync-youtube.mjs`
Env: `YT_API_KEY`, `YT_CHANNEL_ID`. Uploads playlist id = `'UU' + YT_CHANNEL_ID.slice(2)`.
1. Page `playlistItems` (`part=snippet,contentDetails`, 50/page).
2. Batch `videos.list` (`part=snippet,contentDetails`, 50 ids) for duration + tags.
3. Normalize `{ id, title, description, publishedAt, durationSec, tags }`, sort by
   `publishedAt` desc, stable-stringify, write `src/data/videos.json` **only if changed**.

One-time helper to fetch the channel id (the owner runs locally):
```bash
curl "https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=EthanoPraxis&key=$YT_API_KEY"
```

### `.github/workflows/sync.yml`
```yaml
name: sync
on:
  schedule: [{ cron: '0 21 * * *' }]   # ~4–5am VN time
  workflow_dispatch:
permissions: { contents: write }
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: node scripts/sync-youtube.mjs
        env:
          YT_API_KEY: ${{ secrets.YT_API_KEY }}
          YT_CHANNEL_ID: ${{ secrets.YT_CHANNEL_ID }}
      - name: commit if changed
        run: |
          git config user.name 'ethano-bot'
          git config user.email 'actions@users.noreply.github.com'
          git add -A
          git diff --cached --quiet || { git commit -m "chore(sync): videos $(date -u +%F)"; git push; }
```
These commits also keep the 60-day scheduled-workflow inactivity timer alive.

### `.github/workflows/deploy.yml`
```yaml
name: deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          SITE_URL: ${{ vars.SITE_URL }}
          BASE_PATH: ${{ vars.BASE_PATH }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/deploy-pages@v4
```

---

## 10. Domain and secrets

Phase 0 (no domain yet): repo Settings → Pages → Source = GitHub Actions. Repo variables:
`SITE_URL=https://<user>.github.io/ethano-site`, `BASE_PATH=/ethano-site/`.

Phase 2 (custom domain): add `public/CNAME` containing the bare domain; set repo variables
`SITE_URL=https://<YOUR-DOMAIN>`, `BASE_PATH=/`; in repo Pages settings enter the domain
and enforce HTTPS. GoDaddy DNS (delete the default "Parked" A record first):

```
Type    Host    Value
A       @       185.199.108.153
A       @       185.199.109.153
A       @       185.199.110.153
A       @       185.199.111.153
CNAME   www     <user>.github.io
```

Secrets/variables setup (the owner runs once):
```bash
gh secret set YT_API_KEY
gh secret set YT_CHANNEL_ID
gh variable set SITE_URL
gh variable set BASE_PATH
```
Never print or commit secret values. `ANTHROPIC_API_KEY` is Phase 3 only.

---

## 11. Performance & accessibility budget (hard gates)

- LCP ≤ 2.5 s and CLS < 0.1 on a mid-tier Android over throttled 4G (Lighthouse mobile).
- Per-page JS: home ≤ 70 KB gz total across islands; node/video pages ≤ 25 KB gz.
  No YouTube iframe before user click (facade only). Lighthouse performance ≥ 95 on
  pages without embeds.
- Fonts: only Lora Variable, `font-display: swap`, preload the woff2.
- All islands `client:visible` or lazier. `IntersectionObserver`-pause anything animating
  off-screen. `prefers-reduced-motion` skips to final states.
- Text contrast: body and any text < 18px uses `--ink` or `--ink-soft` only; `--ink-faint`
  is reserved for ≥ 18px or decorative captions (contrast on paper is marginal below that).
- Every visual has a text path: the map has the semantic index; the terrain has the ledger
  table; SVGs get `role="img"` + `<title>`. Full keyboard operability; visible focus rings.
- Vietnamese: diacritics always intact in display text; `lang="vi"` on `<html>`.

## 12. Guardrails for Claude Code

**Never:**
- Add React, Vue, Svelte, Tailwind, a CMS, Three.js, or any charting library.
- Import monolithic `d3` — named module packages only.
- Invent, translate, or paraphrase doctrine text — copy verbatim from the PDFs; where
  unsure, insert `TODO(owner): verify wording` and move on.
- Fold/strip diacritics anywhere except inside the search index.
- Hand-edit `src/data/videos.json` or `src/data/enrichment.json` (machine-owned).
- Commit secrets, tokens, or `node_modules`. Never echo secret values in logs.
- Use `localStorage`/`window` in code that runs at build/SSR time.
- Mark a phase done while `npm run build` fails or a budget in §11 is exceeded.

**Always:**
- `npm run build && npm run preview` and click through changed pages before declaring done.
- Keep this file's checkboxes current; conventional commits (`feat:`, `fix:`, `chore:`).
- Prefer deleting code over adding options. When in doubt, the quieter design is correct.

## 13. Phases

### Phase 0 — Scaffold & deploy (half a day)
- [x] `npm create astro@latest` (minimal, TS strict); add `@astrojs/sitemap`,
      `@fontsource-variable/lora`; commit lockfile.
- [x] `tokens.css`, `base.css`, `prose.css`; `Base.astro` layout (header/footer/skip-link).
- [x] Placeholder home: headline + khẩu quyết footer, pure HTML/CSS on paper.
- [x] `deploy.yml`; repo variables set; **site live** at `https://ethanopraxis.github.io/ethanopraxis/`.
- **Done when:** live URL renders the paper page; Lighthouse ≥ 95; build is clean.
- **STOP. Show the owner the URL.**

### Phase 1 — MVP: map, doctrine, videos, search (~1 week)
- [x] Write `src/data/doctrine-seed.json` from Appendix A verbatim.
- [x] `scripts/extract-doctrine.mjs` (or do it directly): for each seed node, create
      `src/content/dieu/<phap>/<node>.md` — frontmatter from seed, `essence` = the node's
      key line, body = full verbatim text read from the PDFs in `docs/source/`.
      Missing PDFs → stub body with `TODO(owner)`.
- [x] `content.config.ts` (§5); `catalog.ts`, `foldVi.ts`, `chapters.ts`, `stamps.ts`.
- [x] `map.json.ts` endpoint (§7 geometry) + `doctrine-map.ts` island + preview card.
- [x] Node pages `/binh-phap/[phap]/[node]/` + quyển index + semantic index on home.
- [x] `sync-youtube.mjs` + `sync.yml`; first sync committed; `/video/[id]/` basic pages
      with `VideoFacade` (châu phê layout is Phase 2 — simple stack is fine here).
- [x] `build-search.mjs` + `search.ts` island + `/tim/` page; doctrine nodes searchable.
- [x] Sitemap, canonical URLs, OG tags (text-only OG for now).
- **Done when:** budgets in §11 pass; map keyboard-navigable; search finds
      "dao gieng khong day" → Định Luật Cái Giếng content.
- **Điều 17 gate (the owner runs):** 3 non-specialists, task "tìm video về đào giếng" — ≤ 15 s
      each. Fail → fix discoverability before Phase 2.
- **STOP.**

### Phase 2 — Thăm Thủy, châu phê, đóng dấu, domain (~1 week)
- [ ] `wells` + `domains` seeded with real explorations; `/tham-thuy/` terrain SVG +
      ledger; `/tham-thuy/[domain]/` with bốn-dòng card, day chapters, `VerdictSeal`.
- [ ] Châu phê layout on `/video/[id]/` (§7) with chapter-seek and margin annotations.
- [ ] Đóng dấu: stamp button + press animation (GSAP scale/rotate + vermilion bleed);
      visited nodes ink in on the map; `ethano.stamps.v1` schema documented in code.
- [ ] Ink-wipe page transitions (Astro view transitions + brush `mask-image`); reduced-
      motion fallback = crossfade.
- [ ] OG images: adapt the owner's existing Pillow thumbnail pipeline into `scripts/og.py`
      (CI: `actions/setup-python`), output `public/og/<slug>.png`. The owner supplies the
      existing script; do not redesign the brand.
- [ ] Custom domain cutover per §10.
- **Done when:** a dry-well page reads as dignified, not apologetic; stamps survive
      reload; domain serves with HTTPS.
- **STOP.**

### Phase 3 — Intelligence & long arcs
- [ ] `enrich.mjs` (aliases) wired into `build-search.mjs`; measure search quality before
      building embeddings — only add semantic/hybrid (precomputed vectors + optional
      Cloudflare Worker proxy) if real queries show semantic misses.
- [ ] `/hanh-trinh/` spiral (D3 archimedean layout; life phases as revolutions; items
      attached; content behind it is the owner's call on disclosure).
- [ ] `/khoa-hoc/[course]/` templates: module → lesson pages, lesson stamps, module seal;
      seed with LeetCode course structure when the owner provides it.
- [ ] `/dai-nguyen/`: goals collection rendered as the lifetime map (trận stage, bốn dòng,
      next 90-day review). Ships `draft: true` — verify it is absent from the public build.
- **STOP.**

---

## Appendix A — `src/data/doctrine-seed.json` (verbatim)

```json
[
{"id":"kien-khiem/dieu-01","phap":"kien-khiem","kind":"dieu","quyen":1,"quyenTitle":"Quan Thế","order":1,"number":1,"title":"Đừng giải pháp trước khi định bài toán"},
{"id":"kien-khiem/dieu-02","phap":"kien-khiem","kind":"dieu","quyen":1,"quyenTitle":"Quan Thế","order":2,"number":2,"title":"Phân biệt mục tiêu với phương tiện"},
{"id":"kien-khiem/dieu-03","phap":"kien-khiem","kind":"dieu","quyen":1,"quyenTitle":"Quan Thế","order":3,"number":3,"title":"Vẽ thế trận trước khi hành động"},
{"id":"kien-khiem/dieu-04","phap":"kien-khiem","kind":"dieu","quyen":2,"quyenTitle":"Cầu Nguyên","order":1,"number":4,"title":"Khi chưa hiểu cơ chế, đừng tối ưu biểu hiện"},
{"id":"kien-khiem/dieu-05","phap":"kien-khiem","kind":"dieu","quyen":2,"quyenTitle":"Cầu Nguyên","order":2,"number":5,"title":"Tìm những biến thực sự chi phối kết quả"},
{"id":"kien-khiem/dieu-06","phap":"kien-khiem","kind":"dieu","quyen":2,"quyenTitle":"Cầu Nguyên","order":3,"number":6,"title":"Phân biệt correlation, mechanism và evidence"},
{"id":"kien-khiem/dieu-07","phap":"kien-khiem","kind":"dieu","quyen":3,"quyenTitle":"Phá Kế","order":1,"number":7,"title":"Mọi kế đều phải có một trận đánh thử"},
{"id":"kien-khiem/dieu-08","phap":"kien-khiem","kind":"dieu","quyen":3,"quyenTitle":"Phá Kế","order":2,"number":8,"title":"Luôn đánh cả phía ngược lại"},
{"id":"kien-khiem/dieu-09","phap":"kien-khiem","kind":"dieu","quyen":3,"quyenTitle":"Phá Kế","order":3,"number":9,"title":"Premortem phải có cả cost of inaction"},
{"id":"kien-khiem/dieu-10","phap":"kien-khiem","kind":"dieu","quyen":3,"quyenTitle":"Phá Kế","order":4,"number":10,"title":"Tìm assumption có sức phá lớn nhất"},
{"id":"kien-khiem/dieu-11","phap":"kien-khiem","kind":"dieu","quyen":4,"quyenTitle":"Định Hạn","order":1,"number":11,"title":"Mọi kết luận phải có điều kiện"},
{"id":"kien-khiem/dieu-12","phap":"kien-khiem","kind":"dieu","quyen":4,"quyenTitle":"Định Hạn","order":2,"number":12,"title":"Phân biệt constraint thật và constraint tưởng tượng"},
{"id":"kien-khiem/dieu-13","phap":"kien-khiem","kind":"dieu","quyen":4,"quyenTitle":"Định Hạn","order":3,"number":13,"title":"Mỗi constraint phải có giá"},
{"id":"kien-khiem/dieu-14","phap":"kien-khiem","kind":"dieu","quyen":5,"quyenTitle":"Dụng Lực","order":1,"number":14,"title":"Khi đường thẳng bị chặn, đổi biến"},
{"id":"kien-khiem/dieu-15","phap":"kien-khiem","kind":"dieu","quyen":5,"quyenTitle":"Dụng Lực","order":2,"number":15,"title":"Phân biệt ba loại lực"},
{"id":"kien-khiem/dieu-16","phap":"kien-khiem","kind":"dieu","quyen":5,"quyenTitle":"Dụng Lực","order":3,"number":16,"title":"Mượn lực nhưng không giao quyền phán đoán"},
{"id":"kien-khiem/dieu-17","phap":"kien-khiem","kind":"dieu","quyen":6,"quyenTitle":"Chứng Thực","order":1,"number":17,"title":"Khi có thể thử, đừng tranh luận quá lâu"},
{"id":"kien-khiem/dieu-18","phap":"kien-khiem","kind":"dieu","quyen":6,"quyenTitle":"Chứng Thực","order":2,"number":18,"title":"Thiết kế experiment để có khả năng làm mình sai"},
{"id":"kien-khiem/dieu-19","phap":"kien-khiem","kind":"dieu","quyen":6,"quyenTitle":"Chứng Thực","order":3,"number":19,"title":"Không phải mọi thứ đều đo được"},
{"id":"kien-khiem/dieu-20","phap":"kien-khiem","kind":"dieu","quyen":7,"quyenTitle":"Dụng Nhân","order":1,"number":20,"title":"Không bị phản biện không có nghĩa là đúng"},
{"id":"kien-khiem/dieu-21","phap":"kien-khiem","kind":"dieu","quyen":7,"quyenTitle":"Dụng Nhân","order":2,"number":21,"title":"Thị trường là feedback, không phải chân lý"},
{"id":"kien-khiem/dieu-22","phap":"kien-khiem","kind":"dieu","quyen":7,"quyenTitle":"Dụng Nhân","order":3,"number":22,"title":"Khi thiếu người dạy, hãy xây nhiều feedback loop"},
{"id":"kien-khiem/dieu-23","phap":"kien-khiem","kind":"dieu","quyen":8,"quyenTitle":"Quyền Thế","order":1,"number":23,"title":"Phân biệt Understand, Influence và Own"},
{"id":"kien-khiem/dieu-24","phap":"kien-khiem","kind":"dieu","quyen":8,"quyenTitle":"Quyền Thế","order":2,"number":24,"title":"Đừng vội rời nơi chưa cho ownership"},
{"id":"kien-khiem/dieu-25","phap":"kien-khiem","kind":"dieu","quyen":9,"quyenTitle":"Học Chiến","order":1,"number":25,"title":"Mỗi chu kỳ học phải tạo ra một thứ"},
{"id":"kien-khiem/dieu-26","phap":"kien-khiem","kind":"dieu","quyen":9,"quyenTitle":"Học Chiến","order":2,"number":26,"title":"Đừng học vô hạn"},
{"id":"kien-khiem/dieu-27","phap":"kien-khiem","kind":"dieu","quyen":9,"quyenTitle":"Học Chiến","order":3,"number":27,"title":"Giữ exploration budget"},
{"id":"kien-khiem/dieu-28","phap":"kien-khiem","kind":"dieu","quyen":10,"quyenTitle":"Hành Quân","order":1,"number":28,"title":"Không chờ certainty"},
{"id":"kien-khiem/dieu-29","phap":"kien-khiem","kind":"dieu","quyen":10,"quyenTitle":"Hành Quân","order":2,"number":29,"title":"Khi uncertainty cao, giảm kích thước bước đi"},
{"id":"kien-khiem/dieu-30","phap":"kien-khiem","kind":"dieu","quyen":10,"quyenTitle":"Hành Quân","order":3,"number":30,"title":"Nhưng đừng biến \"small experiment\" thành trì hoãn"},
{"id":"kien-khiem/dieu-31","phap":"kien-khiem","kind":"dieu","quyen":11,"quyenTitle":"Khiêm","order":1,"number":31,"title":"Khiêm không phải tự nghi ngờ"},
{"id":"kien-khiem/dieu-32","phap":"kien-khiem","kind":"dieu","quyen":11,"quyenTitle":"Khiêm","order":2,"number":32,"title":"Ghi trước điều gì sẽ khiến mình đổi ý"},
{"id":"kien-khiem/dieu-33","phap":"kien-khiem","kind":"dieu","quyen":11,"quyenTitle":"Khiêm","order":3,"number":33,"title":"Đừng đồng nhất bản thân với hypothesis"},
{"id":"kien-khiem/dieu-34","phap":"kien-khiem","kind":"dieu","quyen":12,"quyenTitle":"Chuyển Thế","order":1,"number":34,"title":"Tiến khi lực thuận"},
{"id":"kien-khiem/dieu-35","phap":"kien-khiem","kind":"dieu","quyen":12,"quyenTitle":"Chuyển Thế","order":2,"number":35,"title":"Đổi cách khi lực không chuyển thành kết quả"},
{"id":"kien-khiem/dieu-36","phap":"kien-khiem","kind":"dieu","quyen":12,"quyenTitle":"Chuyển Thế","order":3,"number":36,"title":"Đổi môi trường khi constraint nằm ngoài quyền thay đổi"},
{"id":"kien-khiem/dieu-37","phap":"kien-khiem","kind":"dieu","quyen":12,"quyenTitle":"Chuyển Thế","order":4,"number":37,"title":"Đổi mục tiêu khi evidence chứng minh mục tiêu không còn đáng theo"},
{"id":"kien-khiem/ky-1","phap":"kien-khiem","kind":"ky","quyen":13,"quyenTitle":"Đại Kỵ","order":1,"number":1,"title":"Phân tích để trì hoãn"},
{"id":"kien-khiem/ky-2","phap":"kien-khiem","kind":"ky","quyen":13,"quyenTitle":"Đại Kỵ","order":2,"number":2,"title":"First principles để phát minh lại bánh xe"},
{"id":"kien-khiem/ky-3","phap":"kien-khiem","kind":"ky","quyen":13,"quyenTitle":"Đại Kỵ","order":3,"number":3,"title":"Premortem để hợp thức hóa sợ hãi"},
{"id":"kien-khiem/ky-4","phap":"kien-khiem","kind":"ky","quyen":13,"quyenTitle":"Đại Kỵ","order":4,"number":4,"title":"Constraint để biện minh cho bất lực"},
{"id":"kien-khiem/ky-5","phap":"kien-khiem","kind":"ky","quyen":13,"quyenTitle":"Đại Kỵ","order":5,"number":5,"title":"Feedback để tìm validation"},
{"id":"kien-khiem/ky-6","phap":"kien-khiem","kind":"ky","quyen":13,"quyenTitle":"Đại Kỵ","order":6,"number":6,"title":"Evidence worship"},
{"id":"kien-khiem/ky-7","phap":"kien-khiem","kind":"ky","quyen":13,"quyenTitle":"Đại Kỵ","order":7,"number":7,"title":"Khiêm thành thiếu quyết đoán"},
{"id":"kien-khiem/ky-8","phap":"kien-khiem","kind":"ky","quyen":13,"quyenTitle":"Đại Kỵ","order":8,"number":8,"title":"Framework thành nhà tù"},
{"id":"kien-khiem/vong-hanh-quan","phap":"kien-khiem","kind":"quy-luat","quyen":14,"quyenTitle":"Một Vòng Hành Quân Hoàn Chỉnh","order":1,"title":"Mười bước, chạy theo thứ tự"},
{"id":"nhu-tinh/dai-nghia","phap":"nhu-tinh","kind":"quy-luat","quyen":1,"quyenTitle":"Đại Nghĩa","order":1,"title":"Nhu — chờ thời · Tỉnh — tạo nguồn"},
{"id":"nhu-tinh/nguyen-tac-1","phap":"nhu-tinh","kind":"nguyen-tac","quyen":2,"quyenTitle":"Đạo Của Nhu – Tỉnh","order":1,"number":1,"title":"Bất vọng động"},
{"id":"nhu-tinh/nguyen-tac-2","phap":"nhu-tinh","kind":"nguyen-tac","quyen":2,"quyenTitle":"Đạo Của Nhu – Tỉnh","order":2,"number":2,"title":"Bất cố chấp"},
{"id":"nhu-tinh/nguyen-tac-3","phap":"nhu-tinh","kind":"nguyen-tac","quyen":2,"quyenTitle":"Đạo Của Nhu – Tỉnh","order":3,"number":3,"title":"Tiểu chiến nghiệm đại đạo"},
{"id":"nhu-tinh/nguyen-tac-4","phap":"nhu-tinh","kind":"nguyen-tac","quyen":2,"quyenTitle":"Đạo Của Nhu – Tỉnh","order":4,"number":4,"title":"Tích tiểu thành đại"},
{"id":"nhu-tinh/nguyen-tac-5","phap":"nhu-tinh","kind":"nguyen-tac","quyen":2,"quyenTitle":"Đạo Của Nhu – Tỉnh","order":5,"number":5,"title":"Trọng thế bất trọng tốc"},
{"id":"nhu-tinh/nguyen-tac-6","phap":"nhu-tinh","kind":"nguyen-tac","quyen":2,"quyenTitle":"Đạo Của Nhu – Tỉnh","order":6,"number":6,"title":"Cầu nguồn bất cầu ảnh"},
{"id":"nhu-tinh/dinh-luat-cai-gieng","phap":"nhu-tinh","kind":"quy-luat","quyen":3,"quyenTitle":"Định Luật Cái Giếng","order":1,"title":"Ta đang đào cái gì"},
{"id":"nhu-tinh/tran-1","phap":"nhu-tinh","kind":"tran","quyen":4,"quyenTitle":"Bảy Binh Trận Của Đời Người","order":1,"number":1,"title":"Nhất Nguyệt — Định Địa"},
{"id":"nhu-tinh/tran-2","phap":"nhu-tinh","kind":"tran","quyen":4,"quyenTitle":"Bảy Binh Trận Của Đời Người","order":2,"number":2,"title":"Tam Nguyệt — Thăm Thủy"},
{"id":"nhu-tinh/tran-3","phap":"nhu-tinh","kind":"tran","quyen":4,"quyenTitle":"Bảy Binh Trận Của Đời Người","order":3,"number":3,"title":"Lục Nguyệt — Đào Tỉnh"},
{"id":"nhu-tinh/tran-4","phap":"nhu-tinh","kind":"tran","quyen":4,"quyenTitle":"Bảy Binh Trận Của Đời Người","order":4,"number":4,"title":"Nhất Niên — Thành Năng"},
{"id":"nhu-tinh/tran-5","phap":"nhu-tinh","kind":"tran","quyen":4,"quyenTitle":"Bảy Binh Trận Của Đời Người","order":5,"number":5,"title":"Ngũ Niên — Lập Tỉnh"},
{"id":"nhu-tinh/tran-6","phap":"nhu-tinh","kind":"tran","quyen":4,"quyenTitle":"Bảy Binh Trận Của Đời Người","order":6,"number":6,"title":"Thập Niên — Dưỡng Nguyên"},
{"id":"nhu-tinh/tran-7","phap":"nhu-tinh","kind":"tran","quyen":4,"quyenTitle":"Bảy Binh Trận Của Đời Người","order":7,"number":7,"title":"Nhất Sinh — Lưu Tỉnh"},
{"id":"nhu-tinh/that-bai-1","phap":"nhu-tinh","kind":"that-bai","quyen":5,"quyenTitle":"Binh Pháp Thất Bại","order":1,"number":1,"title":"Vọng động"},
{"id":"nhu-tinh/that-bai-2","phap":"nhu-tinh","kind":"that-bai","quyen":5,"quyenTitle":"Binh Pháp Thất Bại","order":2,"number":2,"title":"Hoán đạo"},
{"id":"nhu-tinh/that-bai-3","phap":"nhu-tinh","kind":"that-bai","quyen":5,"quyenTitle":"Binh Pháp Thất Bại","order":3,"number":3,"title":"Khô tỉnh"},
{"id":"nhu-tinh/that-bai-4","phap":"nhu-tinh","kind":"that-bai","quyen":5,"quyenTitle":"Binh Pháp Thất Bại","order":4,"number":4,"title":"Mê học"},
{"id":"nhu-tinh/that-bai-5","phap":"nhu-tinh","kind":"that-bai","quyen":5,"quyenTitle":"Binh Pháp Thất Bại","order":5,"number":5,"title":"Cầu tốc"},
{"id":"nhu-tinh/that-bai-6","phap":"nhu-tinh","kind":"that-bai","quyen":5,"quyenTitle":"Binh Pháp Thất Bại","order":6,"number":6,"title":"Tự chiến"},
{"id":"nhu-tinh/that-bai-7","phap":"nhu-tinh","kind":"that-bai","quyen":5,"quyenTitle":"Binh Pháp Thất Bại","order":7,"number":7,"title":"Vong bản"},
{"id":"nhu-tinh/quy-luat-90-ngay","phap":"nhu-tinh","kind":"quy-luat","quyen":6,"quyenTitle":"Quy Luật 90 Ngày","order":1,"title":"Chu kỳ thăm dò"},
{"id":"nhu-tinh/menh-lenh-1","phap":"nhu-tinh","kind":"menh-lenh","quyen":7,"quyenTitle":"Ba Mệnh Lệnh","order":1,"number":1,"title":"Không đánh trận vô ích"},
{"id":"nhu-tinh/menh-lenh-2","phap":"nhu-tinh","kind":"menh-lenh","quyen":7,"quyenTitle":"Ba Mệnh Lệnh","order":2,"number":2,"title":"Không kiên trì vì đã đào lâu"},
{"id":"nhu-tinh/menh-lenh-3","phap":"nhu-tinh","kind":"menh-lenh","quyen":7,"quyenTitle":"Ba Mệnh Lệnh","order":3,"number":3,"title":"Không bỏ vì nước chưa ra"},
{"id":"nhu-tinh/bon-dong-viet-truoc","phap":"nhu-tinh","kind":"quy-luat","quyen":7,"quyenTitle":"Ba Mệnh Lệnh","order":4,"title":"Bốn dòng viết trước"},
{"id":"nhu-tinh/cong-thuc-chien-luoc","phap":"nhu-tinh","kind":"quy-luat","quyen":8,"quyenTitle":"Công Thức Chiến Lược","order":1,"title":"Chín bước, theo thứ tự"},
{"id":"nhu-tinh/dai-dinh","phap":"nhu-tinh","kind":"quy-luat","quyen":9,"quyenTitle":"Đại Định","order":1,"title":"Đổi câu hỏi thì đổi cả con đường"},
{"id":"nhu-tinh/nam-the-tran","phap":"nhu-tinh","kind":"quy-luat","quyen":10,"quyenTitle":"Năm Thế Trận","order":1,"title":"Cùng một binh pháp, năm tình thế khác nhau"},
{"id":"nhu-tinh/dieu-khong-hua","phap":"nhu-tinh","kind":"quy-luat","quyen":11,"quyenTitle":"Điều Binh Pháp Không Hứa","order":1,"title":"Phần nằm ngoài kỷ luật cá nhân"},
{"id":"nhu-tinh/khau-quyet-1","phap":"nhu-tinh","kind":"khau-quyet","quyen":12,"quyenTitle":"Khẩu Quyết","order":1,"number":1,"title":"Nhu nhi bất đãi — Chờ mà không biếng"},
{"id":"nhu-tinh/khau-quyet-2","phap":"nhu-tinh","kind":"khau-quyet","quyen":12,"quyenTitle":"Khẩu Quyết","order":2,"number":2,"title":"Động nhi bất vọng — Làm mà không hấp tấp"},
{"id":"nhu-tinh/khau-quyet-3","phap":"nhu-tinh","kind":"khau-quyet","quyen":12,"quyenTitle":"Khẩu Quyết","order":3,"number":3,"title":"Tiến nhi bất tham — Tiến mà không tham thắng nhỏ"},
{"id":"nhu-tinh/khau-quyet-4","phap":"nhu-tinh","kind":"khau-quyet","quyen":12,"quyenTitle":"Khẩu Quyết","order":4,"number":4,"title":"Thối nhi bất bại — Lui mà không xem là thất bại"},
{"id":"nhu-tinh/khau-quyet-5","phap":"nhu-tinh","kind":"khau-quyet","quyen":12,"quyenTitle":"Khẩu Quyết","order":5,"number":5,"title":"Đào nhi bất tuyệt — Đào mà không bỏ giữa đường"},
{"id":"nhu-tinh/khau-quyet-6","phap":"nhu-tinh","kind":"khau-quyet","quyen":12,"quyenTitle":"Khẩu Quyết","order":6,"number":6,"title":"Tỉnh nhi lợi nhân — Có nguồn rồi phải làm lợi cho người"}
]
```

## Appendix B — Kickoff prompts for Claude Code

First session:
> Read CLAUDE.md and PLAN.md end to end. Then execute Phase 0 only. Stop when the site is
> live on GitHub Pages and show me the URL and a summary of what you built.

Subsequent phases:
> Phase N of PLAN.md. Before writing code, list the tasks in your own words and flag
> anything ambiguous. Then execute, checking boxes as you go. Stop at the phase gate.

Verification (any time):
> Run npm run build and Lighthouse (mobile) on /, one node page, and one video page.
> Report against the budgets in PLAN.md §11. Fix regressions before anything else.
