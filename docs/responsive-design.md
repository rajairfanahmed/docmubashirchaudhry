# Responsive Design Specification (Step 6 of 10)

> **Consumer Skill:** `06-responsive-design` (Enhancement Phase - Run After Step 5)
> **Scope:** Mobile-first breakpoints, fluid sizing, viewport adaptation rules across every route, touch-target geometry (`>= 44px`), sticky mobile PDF Download behavior, and cross-viewport QA matrix (`320px` to `1440px`).
> **Depends On:** Page compositions in [`structural-layout.md`](./structural-layout.md) and component states in [`ui-components.md`](./ui-components.md).

---

## 1. Mobile-First Breakpoint System

Built directly on Tailwind CSS v4 mobile-first breakpoints (`min-width`), tuned for budget Pakistani Android phones (`360px` baseline, `320px` floor) up to large study monitors (`1280px+`):

| Token / Breakpoint | Viewport Width | Layout Target Behavior |
|---|---|---|
| Base (`default`) | `320px - 639px` | Single-column flow (`px-4`), stacked cards, collapsible mobile header drawer, sticky bottom PDF Download bar |
| `sm` | `>= 640px` | Two-column small grids (`ExamTiles` 2-col, `SubjectQuickGrid` 2-col, `Quiz Options` 2-col optional above `sm`), inline action buttons |
| `md` | `>= 768px` | Horizontal desktop Navbar replaces Hamburger (`Exams`, `Geography`, `MCQs`, `Library`, `Search`), 2-column Country & PDF grids, unpinned inline PDF download |
| `lg` | `>= 1024px` | 3-column Country/PDF grids, **5-tile Exam Row**, **5x2 Subject Grid**, asymmetric 12-column detail splits (`7:5` country profile, `4:8` PDF detail, `5:7` geography teaser) |
| `xl` | `>= 1280px` | Max container capped at `1152px` (`max-w-6xl`) with generous horizontal breathing margins; focus/reading columns capped at `768px` (`max-w-3xl`) |

---

## 2. Fluid Typography & Spacing Adaptation

- Use smooth fluid CSS `clamp()` where display sizes scale across `360px -> 1024px`:
  - Homepage `h1` (`display-hero`): `clamp(1.875rem, 4vw + 1rem, 2.75rem)` (`30px` on `360px` -> `44px` on desktop).
  - Interior Page `h1` (`page-title`): `clamp(1.5rem, 2.5vw + 1rem, 2.125rem)` (`24px` on `360px` -> `34px` on desktop).
  - Section Headings (`section-heading`): `clamp(1.25rem, 1.5vw + 0.9rem, 1.75rem)`.
  - Card & Container Padding: `p-4` (`16px`) at base -> `sm:p-5` (`20px`) -> `lg:p-6` (`24px`). Section vertical rhythm shifts `py-8` (`32px`) mobile -> `lg:py-14` (`56px`) desktop to minimize excessive vertical thumb scrolling on phones.

---

## 3. Navigation & Control Adaptations

### Header & Search Bar
- **Mobile (`< 768px`):**
  - Top bar renders compact `[Logo] ... [Search Icon Button] [Hamburger Menu Button]`. Both right icon buttons occupy minimum `44x44px` hit boxes.
  - Clicking Search toggles an inline full-width search bar strip directly beneath the header (autofocused, `h-12`) without covering page structure unexpectedly.
  - Clicking Hamburger slides/expands the **Mobile Drawer**: vertical list of `48px` row links (`Exams`, `Geography`, `MCQs`, `Library`, `Search`), standalone quick shortcuts (`PPSC Hub`, `Solved PDFs`), and the compact standing non-affiliation notice at drawer bottom.
- **Desktop (`>= 768px`):**
  - Full horizontal bar matching `38d65f1d.png`: Logo left, 4 centered links, compact Search input/button right (`w-56` to `lg:w-72`). Zero hamburger toggle.

### Breadcrumbs on Narrow Screens
- Wrap cleanly or apply subtle single-line middle-truncation on deep nested paths (`/topics/[subject]/[topic]`, `/geography/continent/[slug]`) while keeping the Home icon, immediate parent link, and current page label readable without forcing horizontal overflow.

---

## 4. Per-Section Mobile Adaptation Rules

1. **Homepage Exam Tiles (`PPSC`, `CSS/PMS`, `FPSC`, `NTS`, `Intelligence Officer`):**
   - Base (`320-639px`): `grid-cols-2` (`Intelligence Officer` spans `col-span-2` cleanly so all 5 tiles form two balanced rows + 1 full-width featured banner!).
   - `sm`: `grid-cols-3`, `lg`: uniform `grid-cols-5` horizontal shelf.
2. **Homepage Subject Grid (`f0919006.png` 5x2 grid):**
   - Base: `grid-cols-2` with compact `40x40px` pastel squircle left + `13px` bold title right (`gap-3`), avoiding multi-line clipping.
   - `lg`: Exact 5-column x 2-row (`lg:grid-cols-5`).
3. **World Geography (`/geography`):**
   - **A-Z Bar (`AlphabetRail`):** Render a clean multi-row wrapping flex pill cluster (`flex-wrap gap-1.5`) or touch-friendly grid with minimum `40x40px` visual pill inside `44px` touch zone (`min-h-[44px]`).
   - **Tier 1 `CountryCard` Anti-Overflow Adaptation (`320px-639px` & Multi-Value Nations):**
     - On `< sm` OR whenever a row holds `> 1` value (e.g., Zimbabwe's currencies/languages), stack `<dt>` label neatly above wrapping left-aligned `<dd className="flex flex-wrap gap-1.5 min-w-0 w-full">` pills (or cap visible pills to `<= 2` currencies / `<= 3` languages + `+N more` link to `/geography/[slug]`). Enforce `min-w-0 overflow-hidden` on the card article so multi-value golden chips never break outside card edges at `320px` or desktop 3-col widths.
   - **Tier 1 `PaginationBar` (`24/page` across `250` items):** On `< 640px`, show compact `[Prev]`, current range pill / up to `3-5` numeric pills + ellipsis, and `[Next]` (`>= 44x44px` tap area) without forcing horizontal page scroll.
   - **Filters:** Stack `Search`, `Continent`, `Region`, `Clear filters`, and `"Quiz this selection"` vertically at `w-full` below `md`, transitioning to single toolbar row on `lg+`.
   - **Tier 2 Emerald Transition Header (`#0D4A28`):** Stack `[Title]` -> `[Score + Clear Progress]` vertically centered on mobile (`flex-col sm:flex-row`).
   - **Geography Quiz Options A-D:** Stack 1-per-row (`grid-cols-1`) below `sm`, becoming `sm:grid-cols-2` matching `0b875c04.jpg`.
   - **`ScoreModal`:** `w-[calc(100%-2rem)] max-w-lg` on mobile with safe internal `overflow-y-auto max-h-[85dvh]` scrolling on short landscape phones (`320x568`).
4. **MCQ Practice (`/mcq/practice` - Exact `mcqs-design.png` Responsive Rules):**
   - **Mobile (`< 768px`):** Top-centered `CircularProgressRing` (`X/N`), `"Question X of Y"`, bold stem, **1-column stacked option buttons** (`grid-cols-1 gap-3`, `w-full`), inline `ExplanationBox` below locked options, and **bottom 2-button split grid (`grid grid-cols-2 gap-3`)** for `[Prev]` (outlined white) and `[Next]` (solid `#0D4A28` white text). Hide numbered desktop jumper pills `[1..10]` cleanly below `md`.
   - **Desktop (`>= 768px`):** Soft-mint rounded outer sheet enclosing white card split cleanly into Left Main Zone (`"Question X of Y"` + stem + `grid-cols-2 gap-3.5` A-D options + `ExplanationBox`) and Right Gauge Zone (`120-132px` circular `X/N` ring), anchored by bottom `[Prev] [1] [2] ... [N] [Next]` bar. **NO timer and NO Submit button on any breakpoint.**
5. **PPSC Post Detail (`/ppsc/[slug]` - Downloadable PDFs Only):**
   - Single-column `< 640px`, 2-col (`md+`) / 3-col (`lg+`) grid of `PdfResourceCard` booklets directly beneath concise post header + official portal link, avoiding unprovided blueprint tables or mock study tabs.
6. **PDF Library Detail (`/library/resource/[slug]`):**
   - Below `md`, display summary + rights + metadata above fold, while keeping the **Sticky Mobile Download CTA Bar** (`position: fixed; bottom: 0; inset-x: 0; padding: 12px 16px env(safe-area-inset-bottom)`) docked with concise title + file size + full-width `#0D4A28` `"Download PDF"` button. Add `pb-24 md:pb-12` bottom spacing on page wrapper so the sticky bar never obscures the footer or `"Report a problem"` link!

---

## 5. Touch Target & Viewport Verification Matrix

- **Minimum Touch Target:** All clickable links/buttons/pills/selects maintain `>= 44x44px` interactive height/tap box (`min-h-[44px]`), with at least `8px` (`gap-2`) clearance between neighboring interactive controls (A-Z letters, pagination buttons, option choices, filter chips).
- **Mandatory Width Test Gate:** Verify layout manually or via browser check at:
  - `320px` (compact Android/SE floor - check 5 exam tiles, golden pills wrapping inside `CountryCard`, nav header crowding)
  - `375px` (standard mobile - check Tier 1 -> Tier 2 Geography flow & Sticky Mobile Download bar)
  - `768px` (tablet portrait - transition to desktop navbar & 2-col grids)
  - `1024px` (small laptop - 5x2 subject tiles, 5 exam tiles, 3-col cards)
  - `1440px` (widescreen desktop - `max-w-6xl` containment + balanced margins)

---

## 6. Backend Integration Points

- **Paginated Data Sets (`countries.json` 250 records, `GET /api/countries`, `GET /api/questions`):** Tier 1 renders `24` countries/page (`11` pages) and MCQ previews render `20` items/page (`pageSize` queryable `1..100`) so DOM density stays lightweight even on 2 GB RAM budget smartphones.
- **Country Arrays & Overflow Guard (`CountryEntity`):** Multi-value fields (`capitals[]`, `currencyIds[]`, `officialLanguageIds[]` in `countries.json`) can reach 9 currencies or 16 languages (e.g., Zimbabwe). `CountryCard` renders independent `inline-flex rounded-lg` golden chips capped at `<= 2` currencies / `<= 3` languages + `+N more` link to `/geography/[slug]`, where full arrays wrap inside stacked key-value blocks so zero horizontal overflow occurs at `320px`.
- **Commission & Subject Branding (`branding.json`, `subjects.json`):** `CommissionBrandBadge` (`Logo.dev`) and `SubjectIconChip` carry fixed container boxes (`40x40px` / `48x48px`) to prevent shifting.
- **PDF Metadata (`pdfs.json`):** Long `title` strings on BS-14 / BS-16 booklets truncate cleanly at 2 lines (`line-clamp-2`) on library cards while displaying full untruncated `h1` titles on `/library/resource/[slug]`, and `StickyMobileDownloadBar` uses a 1-line truncated title alongside exact `formatBytes(fileSizeBytes)`.
- **Zero Dynamic Image Breakage:** Flag `<img>` elements carry fixed aspect containers (`aspect-[3/2]`, `w-10 shrink-0`) so responsive card resizing causes `0` layout shift.

