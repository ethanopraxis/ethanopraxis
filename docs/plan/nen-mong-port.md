# Track NM — Port "Nền Móng" into the Ethano site (v2 — multi-language)

> Parallel track. Does NOT modify or extend the origin plan's phases for the
> video discovery site. Phase 1 of the origin plan is done and must not be
> disturbed.
>
> **v2 supersedes v1.** Save this file at `docs/plans/nen-mong-port.md`.
> Change from v1: five language decks (Python, Java, Go, C++, TypeScript) are
> **provided as ready files** and the storage model is namespaced per
> language. Reason for amending before launch: retrofitting language
> namespacing after real practice data exists would force a storage
> migration; adding it before launch costs nothing. Mechanics are unchanged
> and remain frozen.

## Kickoff prompt (paste into Claude Code)

```
Read docs/plans/nen-mong-port.md and docs/reference/nen-mong-v0.jsx in full
before touching anything. The five drill decks are PROVIDED at
src/data/nenmong/ and src/lib/nenmong/types.ts — do not re-author or edit
their content. Execute the plan phase by phase (A → B → C), one commit per
phase, commit messages prefixed "nm:". Hard constraints: TypeScript strict
stays green; NO new user-facing features beyond the reference file plus the
language selector specified in §5 (feature freeze — Phase D items are
explicitly out of scope); all CSS class names prefixed nm- and scoped under
.nm-root; the page is noindex and gets no nav link. After each phase run the
repo's build, astro check, and test:nenmong, and fix before moving on. If any
acceptance criterion cannot be met as written, stop and report instead of
improvising.
```

---

## 1. Mission

Port the working v0 React artifact `docs/reference/nen-mong-v0.jsx` (a
personal DSA retrieval-drill tool: blank-editor drills, self-graded diff,
1-2-4-7-14-30 spaced gates, seal/crack states, miss journal, placement
survey) into the existing Astro v5 static site as an unlisted page at
`/nen-mong`, extended with a **language selector** over five provided decks.

The port is **faithful**: identical mechanics, identical Vietnamese copy,
identical visual identity. The reference `.jsx` is the source of truth for
behavior; the provided `.ts` deck files are the source of truth for content;
this document is the source of truth for structure. The reference's inline
Python DECK is superseded by `src/data/nenmong/deck-python.ts` (content
identical).

## 2. Repo assumptions — verify before Phase A

Detect and adapt; do not assume. Report any mismatch in the Phase A commit
message.

- Astro v5, TypeScript strict, fully static output, deployed to GitHub Pages
  via existing GitHub Actions workflow, custom domain at site root (no base
  path). The deploy workflow must not be modified.
- Package manager: detect from lockfile and use the repo's own for every
  command below (written as `npm run …`; substitute).
- Fonts are self-hosted via @fontsource (Lora variable + Be Vietnam Pro) and
  loaded by the base layout. The tool uses weights 400/500/600 — add missing
  weight imports on the tool page only, or relax the CSS weights, whichever
  is smaller.
- React is probably NOT installed yet (Phase 1 used vanilla + GSAP). Phase A
  adds it.
- Global CSS custom properties may exist for the brand palette (giấy #F2EADA,
  đỏ son #B13125, ink #2A241C). If site-level tokens exist, alias the tool's
  `--nm-*` variables to them; otherwise define `--nm-*` locally on `.nm-root`.

## 3. Đại Kỵ — hard constraints

- **KỴ 1 — Feature creep.** No feature, screen, setting, or copy change not
  present in the reference file, except the language selector specified in
  §5. Phase D lists the known temptations; all are out of scope.
- **KỴ 2 — Touching Phase-1 surface.** The only permitted edits outside new
  files: `astro.config.*` (add React integration), `package.json` (deps +
  `test:nenmong` script), and at most one page-level font-weight import. No
  edits to existing pages, layouts' rendered output, search, data sync, or
  workflows. If the base layout would need changing, create a minimal
  dedicated layout for this page instead.
- **KỴ 3 — Style leakage.** No global selectors, no `:root` variables, no
  un-prefixed class names. Everything lives under `.nm-root` with `nm-`
  prefixed classes and `--nm-` prefixed variables. Delete the Google Fonts
  `@import` from the reference CSS (fonts come from the site).
- **KỴ 4 — Storage cleverness.** Plain `localStorage`, keys as specified in
  §5. No IndexedDB, no sync, no export/import (Phase D).
- **KỴ 5 — Silent behavior drift.** The grade/schedule state machine must
  match the reference exactly; the engine tests in Phase C encode it. Any
  intentional deviation must be reported, not committed.
- **KỴ 6 — Deck content.** The five deck files and `types.ts` are provided
  and final. Do not edit drill text, ids, or levels. A suspected content
  error is reported in the commit message, never fixed silently.

## 4. Target file layout

```
docs/reference/nen-mong-v0.jsx          # dropped in by the owner — read-only reference
docs/plans/nen-mong-port.md             # this document
src/lib/nenmong/types.ts                # PROVIDED — shared Drill/Grade/Lv types
src/data/nenmong/deck-python.ts         # PROVIDED — 42 blocks
src/data/nenmong/deck-java.ts           # PROVIDED — 42 blocks
src/data/nenmong/deck-go.ts             # PROVIDED — 40 blocks
src/data/nenmong/deck-cpp.ts            # PROVIDED — 39 blocks
src/data/nenmong/deck-typescript.ts     # PROVIDED — 39 blocks
src/data/nenmong/index.ts               # PROVIDED — LANGS registry, LangId, DEFAULT_LANG
src/pages/nen-mong.astro                # route, noindex, mounts island client:only
src/components/nenmong/NenMong.tsx      # the React island (UI only)
src/components/nenmong/nen-mong.css     # extracted styles, nm- prefixed, .nm-root scoped
src/lib/nenmong/engine.ts               # pure logic: date utils, INTERVALS, transitions
src/lib/nenmong/storage.ts              # localStorage adapter (per-language keys)
scripts/test-nenmong-engine.mjs         # zero-dependency assert tests (node)
```

## 5. Language model (the one sanctioned addition)

- `LangId = "py" | "java" | "go" | "cpp" | "ts"`, registry and labels come
  from the provided `src/data/nenmong/index.ts`. Default `"py"`.
- **Everything is per-language**: nodes, journal, streak, buildsToday,
  surveyDone. One `AppState` per language, stored under key
  `nenmong-v1:<langId>` (e.g. `nenmong-v1:go`). This is deliberate — the
  drill tool measures per-language automaticity, and a shared streak would
  blur the signal.
- The last chosen language persists under its own key `nenmong-lang`
  (a bare LangId string; fall back to `"py"` on anything invalid).
- **Selector UI**: a small control in the header row (native `<select>` or a
  row of `nm-` styled buttons — match the existing tag/pill look, no new
  visual language). Switching languages saves nothing special: it simply
  loads that language's state (or a fresh default) and re-renders. All copy
  stays Vietnamese; only the label (Python, Java, Go, C++, TypeScript)
  identifies the deck.
- The wipe action clears ONLY the current language. Relabel it
  "Xoá dữ liệu ngôn ngữ này" (still two-tap confirm). The `nenmong-lang` key
  is never wiped.
- The engine stays 100% language-agnostic — it receives a deck and a state,
  and never inspects `LangId`.

## 6. Phase A — React integration

1. Add `@astrojs/react`, `react`, `react-dom` (+ types) and register the
   integration in `astro.config.*`.
2. Prove isolation: build and typecheck must pass with zero changes to any
   existing page's HTML output (spot-check `dist/` for one Phase-1 page
   before vs. after if practical).

**Done when:** `npm run build` and `npx astro check` pass; commit `nm: phase
A — react integration`.

## 7. Phase B — Faithful port

### 7.1 Provided files

Copy the seven provided files into place exactly as delivered (§4). They
already typecheck under `strict`. Import paths inside them assume the layout
in §4 — if the repo's aliases differ, adjust the import lines only.

### 7.2 Engine (`src/lib/nenmong/engine.ts`)

Pure, no DOM. Export: `INTERVALS`, `todayStr()`, `addDays(s, n)`,
`freshNode()`, `defaultState()`, the state interfaces (`NodeState`,
`JournalEntry`, `AppState` — same field names as the reference:
`st/iv/due/at/miss/lastMissCode/cr`,
`nodes/journal/streak/lastBuildDate/buildsToday/surveyDone`), and the
transitions extracted from the reference's `gradeGate` / `gradeBuild` /
`gradeSurvey`:

```ts
applyGate(node, g, today)   → { node, journal?: JournalEntry }
applyBuild(node, g, today)  → { node, journal?: JournalEntry }
applySurvey(node, g, today) → { node }
```

Plus `bumpStreak(streak, today)`. Copy the logic, don't reinterpret it: code
truncation to 600 chars, `cr` set when a sealed node fails, `lastMissCode`
cleared on pass, interval index capped at the last entry.

### 7.3 Storage (`src/lib/nenmong/storage.ts`)

Keep the reference's async signatures, parameterized by language:

```ts
const keyFor = (lang: LangId) => `nenmong-v1:${lang}`;
export async function loadState(lang: LangId): Promise<AppState | null> { ... }
export async function saveState(lang: LangId, s: AppState): Promise<boolean> { ... }
export async function clearState(lang: LangId): Promise<void> { ... }
export function loadLang(): LangId { ... }   // reads "nenmong-lang", validates
export function saveLang(l: LangId): void { ... }
```

Guard `typeof localStorage === "undefined"` for astro check. Keep the
reference's merge-on-load behavior (new deck ids get `freshNode()`) — run it
against the CURRENT language's deck — and the daily `buildsToday` reset.

### 7.4 Component (`NenMong.tsx`)

Direct translation of the reference App/Card/Seal/NodeSquare/CodeBlock to
strict TSX, plus: `lang` state initialized from `loadLang()`, deck/levels
read from `LANG_BY_ID[lang]`, the selector per §5, and per-language
load/save. Everything else identical: UI structure, copy, timer,
Tab-inserts-4-spaces, variant rotation by `at`, surrender path, stamp overlay
timing, soft cap of 6 with "Vẫn xây thêm", survey offer + map re-entry,
two-tap wipe (relabeled per §5). Rename CSS class strings to their `nm-`
equivalents. Import `./nen-mong.css`.

### 7.5 Styles (`nen-mong.css`)

Extract the reference's CSS template string. Mechanical transforms only:
delete the `@import` line; rename every class with the `nm-` prefix; move the
`:root` variables onto `.nm-root` renamed `--nm-*`; nest selectors under
`.nm-root` where cheap. Style the language selector with existing tokens
only. Keep the stamp keyframes and the `prefers-reduced-motion` guard.

### 7.6 Page (`src/pages/nen-mong.astro`)

Reuse the existing base layout unmodified if it provides fonts + global head;
otherwise a minimal dedicated layout. Head: title `Nền Móng — luyện khối
nhỏ`, Vietnamese description, `<meta name="robots" content="noindex,
nofollow">`, `theme-color #F2EADA`. Mount `<NenMong client:only="react" />`.
Do NOT add the page to any nav, sitemap, or footer.

**Done when:** build + astro check pass and the page renders locally; commit
`nm: phase B — port`.

## 8. Phase C — Verification

### 8.1 Engine + deck tests (`scripts/test-nenmong-engine.mjs`)

Zero dependencies: `node:assert` + the lightest path that runs TS with the
repo's toolchain (compile to a temp dir with `tsc`, or `tsx` if present).
Wire as `"test:nenmong"` in package.json. Encode at minimum:

1. `addDays("2026-01-31", 1) === "2026-02-01"`; year boundary
   `addDays("2026-12-31", 1) === "2027-01-01"`.
2. Build, any grade → `st="b"`, `iv=0`, `due=+1`; grade `sai` also increments
   `miss`, sets `lastMissCode`, returns a journal entry.
3. Survey `dung` → `st="b"`, `iv=1`, `due=+2`, `lastMissCode=null`; survey
   `lech`/`sai` → node stays `"u"`, only `at` increments, no journal entry.
4. Gate `dung` from `st="b", iv=0` → `st="s"`, `iv=1`, `due=+2`, `cr=false`,
   `lastMissCode=null`; from `iv=4` → `iv=5`, `due=+30`; from `iv=5` (last)
   → stays `iv=5`, `due=+30` (cap).
5. Gate `lech` → `due=+1`, `st`/`iv` unchanged, journal entry with grade
   `lech`.
6. Gate `sai` on a sealed node → `st="u"`, `iv=0`, `due=null`, `cr=true`,
   `miss+1`, journal entry; on a `st="b"` node → `cr` stays false.
7. Code strings truncate to 600 chars in journal and `lastMissCode`.
8. `bumpStreak`: same-day no-op; consecutive day increments; gap resets to 1.
9. **Deck lint across all five decks** (import `LANGS`): ids unique within
   each deck; every `lv` in 0–5; `t`/`p`/`a` non-empty; expected sizes
   py 42, java 42, go 40, cpp 39, ts 39 (total 202).

### 8.2 Manual QA (the owner, phone + desktop — record pass/fail)

1. First visit shows the khảo sát offer; "Bỏ qua" dismisses it permanently;
   the map offers "Khảo sát các khối còn lại" afterwards.
2. Khảo sát: `Đúng` schedules the block (map square turns ink), `Sai` leaves
   it dashed and advances; "Dừng khảo sát" exits.
3. Build flow: attempt → Đối chiếu → grade; "Xây n/6" advances; 7th build
   asks before continuing.
4. Gate lock: with a due gate, no build card appears and the map's "Xây khối
   này" is replaced by the lock note.
5. Time travel (per language): in devtools run
   `let s=JSON.parse(localStorage.getItem("nenmong-v1:py")); Object.values(s.nodes).forEach(n=>{if(n.due)n.due="2020-01-01"}); localStorage.setItem("nenmong-v1:py",JSON.stringify(s)); location.reload()`
   → gates come due; passing one fires the 井 stamp exactly once; failing a
   sealed one shows the dashed-đỏ-son cracked square on the map.
6. A `Sai` with typed code appears in Nhật ký and resurfaces as "Lần trước
   bạn viết" on the next attempt of that block.
7. **Language isolation**: build two blocks in Python, switch to Go — fresh
   map, fresh khảo sát offer, streak independent; switch back — Python state
   intact. Wipe in Go; Python untouched. Reload restores the last chosen
   language.
8. Reload mid-anything: state persists.
9. 380 px width: no horizontal scroll, editor, selector, and map usable;
   textarea Tab inserts spaces on desktop.
10. Robots meta present; page absent from nav and sitemap; one Phase-1 page
    (home, search) still renders and searches identically.

**Done when:** `npm run build && npx astro check && npm run test:nenmong`
all pass and QA is recorded; commit `nm: phase C — verification`. Deploy
rides the existing workflow on push; verify the live URL once, then stop.

## 9. Phase D — explicitly OUT OF SCOPE (do not implement, do not scaffold)

State export/import (artifact → site migration), Pyodide or any in-browser
execution, full FSRS, more prompt variants, day-7 randomized full nghiệm
thu, nav entry + public launch page, Thăm Thủy ledger entry for the public
test, analytics events, PWA manifest, per-language lazy bundle splitting
(all five decks ship in one island bundle for now — ~small text, acceptable).
These wait for the freeze review.

## 10. Acceptance criteria (final gate)

- [ ] Build, astro check (strict), and `test:nenmong` green (incl. deck lint,
      202 blocks).
- [ ] `/nen-mong` behaves identically to the reference artifact per §8.2,
      with per-language state isolation.
- [ ] Provided deck files byte-identical to delivery (no content edits).
- [ ] No existing file modified except the three allowed in KỴ 2.
- [ ] All styles/classes/variables `nm-` prefixed and scoped; no visual
      change on any Phase-1 page.
- [ ] Page is noindex, unlinked, unlisted.
- [ ] Zero features beyond the reference file + §5 language selector.
