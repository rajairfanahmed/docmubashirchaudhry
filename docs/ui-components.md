# UI Components Specification (Step 4 of 10)

> **Consumer Skill:** `04-ui-components` (Component & Page Phase - Run After Step 3)
> **Scope:** Complete component inventory, variants, typed props, visual & interactive states (`default`, `hover`, `focus`, `active`, `selected`, `disabled`, `loading`, `error`, `success`, `empty`, `archived`), keyboard semantics, and exact backend payload bindings.
> **Token & Layout Dependencies:** Uses color/type/radius tokens from [`visual-design.md`](./visual-design.md) inside page containers from [`structural-layout.md`](./structural-layout.md). Interactive state wiring belongs to [`ux-interaction-design.md`](./ux-interaction-design.md).

---

## 1. Primitive & Shared Surface Components (`src/components/ui/`)

### `Button`
- **Variants:**
  - `primary` / `forest`: `#0D4A28` bg, `#FFFFFF` text -> hover `#116135` -> active scale `0.98`.
  - `gold` / `amber`: `#F0B938` bg, `#0F172A` bold text -> hover `#F59E0B` (used on high-emphasis quiz & hero CTAs).
  - `outline`: `#FFFFFF` bg, `1px solid #CBD5E1`, `#0F172A` text -> hover `#F8FAFC` border `#0D4A28`.
  - `secondary`: `#ECFDF5` bg, `#065F46` text -> hover `#D1FAE5`.
  - `ghost`: Transparent bg, `#475569` text -> hover `#F1F5F9` `#0F172A`.
  - `danger`: `#FEF2F2` bg, `1px solid #FECACA`, `#991B1B` text (for destructive progress resets).
- **Sizes:** `sm` (`h-9 px-3 text-xs`), `md` (`h-11 px-5 text-sm`, guarantees `>= 44px` touch target), `lg` (`h-12 px-7 text-base`).
- **States:** `default`, `hover`, `focus-visible` (`2px solid #0D4A28` + `2px` offset, or `#F0B938` ring on dark surfaces), `disabled` (`opacity-50 pointer-events-none`), `loading` (replaces/prepends spinning Lucide `Loader2` icon + `aria-busy="true"`).

### `Badge` & `VerificationBadge`
- **Variants:**
  - `verified`: Emerald `#ECFDF5`, `#065F46` text, `ShieldCheck` icon (`"Verified · YYYY-MM-DD"`).
  - `unverified`: Amber `#FFFBEB`, `#92400E` text, `AlertTriangle` icon (`"Unverified - Pending Official Check"`).
  - `disputed`: Orange `#FFF7ED`, `#9A3412` text (`"Disputed Field"`).
  - `archived`: Slate `#F1F5F9`, `#334155` text (`"Archived"`).
  - `editorial`: Soft blue `#EFF6FF`, `#1E3A8A` text (`"Platform recommendation, not official"`).
  - `open` / `closed` / `upcoming`: Green (`#ECFDF5`), Slate (`#F1F5F9`), Sky (`#E0F2FE`).
- **Props:** `{ status: VerificationStatus | 'open' | 'closed' | 'upcoming' | 'archived' | 'editorial'; date?: string; label?: string }`.

### `AnswerHighlight` (Golden Pill - Overflow Safe)
- **Strict Styling Mandate:** Background `#FEF08A`, text `#78350F`, border `1px solid #FDE047`, `font-semibold`.
- **Anti-Overflow Geometry Rule (Fixes Multi-Value Pill Expansion):**
  - Single concise tokens (`Harare`, `USD`) render with `rounded-full px-2.5 py-0.5 inline-flex items-center max-w-full`.
  - Multi-value fields (`capitals[]`, `currencies[]`, `languages[]`) MUST NEVER be joined into one giant comma-separated string inside a single `rounded-full` container (which causes ballooning oval blobs that clip outside narrow cards, observed on Zimbabwe's 9 currencies and 16 official languages). Instead, render **individual per-item chips** using `rounded-lg px-2 py-0.5 max-w-full break-words` inside a wrapping `flex flex-wrap gap-1.5 min-w-0` cluster.

### `EmptyStateCard`
- **Props:** `{ title: string; description: string; icon?: LucideIcon; primaryAction?: { label: string; href: string }; secondaryAction?: { label: string; href?: string; onClick?: () => void } }`.
- **Usage:** Unpopulated hubs (`/fpsc`, `/css-pms`, `/nts`), filtered `/library` 0-result views, `/geography` 0-match filters (`"Reset All Filters"` button), and `/search` empty state.

### `ProvenanceBox`
- **Props:** `{ officialUrl?: string; officialLabel?: string; verification: Verification; sources: Source[]; title?: string }`.
- **States:** Renders an Amber warning border (`#FFFBEB` / `#F59E0B`) whenever `verification.status !== 'verified'`, explicitly showing an **`Unverified`** badge until confirmed, alongside last-checked ISO date and outbound source links (`rel="noopener noreferrer"`).

---

## 2. Global Navigation & Structural Components (`src/components/layout/`)

### `Navbar` & `MobileDrawer`
- **Desktop Composition (`md+`):** Brand Logo (`docmubashirchaudhry`, link `/`) + 4 text links with crisp subtle icons (`Exams`, `Geography`, `MCQs`, `Library`) + compact inline Search control (`Search`). Active route gets `#0D4A28` bold text + `#F0B938` bottom/dot indicator. **Zero account or login controls.**
- **Mobile (`< md`):** Logo left; Search icon toggle (`aria-expanded`) + Hamburger button (`aria-expanded`, `44x44px` minimum) right. Collapsible panel reveals stacked `48px` row links, quick search bar, and non-affiliation notice.
- **States:** Scrolled elevation transition (`shadow-material-2`), Escape-to-close focus return on drawer.

### `CommissionBrandBadge` (`AuthorityExamTiles`, `/exams`, hub headers)
- **Props:** `{ code: string; title: string; logoUrl?: string | null; fallbackMonogram: string; accentHex?: string; size?: 'sm' | 'md' | 'lg' }`.
- **Behavior:** Renders `logoUrl` (`img.logo.dev`, e.g., `PPSC`, `FPSC`, `CSS / PMS`, `NTS`, `SPSC`) inside a white rounded container (`border border-[#E2E8F0]`, explicit `44x44` / `48x48` / `64x64` `object-contain` slot). On image `onError` or whenever `logoUrl === null` (`KPPSC`, `BPSC`), seamlessly swaps in-state to a high-contrast forest/slate monogram chip (`fallbackMonogram`).

### `SubjectIconChip` (`McqLauncherWidget`, `/mcq`, `/topics`, `/library`)
- **Props:** `{ iconName: string; iconUrl?: string; badgeLabel?: string; accentHex?: string; pastelBgVar?: string; pastelInkVar?: string }`.
- **Behavior:** Maps `subjects.json` `iconName` (`Globe`, `Landmark`, `BookOpenCheck`, `FlaskConical`, `Languages`, `Feather`, `Calculator`, `Cpu`, `Trophy`) to Lucide icons (`1.75px` stroke), or renders `iconUrl` (`https://flagcdn.com/pk.svg` on `sub-pak-studies`) cleanly when provided.

### `PaginationBar` (`GeographyWorkbench` Tier 1, `/mcq`, `/topics/[subject]/[topic]`)
- **Props:** `{ page: number; pageSize: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean; onPageChange: (nextPage: number) => void; itemLabel?: string }`.
- **Visual & Interactive Spec:** Displays live range readout (`"Showing 1-24 of 250 countries"`), **`Prev`** outlined button (`disabled={!hasPreviousPage}`), windowed square/pill page buttons (`<= 5` mobile, `<= 7` desktop with `...` ellipsis, current page filled `#0D4A28` white text + `aria-current="page"`), and **`Next`** outlined button (`disabled={!hasNextPage}`), minimum `44x44px` hit box.

### `Breadcrumb` & `Breadcrumbs`
- **Props:** `{ items: Array<{ label: string; href?: string }> }`.
- **Behavior:** Rendered on all nested pages; final item uses `aria-current="page"`. Renders matching `BreadcrumbList` Schema.org metadata cleanly on server.

### `StandingTrustNotice`
- **Variants:** `banner` (compact horizontal strip directly beneath hero/header or above footer) and `inline` (compact caption beneath `AuthoritySeals` / `Footer`).
- **Copy Requirements:** Always states both pillars:
  1. Independent platform: **Not affiliated with PPSC, FPSC, NTS, CSS/PMS commissions, or any government body.**
  2. **100% Free, Zero Ads, No Login Required.**

---

## 3. Homepage Components (`src/components/home/`)

### `HeroSearch`
- **Props:** `{ quickQueries?: string[] }`.
- **Visuals:** White rounded-xl container (`min-h-[56px]`) sitting inside dark emerald hero (`#08331B`) with glowing `#F0B938` focus border ring. Includes live predictive MiniSearch popover (max 6 instant hits grouped compactly with entity pill badges) + `"Search"` button routing to `/search?q=...`.
- **States:** `idle`, `typing/loading-index` (micro spinner only on first focus fetch of `search-index/all.json`), `results-open`, `no-matches`, `fetch-error` (gracefully submits directly to `/search`).

### `AuthorityExamTiles` (`src/components/home/AuthorityExamTiles.tsx`)
- **Structure:** Data-driven commission tiles backed by `exams.json` / `branding.json` + featured `PPSC Intelligence Officer (BS-14)` downloadable PDFs shortcut tile. Avoid hardcoded empty mock tiles promising unbacked booklets; unpopulated commissions (`fpsc`, `css-pms`, `nts`) show explicit `"Coming Soon - 0 Booklets"` badges alongside `CommissionBrandBadge`.
- **Visuals:** `CommissionBrandBadge` (`Logo.dev` `logoUrl` + `onError` monogram), exam title, concise jurisdiction subtitle, and verified active/draft status indicator.
- **Check Strip:** Below tiles, horizontal wrapped list of mint check pills (`✓ Free PDFs`, `✓ Solved MCQs`, `✓ Geography Quiz`, `✓ Zero Ads`, `✓ No Signup`).

### `LatestPdfGrid` (`Latest PDFs`)
- **Backend Binding:** `ContentRepository.getPdfResources({ includeDrafts: false })` -> slices published booklets (`pdf-io-set-01`, `pdf-tso-set-01`).
- **Displays:** Booklet title, primary subject badge, edition/year, `fileSizeBytes` formatted (`2.51 MB`, `2.72 MB`), `pageCount` (omitting `0+` placeholder counts when `questionCount` is fallback-only), verification badge, detail link `/library/resource/[slug]`, and direct `<a href={filePath} download>`.

### `GeographyTeaserCard`
- **Backend Binding:** Picks 1 featured verified `CountryEntity` + live total verified count (`250` countries & territories) from `countries.json` / `reference.json`.
- **Displays:** Teaser intro + `Start` button (`/geography`) beside a live `CountryCard` displaying overflow-safe golden pills (`#FEF08A` / `#78350F`) for Capital, Currency, Language.

### `McqLauncherWidget` & `SubjectQuickGrid`
- **Props:** `{ exams: Exam[]; subjects: Subject[]; topics: Topic[]; questionCountsBySubject?: Record<string, number>; pdfCountsBySubject?: Record<string, number> }`.
- **Controls:** Exam `<select>` + Subject `<select>` + `"Start Practice"` CTA routing to `/mcq/practice`. Below sits the 5x2 compact pastel `SubjectIconChip` grid mapping `subject.iconName` / `iconUrl` (`subjects.json`) and showing exact real question/PDF counts per subject (never displaying fake `"MCQs & PDFs"` text where MCQ count is `0`).

---

## 4. Examination Components (`src/components/exams/`)

### `ExamHubCard` (`/exams`)
- **Backend Binding:** `Exam` from `/data/v1/examinations/exams.json` + `EXAM_BRANDING_CATALOG` (`branding.json`). Remove hardcoded `COMPLEMENTARY_PORTALS` mock arrays.
- **Displays:** `CommissionBrandBadge` (`logoUrl` / `fallbackMonogram`), `bodyCode`, `title`, `jurisdiction`, live PDF/post counts, `status === 'draft'` tag (`"Coming Soon"` when `0` resources exist), and `"Explore Hub"` CTA.

### `PostFilterBar` & `/ppsc/[slug]` Downloadable-PDF Scope (`/ppsc`, `/ppsc/[slug]`)
- **`PostFilterBar` (`/ppsc`):** Segmented tab pills (`All`, `Open`, `Closed`) + count badges (`aria-pressed`). Links each post card cleanly to `/ppsc/[slug]` without `"Ad pending / Case pending"` filler placeholders.
- **Removed Mock/Unprovided Components on `/ppsc/[slug]`:** Remove `NotesReaderSection` (`EDITORIAL_STUDY_TOPICS` mock study notes tabs), `EditorialStudyPlanCard` (synthetic percentages/hours), `OfficialBlueprintCard` (unprovided pattern breakdown + `/blueprint` history links), `PostRecordCard` placeholder `"Pending official verification"` grid boxes, and inline `"Start MCQ Practice"` CTA.
- **Active `/ppsc/[slug]` Modules:** Clean Post Header (`post.title`, `post.basicScale`, `post.department`, `VerificationBadge`, `officialPortalUrl`), **`PdfResourceCard[]`** grid strictly rendering downloadable SHA-256 solved PDF booklets linked to that post (or `EmptyStateCard` if `0` PDFs exist), and `CorrectionTrigger` (`mailto:`).

---

## 5. MCQ Practice Components (`src/components/mcq/`)

### `McqSetupForm` (`/mcq`)
- **Backend Binding:** `exams.json`, `subjects.json` (paired with `SubjectIconChip`), `topics.json`, `getQuestions()` & `getQuestionsPaginated()`.
- **Controls:** Cascading selects (`Exam`, `Subject`, `Topic`) + `"Available MCQs: N"` live indicator. Disables `"Start Practice"` when `N === 0`, displaying an honest `"No verified MCQs available yet for this selection"` note alongside any related downloadable PDFs.

### `McqPracticeRunner`, `SingleQuestionCard`, `CircularProgressRing` & `McqPaginationStrip` (`/mcq/practice` - Exact `mcqs-design.png` Spec, Minus Timer & Submit)
- **Strict Scope:** Applies **exclusively to `/mcq/practice`** (NOT `/geography` Tier 2 Quiz cards).
- **Explicit Omissions:** Do **NOT** render `"Time remaining 14:44:00"` countdown timer, `"Submit"` button, or user login/avatar controls shown in the reference header.
- **Outer Container (`McqPracticeRunner`):** Pale-mint gradient sheet (`from-[#F0FBF8] to-[#E2F2EE]`, `rounded-2xl sm:rounded-3xl`, subtle curved geometric top-right SVG hairlines `rgba(13, 74, 40, 0.08)`), minimal scope bar above card (`Exam / Subject / Topic` pills + `"Clear progress"` / `"Back to Filter"`), enclosing the pure white card (`#FFFFFF`, `rounded-2xl`).
- **`SingleQuestionCard` & `CircularProgressRing` (`mcqs-design.png`):**
  1. `question-header`: `"Question {currentIndex + 1} of {activeDeck.length}"` eyebrow + bold `#14281D` stem.
  2. `CircularProgressRing`: Custom crisp SVG ring (`stroke="#0D4A28"`, track `"#E5E7EB"`, `strokeLinecap="round"`, `strokeWidth: 10-11px`) displaying centered bold `{answeredCount}/{activeDeck.length}` fraction. Positioned top-center on mobile (`< md`), vertically centered in right column on desktop (`>= md`).
  3. **Responsive Options Grid:** `grid-cols-1 gap-3` on mobile (`< md`), `grid-cols-2 gap-3.5` on desktop (`>= md`). Options `A.`-`D.` render as crisp white bordered boxes (`border-slate-200`, `rounded-lg`, `min-h-[52px]`, bold option letter prefix + text).
  4. **Locked Interactive States:** Clicking an option immediately locks that question (`isLocked = true`) without waiting for any Submit step:
     - `locked-correct`: Emerald (`#ECFDF5` bg, `2px solid #10B981`, `CheckCircle2` icon) + revealed golden pill (`#FEF08A` / `#78350F`).
     - `locked-incorrect`: Crimson (`#FEF2F2` bg, `2px solid #EF4444`, `XCircle` icon) + true option illuminated in Highlight Gold (`#FEF08A` / `#78350F` + `2px solid #F0B938`).
  5. **Revealed Explanation:** `ExplanationBox` slides smoothly directly below the options grid (`question.explanation`).
- **`McqPaginationStrip` Footer Navigation:**
  - **Desktop (`>= md`):** Horizontal control bar (`Prev` outlined button | compact square numbered buttons `[1]`..`[N]` with windowed ellipsis when `N > 10`; active `#0D4A28` fill + white ink; subtle emerald tint on answered items | `Next` outlined button, reading `"View Summary"` on the final question).
  - **Mobile (`< md`):** 2-column equal button footer (`grid-cols-2 gap-3`): `Prev` (outlined white button) left + `Next` (solid `#0D4A28` dark forest button, `"View Summary"` on final question) right; hides desktop numbered jumper pills.

### `McqSessionSummary` (`/mcq/practice`)
- **Displays:** Final Score (`X / Y`, `%`), `"Retry Missed Questions (N)"` amber CTA (filters active session array strictly to missed question IDs and restarts at Q1), `"Practice Full Set Again"`, and chronological missed-question review cards displaying each missed stem, user pick, correct answer in golden `#FEF08A`/`#78350F` pill, and full explanation.

---

## 6. World Geography Components (`src/components/geography/`)

### `GeographyFilterBar` & `AlphabetRail`
- **Props:** Continents, Regions, active filter state `{ search, continentId, regionId, letter }`, `filteredCount`, `onClearFilters`, `onQuizSelection`.
- **`AlphabetRail`:** Horizontally wrapping pill bar (`All`, `A`..`Z`). Letters with 0 matching countries in the active dataset are visibly muted (`opacity-50`) while remaining inspectable. Changing any filter resets Tier 1 pagination cleanly to `page = 1`.
- **`Quiz this selection` CTA:** Prominent forest/gold button displaying live filtered question-eligible count across **all matching pages** (`"Quiz this selection (242 countries)"`), never limited to the 24 visible cards on Page 1.

### `CountryCard` (Tier 1 Reference - Overflow-Safe Spec)
- **Backend Binding:** `CountryEntity` (`nameCommon`, `slug`, `flag`, `capitals[]`, `currencyIds[]`, `officialLanguageIds[]`, `disputed`, `verification`) rendered inside `GeographyWorkbench` Tier 1 (`24` cards/page across `250` items via `fetchCountriesPage` + `PaginationBar`).
- **Visual Spec (`0b875c04.jpg` + Zimbabwe Overflow Resolution):**
  - White rounded-2xl Material card with `border-l-4 border-l-[#F0B938]`, strict `min-w-0 overflow-hidden`.
  - Top row: `FlagFrame` (`36x24px`) + `Country Name` link (`/geography/[slug]`) + verification badge (`Verified` / `Unverified`) + compact `"Test in Quiz"` button.
  - **3 Fact Rows (`Capital`, `Currency`, `Official Language`) Anti-Overflow Layout:**
    - Render each item as an individual compact `AnswerHighlight` golden chip (`#FEF08A` bg, `#78350F` text, `rounded-lg px-2 py-0.5 max-w-full break-words`) rather than concatenating 9 currencies or 16 languages into one giant `rounded-full` oval blob!
    - **Card Cap:** Render at most **`2` Capital chips**, **`2` Currency chips**, and **`3` Official Language chips** per `CountryCard`; when `total > cap`, append a crisp interactive **`+{remaining} more`** link pill navigating directly to `/geography/[slug]` (where complete multi-value tables display without clutter).
    - **Alignment:** When a row contains `> 1` chip or sits below `sm`, stack `<dt>` neatly above `<dd className="flex flex-wrap gap-1.5 min-w-0 w-full">` so long entries (e.g., Zimbabwe Gold, Bosnian mark, Zimbabwean Sign Language) wrap flush inside card borders without horizontal overflow.

### `GeographyQuizModule` & `SubQuestionStepper` & `ScoreModal` (Tier 2 Quiz - `0b875c04.jpg` Retained)
- **Backend Binding:** Consumes generated prompts from `src/lib/quiz/` (`generateCountryQuiz`) over `/data/v1/geography/countries-quiz-v1.json`, strictly filtering out unverified or disputed target facts per `countryRules`.
- **Emerald Header Divider (`#0D4A28`):** Displays active quiz mode/scope label, live `Score: X / Y` badge, and `"Clear my progress"` button (triggers instant state clear on `dmc:v1:geography-quiz`).
- **Active Question Body:**
  - `SubQuestionStepper` (`1. Capital -> 2. Currency -> 3. Language`) shown whenever quizzing country trio.
  - Prompt header (`QUESTION N` in amber uppercase; right badge `"Unanswered"` / `"Correct +1"` / `"Incorrect"`).
  - 2x2 Options A-D Grid: Green + Check (+1 score) when correct; Red + Cross + reveals true option when incorrect.
  - `ExplanationBox` always renders after lock (`country.nameOfficial`, capitals, currency code, language fact, plus disputed note if any).
- **`ScoreModal`:** Focus-trapped elevated dialog rendered upon completing quiz set (`>= 70%` confetti celebration OR static trophy badge under `prefers-reduced-motion: reduce`), `"Retake Quiz"`, `"Next Alphabet / Region"`, and `"Clear my progress"`.

---

## 7. PDF Library, Search & Feedback Components

### `PdfFilterToolbar`, `PdfResourceCard` (`/library` & `/library/[exam]`)
- **Backend Binding:** `PdfResource[]` from `/data/v1/resources/pdfs.json` joined with `Subject[]`/`Topic[]`. Filter exam tabs reflect exams that actually have published booklets (`All`, `PPSC`).
- **`PdfFilterToolbar`:** Search input, selects for `Exam`, `Subject`, `Topic`, `Year`, `Type`, and `Sort` (`Newest`, `Most Questions`, `Largest/Smallest Size`, `Title A-Z`), plus `"Reset Filters"`.
- **`PdfResourceCard`:** Displays optional `Archived` strip (when `status === 'archived'`), cover folio thumbnail/mini-preview, Title (`/library/resource/[slug]`), Subject tag, Year (`publicationYear` or fallback derived from `verification.verifiedAt.slice(0,4)`), Page count (shows `N Pages` or verified booklet edition label - omit `0+` placeholder counts), Formatted Size (`2.51 MB`, `2.72 MB`), `VerificationBadge`, and direct **Download** CTA.

### `PdfDetailPanel` & `StickyMobileDownloadBar` (`/library/resource/[slug]`)
- Renders optional top `"Archived"` alert box with link to `replacementSlug` if supplied, A4 cover thumbnail, SHA-256 verification pill, Author, Edition/Version note, `rights` + `licenseNote` statement, Related Exams/Topics/PDFs grid, `"Report a problem"` `mailto:` button, and on `< md` viewports a fixed bottom **Sticky Download CTA Bar** (`z-40`, `min-h-[60px]`, white card top border + full-width `#0D4A28` Download button).

### `SearchResultsGroup` (`/search`)
- Groups `SearchHit[]` returned from MiniSearch (`/data/v1/search-index/all.json`) into clean sections with counts (`PDFs`, `Countries`, `Exams`, `Recruitment Posts`, `Topics & MCQs`). Each hit card shows entity badge, title, subtitle, and safe `<Link>` destination.

### `AcademicFeedbackForm` (`/corrections` & footer/profile links)
- Fields: Record / Page reference (auto-filled on country/PDF/post links), Issue Category (`Factual Error`, `Broken Link`, `PDF Issue`, `Copyright / Attribution`, `Accessibility`), Detailed Description, Optional Name/Email.
- Submit action builds formatted `mailto:faculty@docmubashirchaudhary.com` URI via `src/lib/feedback/mailto.ts` AND opens a copy-to-clipboard preview box with toast confirmation (zero network POST calls).

---

## 8. Backend Integration Points

- **Data Props & Paginated API Bindings (`docs/backend/api-contract.md`):**
  - `CountryCard`, `GeographyTeaserCard`, `GeographyWorkbench`: consume `CountryEntity` + `ReferenceData` + `fetchCountriesPage()` (`GET /api/countries` / `/data/v1/geography/pages/page-{n}.json`, `24/page` across `250` items).
  - `AuthorityExamTiles`, `ExamHubCard`, `McqLauncherWidget`, `McqSetupForm`: consume `EXAM_BRANDING_CATALOG` (`/data/v1/examinations/branding.json` `Logo.dev` URLs) and `SUBJECT_ICON_CATALOG` (`/data/v1/taxonomy/subjects.json` Lucide/`flagcdn.com/pk.svg` icons) + `fetchQuestionsPage()` (`GET /api/questions` / `/data/v1/questions/pages/page-{n}.json`, `20/page`).
  - `/ppsc/[slug]` (`PdfResourceCard`, `PdfDetailPanel`): consume `RecruitmentPost` header fields and strictly downloadable `PdfResource[]` bound to `postIds[]` via non-duplicated `/documents/ppsc/...` paths.
  - `SingleQuestionCard`, `McqPracticeRunner`: consume `Question` (`stem`, `options[]` 4-5 choices, `correctOptionId`, `explanation`, `topicIds[]`, `difficulty`, `verification`).
- **Zero Auth / Zero Write Endpoints:** Component state mutations remain strictly client-side (`localStorage` envelopes `dmc:v1:geography-quiz` & `dmc:v1:mcq` and `mailto:` URI triggers).

