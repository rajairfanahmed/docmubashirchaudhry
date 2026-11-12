# Structural Layout & Route Blueprints

> Complete shell, page archetype, grid, and route-by-route redesign specification adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Sections 4, 5, and 6 across all `37` App Router routes + global fallbacks.

---

## 1. Persistent Shell & Shared Navigation

### Public Navigation (`src/components/layout/Navbar.tsx`)
Preserve all destinations (`/`, `/geography`, `/ppsc`, `/fpsc`, `/library`, `/quizzes`) and existing auth state cleanly while refining layout clarity:
- **Desktop (`>= lg`):** Pure `DmcLogo` + wordmark on the left; primary navigation links grouped cleanly in a central/right region using a subtle active indicator (`--color-accent` or subtle bottom/pill mark rather than large saturated green capsules on every item); right-aligned `NavbarSearch` + `AccountMenu` / `Sign In`. Consistent header height (`h-16`) with sticky scroll clearance (`scroll-mt-*`) so headings and `#anchor` links are never clipped.
- **Mobile & Tablet (`< lg`):** Clean menu button opening a slide-over drawer supporting `Escape` dismissal, backdrop click dismissal, focus trapping, scroll lock, and return of focus to the trigger control. Keep search discoverable and all tap targets >= `44 x 44 px` without shrinking desktop rows.

### Trust Notice, Pre-Footer & Footer
- **`StandingTrustNotice`:** Retain the factual commission-independence disclosure and scoped access explanation, styled as a slim, calm editorial notice (never a heavy dark banner competing with page `<h1>`) with direct links to `/privacy` and `/methodology`.
- **`Footer`:** Structured dark-ink high-contrast footer (`#171C1A` / `#19231D`) preserving Study Hubs, Account & Search links, Portal Notice, copyright + dataset version, and the hairline-separated Doc Mubashir Chaudhry verbatim academic credit and personal-opinion disclaimer kept at comfortable reading measure.
- **`PreFooterCta`:** Optional restrained action band rendered only when a clear next study step helps users - never forced onto every route mechanically.

### Student Account Menu & Isolated Admin Console
- **`AccountMenu`:** Compact, keyboard-navigable menu preserving **My Quiz Attempts** (`/my-attempts`), **My PDF Downloads** (`/my-downloads`), **Privacy & Data** (`/privacy`), and **Sign Out**; strictly omit admin links for non-admin sessions.
- **`AdminShell` (`/admin/*`):** Visually isolated via `RouteChromeGate`. Minimal top bar (`Admin Console` + admin identity + `Return to Public Site` + `Sign Out`), stable desktop sidebar (`Overview`, `Users`, `Quizzes`, `Question Bank`, `PDF Library`), collapsible mobile/tablet navigation, prioritizing dense tables/filters/forms over promotional chrome.

---

## 2. Page Architecture & Layout Rules

### Ten Page Archetypes
1. **Landing / Home:** Concise positioning, clear primary paths, discovery tools, honest live counts, recent study booklets.
2. **Directory / Catalog:** Title, search/filter toolbar, accurate result count, sort, scannable list/grid.
3. **Detail / Reference:** Breadcrumb, clear H1, structured factual `<dl>` / `<table>` blocks, provenance, related items, next step.
4. **Interactive Practice / Exam Workspace:** Distraction-free stage, single-question focus, explicit state feedback, concise explanation, intuitive navigation.
5. **Results / History:** Score/history breakdown, chronological review, retake/library actions.
6. **Document Detail / Reader:** Booklet identity, cover/preview, verified metadata + SHA-256, clear gated `Download PDF` trigger.
7. **Account History:** Privacy-first personal table/list behind inline auth gate (`noindex`).
8. **Admin Management:** Operational tables, logically grouped forms, CSV/R2 workflows, confirmation-guarded destructive controls.
9. **Editorial / Legal:** Comfortable reading width (`reading` / `60-72ch`), clear headings, accessible forms.
10. **System State:** Loading skeletons, empty datasets, `401` auth gate, `403`, `404`, `429`, offline, and `/error.tsx` recovery.

### Page Header & Density Discipline
- Inner pages lead with: Breadcrumb -> One descriptive `<h1>` -> Concise orientation sentence -> Primary CTA (only when meaningful) -> Optional secondary status/metadata line. **No massive banner above every inner page.**
- **Container Widths (`PageContainer`):** Use `wide` (`max-w-7xl`) for data tables, catalogs, and quiz workspaces; `reading` (`max-w-4xl`) / `narrow` (`max-w-3xl`) for long prose and editorial routes. Align filters directly with the results region they govern.
- **Cards vs. Lists vs. Tables:** Use cards only when items are distinct destinations/actions; use lists for fast scanning of uniform items; use tables for multi-column comparisons and admin records. Avoid uniform `"3-columns-of-white-rounded-cards"` fatigue.

---

## 3. Complete Route-by-Route Redesign Coverage (`37` Routes + Fallbacks)

### 3.1 Home & Search
- **`/` (`src/app/page.tsx`):** Clean **light-first editorial split hero** on `--color-page` / `--color-surface` placing the verbatim v3.0 tagline headline, concise copy, `HeroSearch`, and `2` clear primary actions in the text column, paired with the framed existing portrait (`mubashirchaudhry1 (3).jpg`, no giant emerald hero wall). Followed by a restrained real-data proof row (live counts only), clean exam shortcuts (`PPSC`, `FPSC`, `CSS / PMS`, `NTS`, `Geography`), Latest PDFs showing title/subject/metadata and explicit access condition upfront, and clearly structured Geography/MCQ entry widgets without competing decorative blocks.
- **`/search` (`src/app/search/page.tsx`):** Prominent search bar retaining query string, grouped results with real counts only, distinct `empty query` prompt vs `no matches` recovery, scannable item title/type/metadata.

### 3.2 Geography & Country Pages
- **`/geography` (`src/app/geography/page.tsx`):** Treat as an integrated **reference and recall workbench**. Lead with clear title + intro, compact aligned Search / Continent / Region / A-Z toolbar with active filter count visibility, decluttered `CountryCard` design (country name + clean factual rows instead of golden highlight pill walls or `border-l-4` gold bars) with distinct `Profile` vs `Start country quiz` actions, and clean separation between the directory and the unified quiz section (replacing dominating mint gradients and circular SVG arcs with neutral focus). Preserve `localStorage` persistence & `Clear progress`.
- **`/geography/[slug]` (`src/app/geography/[slug]/page.tsx`):** Flag + official/common names + semantic status badge first, structured `<dl>`/`<table>` tables for Capitals, Currencies, Languages, Disputed/provenance notes, secondary neighbour/regional links, clear `Practice this country` and correction links.
- **`/geography/continent/[slug]` (`src/app/geography/continent/[slug]/page.tsx`):** Concise continent scope header, regional breakdown lists/links, clean continent quiz launcher.
- **`/countries` (`src/app/countries/page.tsx`):** Preserve permanent `308` redirect to `/geography`.

### 3.3 Exam Directories, Hubs, Posts & Topics
- **`/exams` & `/exams/[slug]`:** Clear commission directory distinguishing external official commission portals from internal guides/PDFs/quizzes; honest real counts; dedicated empty state when a hub has no published items yet.
- **`/ppsc` (`src/app/ppsc/page.tsx`):** Clean light editorial header, accessible post filters, clear post cards (`Title`, `Department`, `BS Grade`, available material count, `View Post` CTA) with restrained verification status.
- **`/ppsc/[slug]` (`src/app/ppsc/[slug]/page.tsx`):** Post title/department/scale first, structured blueprint/syllabus table, paired solved PDFs & topic practice CTAs, secondary provenance/errata links. Keep **`/ppsc/[slug]/blueprint`** permanent redirect to `/ppsc/[slug]`.
- **`/fpsc`, `/css-pms`, `/nts`:** Tailored pathways (e.g., CSS Compulsory/Optional vs PMS; NTS NAT/GAT), helpful empty states if posts are pending rather than blank boxes, clear separation of official portals vs portal prep resources. Keep **`/css-pms/[track]`** redirect to `/css-pms`.
- **`/topics/[subject]/[topic]`:** Explicit breadcrumb + heading relationship, concise topic brief, interactive sample MCQs directly linked to `/mcq/practice` + matching study PDFs.

### 3.4 MCQ Practice, Quizzes & Timed Mock Exams
- **`/mcq` (`src/app/mcq/page.tsx`):** Setup form (`Exam`, `Subject`, `Topic`) as primary hero control showing live matching count, active selections, URL sync, and secondary question preview list.
- **`/mcq/practice` (`src/app/mcq/practice/page.tsx`):** Calm, distraction-free workspace. **Remove oversized mint gradients and circular SVG arcs.** Clean top bar (`Question X of Y`, score/progress, active filters, reset), high-contrast stem, scannable A–D options, instant adjacent explanation, accessible Prev/Next/Jump strip, URL/local persistence.
- **`/quizzes` (`src/app/quizzes/page.tsx`):** Clear visual distinction between Practice Quizzes and Timed Mock Exams; compact search/exam/subject/mode/sort toolbar; restrained metadata row (`Questions`, `Duration`, `Negative Marking`, `Language`, genuine `Pass Target`) avoiding equal-weight colorful pills; unified `Start quiz` CTA.
- **`/quizzes/[slug]` (`src/app/quizzes/[slug]/page.tsx`):** Auth preview card displaying full quiz rules upfront before login (`questionCount`, timer, negative marking, language, pass threshold); seamless in-place launch after login; unified single-question focus layout (`MockExamTimerBar` readable without taking over viewport, single clean progress cue rather than duplicate score pills/rings, full EN/UR RTL + bidi support, `ConfirmSubmitModal`, honest non-ranked `QuizResultsPanel`).

### 3.5 PDF Study Library & Student History
- **`/library` & `/library/[exam]`:** Search + logical filter strip (`Exam`, `Subject`, `Topic`, `Year`, `Type`, `Sort`) with visible removable filter chips, accurate result count, title-first scannable cards clearly stating upfront when free sign-in is needed to download. Exam route highlights active scope + returns cleanly to `/library`.
- **`/library/resource/[slug]`:** Title + primary `Download PDF` first; clean unified preview + verified metadata/SHA-256 + signed-link note + provenance + archived replacement banner; related booklets kept secondary; mobile `StickyMobileDownloadBar` clearing footer/focus/content cleanly.
- **`/my-attempts` & `/my-downloads`:** Auth-gated `noindex` personal dashboards presented as clean comparison tables/lists (`Title`, `Mode`, `Score`, `Duration`, `Date`, `Retake/Review` or `Title`, `Subject`, `Size`, `Date`, `Download Again` re-signing note), lightweight real stats only, clear empty states.

### 3.6 Editorial, Legal, Admin Console & System Fallbacks
- **`/about`, `/methodology`, `/corrections`, `/copyright`, `/accessibility`, `/privacy`, `/status`:** Credible long-form typography (`reading` container), structured SHA-256 & epistemic level examples on `/methodology`, accessible errata workflow on `/corrections`, explicit local-data clear confirmation dialog on `/privacy`, truthful tested conformance on `/accessibility`, clear non-technical status indicators on `/status`.
- **`/admin`, `/admin/users`, `/admin/quizzes`, `/admin/questions`, `/admin/pdfs`:** Clean operational console - compact KPIs + labeled `VisitTrendSvgChart` with units/axes/empty/error states; responsive search/filtered Users table (mobile card fallback); Quiz form grouped by concern + score breakdown & tough-questions table; Question Bank with clear EN/UR grouping, unambiguous correct-option picker, faithful live question preview, and row-specific CSV import errors; PDF management associating upload progress/preview/watermark check/publish state/retry cleanly with scannable table actions & confirmation-protected deletes.
- **`/error.tsx`, `/not-found.tsx`, `robots.ts`, `sitemap.ts`:** Calm recovery UI without raw trace/ID leaks; preserved search/crawler rules (`robots` disallows `/admin`, `/api`, private pages).
