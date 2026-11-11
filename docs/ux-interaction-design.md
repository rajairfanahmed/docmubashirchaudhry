# UX Interaction Design Specification (Step 5 of 10)

> **Consumer Skill:** `05-ux-interaction-design` (Component & Page Phase - Run After Step 4)
> **Scope:** Complete end-to-end user flows, navigation/filter state synchronization, validation and form behaviors, loading/empty/error states, feedback/confirmation rules, and `localStorage` persistence transitions.
> **Component & API Contracts:** Connects components specified in [`ui-components.md`](./ui-components.md) directly to [`docs/backend/api-contract.md`](./backend/api-contract.md) and [`frontend-architecture.md`](./frontend-architecture.md).

---

## 1. Core End-to-End User Flows

### Flow A: Global & Hero Search (`/`, Navbar -> `/search`)
1. Candidate focuses `HeroSearch` or clicks header `Search` control (`< md` opens search row, desktop focuses input).
2. On first focus or typing >= 2 characters, client triggers lazy fetch `GET /data/v1/search-index/all.json` (debounced 150ms) and queries MiniSearch (`fuzzy: 0.2`, `prefix: true`, boosted `title: 2.5`).
3. **Instant Preview:** Shows top 6 results categorized by type pill (`PDF`, `Country`, `Exam`, `Post`, `Question`). Pressing `Enter` or clicking `"See all results"` navigates via Next `<Link>` / `router.push` to `/search?q={encoded}`.
4. **Full Search Page (`/search`):** Pre-populates query from `?q=`, renders result counts per group (`PDFs (N)`, `Countries (N)`, `Exams & Posts (N)`, `Topics & MCQs (N)`), and offers group anchor pills for instant jumping.
5. **Failure Recovery:** If fetching `search-index/all.json` fails offline, Hero/Navbar form submission still routes to `/search?q=...` where server-rendered page/fallback guidance provides direct links to `/library`, `/geography`, `/ppsc`, and retry button.

### Flow B: Commission Hubs & PPSC Downloadable-PDF Post Pages (`/exams` -> `/ppsc` -> `/ppsc/[slug]`)
1. From `/` or `/exams`, user selects `PPSC` or `PPSC Intelligence Officer` (featured BS-14 PDFs). Commission emblems render cleanly via `CommissionBrandBadge` (`Logo.dev` with `fallbackMonogram` swap on `onError` or KPPSC/BPSC).
2. **Unpopulated Commission Hubs (`/fpsc`, `/css-pms`, `/nts` when `0` PDFs/posts/MCQs exist):** Render strictly factual official portal provenance + `EmptyStateCard` linking directly to active `PPSC` PDFs and `/geography`, with ZERO hardcoded mock test category lists (`FPSC_TEST_CATEGORIES`, `NTS_CATEGORIES`, `CSS_PMS_TRACKS`).
3. **`/ppsc` Filter Flow:** Clicking `Open` / `Closed` / `All` updates `?status=`, filters `RecruitmentPost[]` client-side immediately, announces count via `aria-live="polite"`, and marks active pill (`aria-pressed="true"`).
4. **`/ppsc/[slug]` Post Page Flow (Provided Features Only - Downloadable PDFs):**
   - Renders clean post title/scale/department header with external `ppsc.gop.pk` verification link, followed directly by **`PdfResourceCard[]`** for that post (view SHA-256 details `/library/resource/[slug]` or click direct `<a href={filePath} download>`), and `"Report a correction"` `mailto:` link. Zero fake study tabs, blueprint weights, or unprovided quiz panels appear on `/ppsc/[slug]`.

### Flow C: Subject/Topic MCQ Practice (`/mcq` -> `/topics/[subject]/[topic]` -> `/mcq/practice`)
1. **Launcher & Paginated Preview (`/mcq`):** User filters by `Exam`, `Subject`, and optional `Topic` (`McqSetupForm` shows semantic `SubjectIconChip` visuals and exact counts). Paginated preview list (`fetchQuestionsPage` via `GET /api/questions`, `20/page`) resets to `?page=1` whenever filters change. `"Start Practice"` disables cleanly when matching question count is `0`.
2. **Interactive `mcqs-design.png` Quiz Flow (`/mcq/practice` - NO Timer, NO Submit Button):**
   - Renders inside the soft-mint rounded outer sheet (`#F0FBF8` -> `#E2F2EE` with subtle geometric arcs) enclosing the crisp white card:
     - Displays `"Question X of Y"`, bold stem, and **2x2 Desktop / 1-Column Mobile Options (`A.` `B.` `C.` `D.`)**, plus the **Circular Ring Progress Gauge (`X/N` answered)**.
     - **Immediate Answer Lock:** Clicking option `A`-`D` immediately locks the current question (`isLocked = true`), highlights Emerald (`#ECFDF5` + Check) if right or Crimson (`#FEF2F2` + Cross + Golden `#FEF08A`/`#78350F` reveal on the correct choice) if wrong, increments score when correct, persists to `dmc:v1:mcq` in `localStorage`, and reveals `ExplanationBox` directly beneath the options.
     - **Question Navigation Without Submit or Timer:** Desktop displays `[Prev] [1] [2] ... [N] [Next]` bottom jumper strip; Mobile displays bottom 2-column `[Prev]` and `[Next]` buttons. Candidates may jump across questions freely with `Prev`/`Next`/numbered buttons at their own pace (zero countdown clock); advancing past the final question (or clicking `"View Summary"` on the last item) opens **`McqSessionSummary`** with total score, missed-question review, and `"Retry Missed (N)"`.

### Flow D: World Geography 2-Tier Synced Flow (`/geography` + `/geography/[slug]`)
1. **Tier 1 Paginated Reference Browsing (`250` Countries, `24/page`):**
   - Initial load renders Page `1` (`Showing 1-24 of 250 countries`) via `fetchCountriesPage` (`GET /api/countries` / `/data/v1/geography/pages/page-{n}.json`) synced cleanly to `?page=`.
   - Filtering by **A-Z letter**, **Continent**, **Region**, or **Search keyword** resets `page` to `1`, fetches matching paginated slice, and announces `"Showing A-B of T matching countries"` via `aria-live="polite"`. Clicking **`Clear filters`** restores all `250` countries at Page `1`.
   - `CountryCard` renders overflow-safe golden pills (`<= 2` currencies, `<= 3` languages + `+N more` link navigating straight to `/geography/[slug]` to inspect full country facts like Zimbabwe's 9 currencies & 16 languages).
2. **Country & Multi-Page Selection -> Tier 2 Quiz Sync (`Test in Quiz` & `Quiz this selection`):**
   - **`Quiz this selection` MUST draw eligible verified countries across the entire active filter result set** (e.g., all matching countries across pages 1..11, NEVER restricted to only the currently displayed 24 cards!).
   - **`Test in Quiz`** (card or `/geography/[slug]?country=...#quiz-module`) validates `verification.status === 'verified'` and non-disputed flags, loads the 3-step trio (`1. Capital -> 2. Currency -> 3. Language` in `SubQuestionStepper`), scrolls smoothly (`behavior: 'smooth'` or instant under reduced motion), and focuses `#quiz-module`.
3. **Tier 2 Answering, Completion & Celebration (`0b875c04.jpg` Flow Preserved):**
   - Option click locks prompt -> green + check (`+1 pt`) or red + cross (reveals true answer) -> `ExplanationBox` -> `"Next Question"` -> **`ScoreModal`** (`>= 70%` celebration confetti or static reduced-motion trophy badge, `"Retake"`, `"Next"`, `"Clear my progress"`).

### Flow E: PDF Library Discovery, Downloads & Corrections (`/library` -> `/library/resource/[slug]`)
1. **Filter & Sort (`/library` & `/library/[exam]`):** User filters by search text, Exam, Subject, Topic, Year, or Resource Type and chooses Sort (`Newest`, `Most Questions`, `Size`, `Title A-Z`). Filters sync to URL search params so shared links reproduce exact views.
2. **Download Interaction:** Clicking `Download PDF` initiates direct same-origin file download (`download` attribute on `<a href={pdf.filePath}>`). Zero interstitial signup popups or countdown timers.
3. **Archived Notice Handling:** When `pdf.status === 'archived'`, `/library/resource/[slug]` renders a top `"Archived Edition"` caution notice linking directly to the replacement slug when available.
4. **Mobile Sticky CTA:** On mobile (`< 768px`) when scrolling `/library/resource/[slug]`, the bottom sticky Download bar remains pinned cleanly until the footer CTA enters view (no overlapping clutter).
5. **Reporting Errors (`/corrections` or Country/PDF `"Report a correction"`):** Clicking pre-filled `"Report a correction"` links from `/geography/[slug]` or `/library/resource/[slug]` opens user's email client OR routes to `/corrections?ref={slug}` where `AcademicFeedbackForm` builds the structured `mailto:faculty@docmubashirchaudhary.com` URI + provides a `"Copy Email Body"` button in case desktop browsers lack a configured default mail client.

---

## 2. Form Validation, Feedback & Edge Cases

- **Client Forms Present:** `AcademicFeedbackForm` (`/corrections`) + Search/Filter controls. Zero auth/payment/login forms.
- **Validation Rules (`AcademicFeedbackForm`):**
  - `subjectReference`: Required string (>= 3 chars) naming the affected country, PDF, or MCQ.
  - `issueDetail`: Required explanation (>= 15 chars) describing the factual correction or broken resource.
  - Inline error alerts render directly beneath invalid inputs with `aria-describedby` + `role="alert"` on submit attempt without wiping entered text.
  - On valid submit: Opens `mailto:` URI AND displays explicit confirmation card with the formatted subject/body + `"Copy Message to Clipboard"` action so users without local mail apps are never stuck.
- **Loading / Empty / Error Summary Matrix:**
  - **Loading (`search-index` or lazy quiz slice):** Lightweight inline skeleton/spinner ONLY inside interactive slots while preserving initial static shell layout (`0` layout shift).
  - **Empty (filtered 0 hits or unpopulated hubs `/fpsc`, `/css-pms`, `/nts`):** Helpful `EmptyStateCard` explaining why it is empty + 1-click reset or jump links to active portals.
  - **Error (runtime exception or fetch failure):** `error.tsx` boundary offers `"Try Again"` (`reset()`) and `"Return Home"`; client fetch failure offers inline `"Retry Load"` button.

---

## 3. Backend Integration Points

- **Paginated APIs & Static Fallback (`src/lib/api.ts`):** `fetchCountriesPage()` consumes `GET /api/countries` (`24/page`, `/data/v1/geography/pages/page-{n}.json` fallback) for `/geography` Tier 1; `fetchQuestionsPage()` consumes `GET /api/questions` (`20/page`, `/data/v1/questions/pages/page-{n}.json` fallback) for `/mcq` & `/topics`.
- **Commission Branding & Subject Icons (`src/lib/branding/logos.ts`):** Consumes `branding.json` (`Logo.dev` CDN URLs with `fallbackMonogram`) and `subjects.json` (`iconName` / `iconUrl`) with zero layout shift (`width`/`height` reserved).
- **MiniSearch Index (`/data/v1/search-index/all.json`):** Consumed lazily by `HeroSearch`, `NavbarSearch`, and `/search` via `src/lib/search/engine.ts`. Emits `SearchHit` objects (`type`, `title`, `subtitle`, `url`, `badge`, `score`).
- **Quiz Generation & Verification Gating (`src/lib/quiz/` & `countries-quiz-v1.json`):** Every `"Test in Quiz"` and `"Quiz this selection"` action delegates question construction exclusively to pure domain helpers (`src/lib/quiz/`) enforcing `verification.status === 'verified'`, `!disputed[factType]`, accented Unicode normalization, and >= 3 valid distractors across the entire matching country filter pool.
- **Recruitment Status Filtering (`posts-ppsc.json`):** `Open`/`Closed` tabs filter against `RecruitmentPost.postStatus` enum (`'open' | 'closed' | 'upcoming' | 'archived'`).
- **Client Persistence (`src/lib/storage/persistence.ts`):** Wraps all reads/writes to `dmc:v1:geography-quiz` and `dmc:v1:mcq` with `manifest.datasetVersion` staleness checks and silent `Map` fallback in private/incognito browsers where `localStorage` throws quota/security exceptions.
- **Zero Fake POST Requests:** Error reports use `src/lib/feedback/mailto.ts` respecting `form-action 'self' mailto:` CSP.

