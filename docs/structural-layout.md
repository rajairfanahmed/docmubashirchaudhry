# Structural Layout Specification (Step 3 of 10)

> **Consumer Skill:** `03-structural-layout` (Foundation Phase - Run After Step 2)
> **Scope:** Persistent global application shell, header/mobile drawer/breadcrumbs/standing notices/footer skeletons, page container geometry, grid tracks, and exact section compositions for every route in the platform.
> **Token & Pattern Ownership:** Uses spacing, radius, surface, and elevation tokens defined in [`visual-design.md`](./visual-design.md) inside folder boundaries from [`frontend-architecture.md`](./frontend-architecture.md). Breakpoint adaptations follow [`responsive-design.md`](./responsive-design.md).

---

## 1. Global Application Shell (Every Route)

Every page wraps content in a single vertical document structure inside `src/app/layout.tsx`:

```
+------------------------------------------------------------------+
| Skip to Main Content Link (sr-only until focused)                |
+------------------------------------------------------------------+
| Header (Sticky 64px, White surface #FFFFFF, bottom border #E2E8F0)|
|  [Logo: docmubashirchaudhry] [Exams][Geography][MCQs][Library]   |
|  [Search Box / Search Icon -> /search]      (Mobile: Hamburger)  |
+------------------------------------------------------------------+
| Standing Notice Strip (Compact slim bar below header OR integrated|
| in top/pre-footer; MUST remain immediately scannable on all pages)|
|  "Independent educational platform - Free, no ads, no login -    |
|   Not affiliated with PPSC, FPSC, NTS, or any govt commission."  |
+------------------------------------------------------------------+
| Breadcrumb Bar (Nested routes ONLY; omitted on Homepage /)        |
+------------------------------------------------------------------+
| <main id="main-content"> (Contained sections or full-bleed bands) |
+------------------------------------------------------------------+
| Pre-Footer CTA + Standing Trust Reminder                         |
+------------------------------------------------------------------+
| Footer (#051C0E, Multi-column Info & Navigation Grid)            |
|  Links: About, Methodology, Corrections, Copyright, Privacy,     |
|         Accessibility, Status                                    |
+------------------------------------------------------------------+
```

### Container & Grid Geometry
- **Primary Reading / App Container:** `max-w-6xl` (`1152px`) centered with horizontal gutters (`px-4` `16px` mobile, `px-6` `24px` tablet, `px-8` `32px` desktop).
- **Focused Narrow Containers:**
  - `/mcq/practice` and `/ppsc/[slug]/blueprint` use `max-w-3xl` (`768px`) centered to prevent ultra-wide eye sweep across MCQ stems and options.
  - Long-form editorial pages (`/about`, `/methodology`, `/corrections`, `/copyright`, `/privacy`, `/accessibility`, `/status`) use `max-w-4xl` (`896px`).
- **Standard Header Specification (`64px` height):**
  - Left: Brand wordmark (`doc` forest `#0D4A28` + `mubashirchaudhry` amber `#F0B938` / dark slate `#0F172A` with green academic mark matching `38d65f1d.png`).
  - Center/Right Nav Items (EXACTLY 5 primary destinations per user spec): `Exams` (`/exams`), `Geography` (`/geography`), `MCQs` (`/mcq`), `Library` (`/library`), `Search` (inline expandable / navbar search box submitting to `/search`). Active route renders subtle amber dot/underline (`#F0B938`) matching reference `38d65f1d.png`. Zero login / account controls.
  - Mobile (`< md`): Brand logo + Search icon button + Hamburger toggle opening collapsible full-height or slide-down mobile drawer.
- **Breadcrumbs Rule:**
  - Rendered on every nested page (`/exams/...`, `/ppsc/...`, `/css-pms/...`, `/fpsc`, `/nts`, `/mcq/...`, `/topics/...`, `/geography/...`, `/library/...`, `/search`, and all info pages). Omitted on `/`.
- **Footer Specification (`#051C0E`):**
  - Brand column (portal tagline + non-affiliation notice + `"100% Free, No Ads, No Signup"` badge).
  - Study Portals column (`/exams`, `/ppsc`, `/geography`, `/mcq`, `/library`, `/search`).
  - Editorial & Governance column (EXACT 7 required info links: `About` -> `/about`, `Methodology` -> `/methodology`, `Corrections` -> `/corrections`, `Copyright` -> `/copyright`, `Privacy` -> `/privacy`, `Accessibility` -> `/accessibility`, `Status` -> `/status`).
  - Bottom copyright & provenance baseline referencing dataset version from `manifest.json`.

---

## 2. Homepage (`/`) Composition

Exact ordered vertical bands (zero debug swatch blocks; concise vertical density):

1. **Band 1: Emerald Hero + Large Search (`#116135` -> `#08331B` gradient):**
   - Eyebrow pill: `"Free, Open-Access Candidate Preparation"`
   - `h1` (`display-hero`): `"Verified Exam Guides, Geography Drills & Solved MCQs"`
   - Required 1-line portal summary directly below `h1`: *"Free past-paper PDFs, data-verified World Geography quizzes, and PPSC/FPSC/CSS study blueprints with zero ads and zero login."*
   - **Large Hero Search Bar:** Full-width (`max-w-2xl`) white elevated input with emerald search button + instant MiniSearch suggestions dropdown, submitting to `/search?q=...`.
   - **Important:** Do NOT render fabricated/unprovided KPI metrics (`"Verified"`, `"Official Split"` claims without backing); show strictly real live snapshot numbers (`250 Countries`, `{pdfs.length} PDF Booklets`, `{questions.length} MCQs`, `Zero Login`).
2. **Band 2: Exam Tiles & Official Authority Logos (`#FFFFFF` / `#FAFBFC`):**
   - Header (`PREPARE FOR` pill + `"Exam Categories & Commission Shortcuts"`).
   - **Data-Driven Tiles + Shortcuts:** Feature active provided items (`PPSC` `/ppsc`, `PPSC Intelligence Officer (BS-14)` `/ppsc/intelligent-officer` downloadable PDFs) alongside Logo.dev commission tiles (`/exams`, `/fpsc`, `/css-pms`, `/nts`) ONLY when populated OR explicitly labeled `"Coming Soon - 0 Booklets"` so unpopulated commissions never masquerade as active content. Zero fake category bullets.
   - Verification check-pill row (`✓ Free PDFs`, `✓ Solved MCQs`, `✓ Interactive Geography Quiz`, `✓ Zero Ads`, `✓ No Signup`) + compact non-affiliation caption.
3. **Band 3: Latest PDFs (`#F8FAFC`):**
   - Header (`Latest PDFs` + `View All Library -> /library`).
   - Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`): Newest PDF booklet cards displaying title, subject/edition tag, year, formatted file size (`2.51 MB`), verification status pill, detail link (`/library/resource/[slug]`), and direct **Download** button.
4. **Band 4: World Geography Teaser (`#FFFFFF`):**
   - Asymmetric 12-col split (`lg:col-span-5` pitch + `Start` CTA to `/geography` + continent quick links; `lg:col-span-7` interactive preview showing one live **Sample Country Card** complete with flag, Capital, Currency, and Language inside golden pills `#FEF08A`/`#78350F`, plus `"Test in Quiz"` shortcut).
5. **Band 5: MCQ Practice Entry + Subject Quick Grid (`#FAFBFC`):**
   - Elevated horizontal card housing the **MCQ Practice Launcher** (`Exam` select, `Subject` select, `Start Practice -> /mcq/practice`) paired directly below with the **Compact 5x2 Pastel Subject Grid** (inspired by `f0919006.png`) linking straight into `/topics/[subject]/[topic]` or `/mcq?subject=...`.
6. **Band 6: Free, No Ads, No Signup Strip & Standing Non-Affiliation Notice (`#ECFDF5` border band above Footer CTA):**
   - Explicit 3-pillar trust banner (`100% Free Forever`, `Zero Ads or Popups`, `No Login or Tracking`) paired with bold legal disclaimer confirming zero affiliation with PPSC, FPSC, NTS, or any commission.

---

## 3. Examinations Section Layouts

- **`/exams` (Overview Index):**
  - Breadcrumb -> Header (`Exam Authorities`) -> Responsive Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) of data-driven `ExamHubCard` items directly from `exams.json` / `branding.json` (showing Logo.dev emblem or monogram fallback, real counts for PDFs/posts/MCQs, honest `"Coming Soon"` tag when `0` resources exist; remove hardcoded `COMPLEMENTARY_PORTALS` mock list) -> Trust disclaimer block.
- **`/exams/[slug]` (Generic Commission Detail):**
  - Breadcrumb -> Header with Logo.dev commission emblem, summary, and **Top Official Source Box** (external commission link + `lastCheckedAt` / `verifiedAt` date + status pill) -> Sections in 2-col desktop / stacked mobile layout: (a) Recruitment Posts list, (b) Linked Topic MCQs, (c) Linked PDFs. Renders `EmptyStateCard` cleanly when counts are zero.
- **`/ppsc` (PPSC Hub):**
  - Breadcrumb -> Commission Header (`officialPortalUrl`, Logo.dev emblem, verified date, exact PDF & MCQ counts without inflated `+`) -> Interactive `Open` / `Closed` / `All` segmented filter bar -> Grid of published/tracked posts linking `/ppsc/[slug]` (displaying concise factual post summaries + downloadable booklet count without `"null / Ad pending"` clutter) -> Linked Solved PDFs.
- **`/ppsc/[slug]` (Post Detail, e.g., `/ppsc/intelligent-officer` - Strictly Provided Features Only):**
  - Breadcrumb ->
  1. **Concise Post Header & Verification Notice:** Post title, `basicScale` (`BS-14` / `BS-16`), department, external official portal reference (`ppsc.gop.pk`), verification status pill, and non-affiliation notice.
  2. **Downloadable Solved PDF Booklets Grid (`PdfResourceCard[]` from `getPdfResources({ postId: post.id })`):** Full verified downloadable PDF cards (title, author, edition, exact formatted file size, SHA-256 checksum preview link `/library/resource/[slug]`, and direct `<a href={filePath} download>` Download CTA), or an honest `EmptyStateCard` if 0 PDFs exist.
  3. **Minimal Correction Link:** `"Report a correction"` `mailto:` footer trigger.
  - **Explicit Removals on `/ppsc/[slug]`:** Do NOT render mock/unprovided sections (`NotesReaderSection` `EDITORIAL_STUDY_TOPICS` notes tabs, `EditorialStudyPlanCard` percentage charts, `OfficialBlueprintCard` unverified blueprint blocks, `"Pending official verification"` dummy cards in `PostRecordCard`, or fake inline MCQ decks). Remove/redirect `/ppsc/[slug]/blueprint` from navigation links while only downloadable PDFs are offered.
- **`/css-pms`, `/css-pms/[track]`, `/fpsc`, `/nts` (Commission Hubs Without Mock Data):**
  - Remove hardcoded `FPSC_TEST_CATEGORIES`, `NTS_CATEGORIES`, `CSS_PMS_TRACKS`, and `TRACKS` mock arrays. Render strictly factual official portal links + `EmptyStateCard` (`noindex`) cross-linking to active `PPSC` PDFs and `/geography` until verified PDFs or MCQs exist for those authorities.

---

## 4. MCQ Practice & Topic Landing Layouts

- **`/mcq` (Practice Filter Launcher + Paginated Bank Browser):**
  - Breadcrumb -> Intro header -> Single elevated filter card (`Exam`, `Subject`, `Topic`, `Difficulty` optional toggle, live matching question count badge, and primary `Start Practice` button enabled strictly when count `> 0`) -> Paginated MCQ Question Preview list (`fetchQuestionsPage` `20/page`, `PaginationBar` when totalPages `> 1`) -> Quick Browse Subject Cards (`subjects.json` 9 subjects with semantic Lucide/`flagcdn` icons + accurate counts of MCQs & linked PDFs).
- **`/mcq/practice` (Single-Question Session Runner - Exact `mcqs-design.png` Layout, No Timer / No Submit):**
  - Breadcrumb -> Minimal Session Utility Strip (Scope pills `Exam / Subject / Topic`, `"Retry Missed Round"`, `"Clear progress"`, `"Back to MCQ Filter"` - **NO countdown timer and NO Submit button**).
  - **Soft-Mint Outer Sheet (`--dmc-surface-mcq-sheet` `#F0FBF8` -> `#E2F2EE`, `rounded-3xl`, faint curved top-right geometric SVG lines):**
    - Houses the centered **Main White Quiz Card (`rounded-2xl`, `#FFFFFF`, Material shadow):**
      - **Desktop (`>= 768px`):**
        1. **Top 2-Zone Grid (`grid-cols-[1fr_180px]` / `[1fr_200px] gap-8 items-center`):**
           - **Left Zone:** Micro counter (`"Question X of Y"`), bold `#14281D` stem, **2x2 Options Grid (`A.` `B.` `C.` `D.` crisp bordered boxes)**, and immediate inline **`ExplanationBox` + `#FEF08A`/`#78350F` verified answer badge** revealed smoothly underneath once the candidate locks an option.
           - **Right Zone:** Vertically centered **Circular Ring Progress Gauge** (`120-132px`, `X/N` answered fraction in `#0D4A28` / `#14281D`).
        2. **Bottom Horizontal Question Pagination Strip (`hidden md:flex`):** `[Prev]` button | square numbered buttons `[1] [2] ... [N]` (active filled `#0D4A28` white text, windowed ellipsis if `N > 10`) | `[Next]` button (becomes `"View Summary"` on the final question once ready; **never labeled `"Submit"`**).
      - **Mobile (`< 768px`):**
        1. Top-centered **Circular Ring Progress Gauge** (`X/N`) inside white card.
        2. `"Question X of Y"` + bold question stem.
        3. **1-Column Stacked Options (`A.`, `B.`, `C.`, `D.`)** + revealed `ExplanationBox`.
        4. **Bottom 2-Button Equal Split (`grid-cols-2 gap-3 md:hidden`):** `[Prev]` outlined white left + `[Next]` solid `#0D4A28` white-text right.
  - **Session Completion Summary View:** Replaces runner card cleanly at session end with overall score (`X / Y` and `%`), circular accuracy visual, `"Retry Missed (N)"` gold CTA when `missed > 0`, `"Restart Full Set"`, `"Back to Filters"`, and missed-question review cards showing user pick vs. right answer in golden pill + explanation.
- **`/topics/[subject]/[topic]` (Topic Landing Page):**
  - Breadcrumb (`Home > MCQs > [Subject] > [Topic]`) -> Topic Header Card (subject color accent pill + `SubjectIconChip`, title, description, **Exact Question & PDF Count badges**, and `"Start Topic Quiz"` CTA ONLY when `questions.length > 0`) -> Two-column section: Sample/Paginated Verified Questions (`PaginationBar` if `> 20`, or clean `"MCQs not yet added - download PDFs"` EmptyState when `0`) + Related Solved PDFs list.

---

## 5. World Geography Layouts (`/geography`, `/geography/continent/[slug]`, `/geography/[slug]`)

- **`/geography` (Single Page, Two Synchronized Tiers matching `0b875c04.jpg`):**
  - Breadcrumb -> Page Header (`World Geography Reference & Interactive Quiz` across all **250** countries & territories) ->
  - **Tier 1: Reference Guide Section (`#reference-guide`):**
    1. Filter Panel (`GeographyFilterBar`): Search input, Continent select, Region select, **`Clear filters`** button, live `"Showing A-B of T countries"` indicator + `"Quiz this selection (N)"` emerald/amber button (draws eligible verified countries from full matching filter set across all pages).
    2. Horizontal **A-Z Letter Pill Bar** (`All`, `A`..`Z`).
    3. Responsive Country Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, **paginated `24` cards/page across `11` total pages via `GET /api/countries` / `/data/v1/geography/pages/`**, synced with `?page=` and `PaginationBar`: `[Prev] 1 2 ... 11 [Next]`). Each `CountryCard` renders `min-w-0 overflow-hidden`, left `4px` gold accent border (`border-l-[#F0B938]`), flag + name link (`/geography/[slug]`) + verification badge + `"Test in Quiz"` quick action + 3 labeled spec rows with per-item wrapped `#FEF08A`/`#78350F` golden chips **capped at `<= 2` currencies and `<= 3` languages + `+N more` link to `/geography/[slug]`** so Zimbabwe (`9` currencies, `16` languages) never overflows card margins.
  - **Full-Width Emerald Transition Bar (`#0D4A28` matching `0b875c04.jpg`):** Left title (`Tier 2: Interactive Geography Quiz`), quick PDF study shortcut button, Right live score pill (`Score: X / Y`) + **`Clear my progress`** text/ghost action.
  - **Tier 2: Interactive Quiz Module (`#quiz-module` - unchanged `0b875c04.jpg` layout):**
    - Focused white Material card (`max-w-4xl mx-auto`): Top row (`SubQuestionStepper`: `1. Capital -> 2. Currency -> 3. Language` + `Question X of Y` amber label + `"Unanswered"` / `"Answered"` status) -> Prompt -> 2x2 Desktop / 1-col Mobile **Options A-D Grid** (Green + Check when right; Red + Cross + Golden revealed correct answer when wrong) -> Always-shown `ExplanationBox` below after lock -> `"Next Question"` CTA.
    - **Quiz Results Modal (`ScoreModal`):** Centered elevated dialog reporting Total Score, Accuracy `%`, High-Score Celebration Banner at `>= 70%` (confetti particles or static trophy badge when reduced motion enabled), and 2 primary actions: `"Retake Selection"` + `"Next Alphabet / Region"` (plus `"Clear my progress"` secondary link).
- **`/geography/continent/[slug]`:**
  - Breadcrumb -> Continent Header (`Asia`, `Europe`, etc.) + country count + `"Quiz this Continent"` CTA -> Grouped by **Sub-Region Headings**, each displaying a clean grid of `CountryCard` items linking to `/geography/[slug]`.
- **`/geography/[slug]` (Individual Country Profile):**
  - Breadcrumb (`Home > Geography > [Continent] > [Country]`) -> Hero Profile Header (Large Crisp Flag Frame, `nameCommon`, `nameOfficial`, Continent & Region chips, `"Verified"` or `"Unverified"` badge, primary CTA **`Test in Quiz`** -> `/geography?country=[slug]#quiz-module`) ->
  - 2-Column Main Layout:
    - Left (`col-span-7`): Structured Fact Table showing **ISO Codes** (`Alpha-2`, `Alpha-3`, `Numeric`), **All Capitals**, **All Currencies** (names, ISO 4217 codes, symbols), **All Official Languages** (`nativeName` + English name), Continent/Region hierarchy, and conditional **Disputed Fact Warning Box** if `country.disputed` flags are true.
    - Right (`col-span-5`): Provenance & Citation Card listing linked `Source[]` authorities, `verifiedAt` & `lastCheckedAt` dates, and **`Report a correction`** `mailto:` link button.

---

## 6. PDF Library & Search & Info Pages

- **`/library` and `/library/[exam]`:**
  - Breadcrumb -> Header (`Verified PDF Library` or `[Exam] Study Booklets`) -> Search + Filter & Sort Bar (`Search input`, `Exam`, `Subject`, `Topic`, `Year`, `Type`, `Sort by`) + `"Clear filters"` -> Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) of `PdfCard` items displaying title, subject tag, year, page count (or `"Full Set"` fallback), formatted size (`2.51 MB`), verification pill, detail link, and direct `Download PDF` CTA. Empty state appears cleanly when 0 resources match filters.
- **`/library/resource/[slug]`:**
  - Breadcrumb -> Conditional top **`Archived` Notice Banner** (`This edition is archived` + explicit link to replacement resource if present) -> 2-Column Desktop Detail Layout:
    - Left (`col-span-4`): High-contrast Portrait Cover Thumbnail (image or generated A4 Folio Cover) + Desktop primary **Download PDF** CTA (`size`, `SHA-256` copy/inspect badge, page/question count).
    - Right (`col-span-8`): Title, Author badge, Edition/Version note, Summary, Highlights list, Topic tags, Source verification metadata, **Rights & License Box**, **`Report a problem`** `mailto:` link, and **Related Items** strip below.
    - Mobile Only (`< md`): **Sticky Bottom Download Bar** anchored cleanly above viewport bottom showing concise title/size and full-width Download CTA.
- **`/search`:**
  - Breadcrumb -> Top Unified Search Bar (`max-w-3xl`, auto-synced with `?q=`) -> Result count summary & quick type jump pills (`All`, `PDFs (N)`, `Countries (N)`, `Exams & Posts (N)`, `MCQs & Topics (N)`) -> Grouped sections ordered by relevance, each showing compact scannable rows with type badges and direct links -> Helpful popular-queries empty state when `?q=` is blank or yields 0 matches.
- **Information & System Routes (`/about`, `/methodology`, `/corrections`, `/copyright`, `/privacy`, `/accessibility`, `/status`, `not-found.tsx`, `error.tsx`):**
  - Single-column `max-w-4xl` clean editorial cards separated by generous vertical rhythm (`space-y-8`):
    - `/privacy` features a prominent interactive status panel explaining `localStorage` keys (`dmc:v1:geography-quiz`, `dmc:v1:mcq`) with an instant `"Clear Stored Quiz Progress"` button right inside the policy page.
    - `/corrections` pairs email guidelines with `AcademicFeedbackForm` (`mailto:faculty@docmubashirchaudhary.com` URI + clipboard fallback).
    - `/status` displays build `datasetVersion`, `generatedAt`, entity count summary tiles, and pending verification notes from `manifest.json`.
    - `not-found.tsx` and `error.tsx`: Centered Material recovery card inside `max-w-xl` with clear icon, concise human explanation, Search link / `"Try Again"` reset button, and Home / Geography / PPSC escape links.

---

## 7. Backend Integration Points

Structural layout containers bind directly to verified server/static structures in [`docs/backend/api-contract.md`](./backend/api-contract.md):
- **Global Shell & Status:** Footer dataset stamp and `/status` consume `/data/v1/manifest.json` (`datasetVersion`, `generatedAt`, `counts`, `files`).
- **Examinations Layouts (`/exams`, `/ppsc`, `/ppsc/[slug]`):** Consume `ContentRepository.getExams()`, `getExam(slug)`, `getRecruitmentPosts(examSlug)`, `getRecruitmentPost(slug)`, `/data/v1/examinations/branding.json` (`Logo.dev` URLs), and `/data/v1/resources/pdfs.json` (non-duplicated PDF paths). On `/ppsc/[slug]`, render ONLY the post header/verification notice + downloadable solved PDFs (`PdfResourceCard[]`) + correction link, omitting unprovided blueprint/study-plan mock tables.
- **Geography Layouts (`/geography`, `/geography/continent/[slug]`, `/geography/[slug]`):** `/geography` Tier 1 uses `fetchCountriesPage()` (`GET /api/countries` / `/data/v1/geography/pages/page-{n}.json`, `24/page` across `250` countries); Tier 2 quiz uses `/data/v1/geography/countries-quiz-v1.json` + `/data/v1/geography/reference.json`.
- **PDF Library Layouts:** Consume `getPdfResources(filter)` and `getPdfResource(slug)` backed by `/data/v1/resources/pdfs.json` (`2` published non-duplicated booklets). Missing optional schema fields (`pageCount`, `thumbnailPath`, future `publicationYear`, `replacementSlug`) have explicit layout fallbacks so cards stay uniform.
- **MCQ & Topic Layouts:** Consume `getQuestions(filter)`, `fetchQuestionsPage()` (`GET /api/questions`, `20/page`), `subjects.json` (`iconName` / `iconUrl`), `topics.json`, and `getRelated({ type, id })`.
- **Search Page:** Consumes serialized `/data/v1/search-index/all.json` and groups `SearchHit[]` strictly by `SearchEntityType` (`pdf`, `country`, `exam`, `post`, `question`, plus `topicHits`).

