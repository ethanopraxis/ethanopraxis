# CLAUDE.md — Ethano site

Static discovery site for the Vietnamese YouTube channel Ethano (@EthanoPraxis).
The two doctrines (Binh Pháp Kiển–Khiêm, Binh Pháp Nhu–Tỉnh) ARE the navigation.
Full spec: **PLAN.md** — read it before any non-trivial change. Current progress =
the checkboxes in PLAN.md §13. Stop at every phase gate and wait for the owner.

## Commands
- `npm run dev` — local dev
- `npm run build && npm run preview` — REQUIRED before declaring any task done
- `node scripts/sync-youtube.mjs` — refresh videos.json (needs YT_API_KEY, YT_CHANNEL_ID)

## Stack (locked — do not add to it)
Astro (static output, TS strict) · vanilla TS islands · GSAP + ScrollTrigger ·
D3 named modules only (`d3-hierarchy`, `d3-selection`, `d3-zoom`, `d3-shape`) ·
@orama/orama · @fontsource-variable/lora · npm.
**Forbidden:** React/Vue/Svelte, Tailwind, any CMS, Three.js, monolithic `d3`, new deps
without asking.

## Brand (immutable — tokens in src/styles/tokens.css)
paper `#F2EADA` · card `#FBF6EA` · ink `#2A241C` · ink-soft `#5C5347` ·
ink-faint `#8A7F6C` (≥18px text only) · line `#C9BEA6` · vermilion `#B13125` (meaning
only: seals, verdicts, has-video, active — never decoration) · Lora everywhere.
No white cards, no shadows, no gradients. Elevation = warm paper + 1px line + 1–2° tilt.
Motion only for meaning; always honor `prefers-reduced-motion` (skip to final state).
One signature visual per page, maximum.

## Content rules
- Doctrine text is sacred: copy **verbatim** from `docs/source/*.pdf`. Never paraphrase,
  translate, or invent it. Unsure → `TODO(owner): verify wording`.
- Vietnamese diacritics are never stripped in displayed text. Folding (`src/lib/foldVi.ts`)
  exists ONLY inside the search index. Remember: `đ` does not decompose under NFD.
- Slugs: lowercase, folded, hyphenated. Display text: full diacritics.
- Machine-owned files (never hand-edit): `src/data/videos.json`, `src/data/enrichment.json`.
- `draft: true` content must never appear in production builds (this gates /dai-nguyen).

## Architecture in one breath
Two axes on every item: `method` (doctrine node ids) × `domain` (địa hình). Collections in
`src/content.config.ts`: dieu, items, domains, wells, goals. Raw YouTube feed
(videos.json) merges with curated `content/items/*` in `src/lib/catalog.ts` — curated wins.
Search = build-time `public/search-docs.json` + lazy Orama island. Map = precomputed
positions from `/map.json`, no client-side force sim.

## Quality gates (PLAN.md §11)
Home JS ≤ 70 KB gz · other pages ≤ 25 KB gz · LCP ≤ 2.5 s mobile · CLS < 0.1 ·
no YouTube iframe before click (facade) · every visual has a text path · keyboard works.

## Hygiene
Conventional commits. Never commit secrets or echo them in logs. Never use
localStorage/window at build time. Prefer deleting code over adding options — the
quieter design is correct.
