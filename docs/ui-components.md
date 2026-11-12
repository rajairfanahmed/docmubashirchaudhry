# UI Component Catalog & Redesign Standards

> Material Design 3 behavioral contract mapped onto DocMubashir's light-first academic visual language ([`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Sections 3, 6.4, and 7).

---

## 1. Material Design 3 Foundation & Shared Component Contract

Use Google Material Design 3 for usability, keyboard conventions, focus visibility, state matrices, tooltips, menus, tabs, segmented controls, chips, dialogs, snackbars, and progress feedback - **never** an unthemed stock MUI skin or heavy extra component library.

Every shared component in `src/components/ui/` and feature directories must explicitly define:
1. **Purpose & Expected Content**
2. **Semantic Variants & Sizes** (`primary`, `secondary`, `tertiary`, `destructive`, `quiet` - no giant boolean-prop combinations)
3. **Complete Visual State Matrix:** `default`, `hover`, `focus-visible`, `active / selected`, `disabled`, `loading`, `success`, `error`
4. **Keyboard Behavior & Accessible Name / ARIA Requirements**
5. **Responsive Behavior & Empty / Unavailable Fallback**

---

## 2. Core Primitive Standards

### 2.1 Buttons (`src/components/ui/Button.tsx`)
- **Explicit Hierarchy (`5` clear variants):**
  - `primary`: `--color-action` (`#19231D`) / hover `--color-action-hover` (`#29372F`) for the single dominant action in a section.
  - `secondary`: Neutral outlined card button (`--color-surface` + `--color-border-strong`) for valid alternative paths.
  - `tertiary` / `quiet`: Low-emphasis ghost/text actions (`Clear filters`, `Cancel`, secondary nav).
  - `destructive`: Semantic danger actions (`Delete Quiz`, `Delete PDF`, `Clear Data`) isolated inside danger zones or confirmation modals.
  - `accent` *(selective)*: `--color-accent` (`#D9F36A`) with `--color-accent-ink` (`#192116`) strictly for rare high-priority focus actions.
- **Constraints:** Stable `min-h-[44px]` height, generous wrapping padding on narrow mobile screens (never shrink label text), mandatory `aria-label` + tooltip on icon-only controls, explicit loading spinner locking double-submission (`aria-busy="true"`). Never place competing primary buttons side-by-side unless actions are genuinely equal priority.

### 2.2 Cards
- Title (`<h3>` / `<h2>`) must be the strongest text inside every card.
- Fine `1px` `--color-border` outlines and subtle `#FFFFFF` vs `#F7F8F5` contrast - **remove thick `border-t-4` / `border-l-4` accent bars everywhere**.
- Apply hover lift/border highlight **strictly** when the whole card is a navigation link or interactive button; if only a button inside is clickable, do not style the outer box as clickable.
- Keep card families consistent in padding and structure (`CountryCard`, `PdfResourceCard`, `QuizCatalogCard`, `ExamHubCard`, `PostCard`), omitting repetitive decorative icons inside headers.

### 2.3 Badges & Filter Chips
- **Badges:** Strict compact indicators for verification status (`verified`, `unverified`, `disputed`, `archived`), quiz mode (`Practice`, `Timed Mock`), or language (`Urdu`, `Bilingual`). Always pair semantic colors with readable text (never color dots alone).
- **Chips:** Strict interactive filter pills showing currently selected Exam/Subject/Type filters with crisp remove (`x`) / toggle states. **Do not put every country fact, year, byte count, and question total inside colored pills**; use plain aligned metadata rows and `<dl>` lists instead.

### 2.4 Inputs, Selects & Filters (`FormPrimitives.tsx`)
- Explicit persistent `<label htmlFor>` tags (never substitute `placeholder` for accessible/visible labels).
- Inline helper text and error text linked via `aria-describedby` and `aria-invalid`; always preserve typed user input after recoverable validation/API failures.
- Group filter controls visually with the catalog/table they filter, displaying removable active filters cleanly and collapsing gracefully into stacked mobile layouts.

### 2.5 Dialogs & Drawers (`Modal.tsx`, `AuthModal.tsx`, Mobile Nav Drawer)
- Reserve modals strictly for consequential confirmations (`ConfirmSubmitModal`, destructive deletes) or focused interruption-free flows (`AuthModal`).
- Implement `Escape` dismissibility, backdrop click dismiss, `Tab` focus trapping, background body scroll lock, `#dmc-app-shell` `inert`, and focus restoration to the opening trigger button.
- Protect modal forms (`QuizFormModal`, `AdminQuestionsClient`) against losing unsaved work on accidental outside clicks.

### 2.6 Tables & Pagination (`PaginationBar.tsx`)
- Admin and history tables (`AdminUsersClient`, `AdminQuizzesClient`, `AdminPdfsClient`, `AttemptsHistoryClient`, `DownloadsHistoryClient`) use clear `<thead>` `<th scope="col">` columns, aligned `tabular-nums` numbers, explicit row action buttons (`Edit`, `Delete`), and intentional horizontal scroll affordances or structured mobile row cards below `< md`.
- `PaginationBar` renders only when `totalPages > 1`, preserves active search/filter/sort query params across page changes, and announces current item range cleanly.

### 2.7 Toasts, Inline Alerts, Skeletons & Empty States
- **Toasts (`ToastProvider`):** Short non-blocking feedback (e.g., signed download started, draft cleared); **never** cram long error instructions or multi-line explanations into auto-dismissing toasts.
- **Inline Alerts:** Persistent validation errors, `401` sign-in gates, `403` access warnings, and network failures live inline near the affected action/panel with recovery actions.
- **Skeletons:** Content-shaped placeholders matching card/table geometry (`aria-busy="true"`), never resembling blank empty states.
- **Empty States (`EmptyStateCard`):** Explain cleanly *why* nothing is shown (empty database vs active filter vs missing query) and offer a single clear next step (`Clear filters`, `Browse Library`, `Return to Quizzes`).

---

## 3. Shared Quiz Runner & MCQ Design Grammar (`/mcq/practice`, `/geography#quiz-module`, `/quizzes/[slug]`)

Unify interaction rules across all interactive MCQ views while removing visual distraction:
- **Focus Stage:** Clean high-legibility white card on calm `--color-page` / subtle `--color-surface-soft` framing - **eliminate circular decorative SVG arcs and saturated mint backdrops**.
- **Dominant Question Stem:** Largest typography inside the card; `BilingualQuestionStem` enforces `dir="rtl" lang="ur"` and `.bidi-isolate` cleanly on Urdu strings while keeping numbers, `A.`–`D.` keys, and scores LTR.
- **Thumb-Friendly A–D Option Buttons (`min-h-[52px]`):** Crisp default, hover, keyboard focus, selected, correct, wrong, revealed correct, and locked `aria-disabled` states. Always include explicit Check/X icons + `sr-only` state text (never color alone) and crisp state transitions (zero post-answer bouncing animations).
- **Adjacent Explanation Panel:** Appears directly beneath options cleanly on mobile and desktop upon answer verification.
- **Navigation, Timer & Results Integrity:** Prev/Next/Jump controls preserve unsaved/answered selections cleanly; `MockExamTimerBar` pairs calm severity color transitions with text + icon milestone announcements (never pulsing every second); `ConfirmSubmitModal` prevents accidental early submit; `QuizResultsPanel` renders score, percentage, breakdown, elapsed time, and chronological review with zero public leaderboards.
