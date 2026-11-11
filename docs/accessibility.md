# Accessibility Specification (Step 9 of 10)

> **Consumer Skill:** `09-accessibility` (Enhancement Phase - Run After Step 8 & Vercel Deploy)
> **Execution Status (2026-11-11):** Intentionally deferred until after GitHub push (`https://github.com/rajairfanahmed/docmubashirchaudhry.git`), Vercel deployment, and Step 8 (`/seo`).
> **Scope:** WCAG 2.2 Level AA conformance (AAA on golden answer highlights), semantic landmarks, keyboard navigation models (radiogroups, A-Z bar, modals, mobile drawer), screen-reader `aria-live` feedback, and visual contrast rules.
> **Token References:** Enforces hex contrast pairs locked in [`visual-design.md`](./visual-design.md) and reduced-motion safeguards in [`animations-motion-design.md`](./animations-motion-design.md).

---

## 1. Conformance Target & Contrast Verification Matrix

**Standard:** WCAG 2.2 Level AA across all interactive quiz, search, exam, geography, library, and policy routes.

### Verified Color Contrast Matrix
| Foreground / Surface Pair | Contrast Ratio | WCAG Rating | Applied Elements |
|---|---|---|---|
| `#78350F` Ink on `#FEF08A` Pill | **10.2 : 1** | **AAA** | Golden answer pills (`AnswerHighlight` on CountryCard, MCQ revealed correct badge) |
| `#0F172A` Slate-900 on `#FFFFFF` | **17.4 : 1** | **AAA** | Primary headings, question stems, option text, nav links |
| `#475569` Slate-600 on `#FFFFFF` / `#FAFBFC` | **7.6 : 1** | **AAA** | Secondary descriptions, file metadata, subtitles |
| `#64748B` Slate-500 on `#FFFFFF` | **4.7 : 1** | **AA** | Breadcrumbs, timestamps, `"Unanswered"` badge. **Rule:** Never use `#94A3B8` Slate-400 (`2.5:1`) for informative text! |
| `#FFFFFF` on `#0D4A28` (Forest) / `#08331B` (Dark) | **10.3 : 1 / 13.8 : 1** | **AAA** | Hero copy, active pagination pill, Forest primary buttons |
| `#0F172A` Slate-900 on `#F0B938` Gold | **9.9 : 1** | **AAA** | High-emphasis Gold CTA buttons (`Start Quiz`, `Retry Missed`) |
| `#065F46` Emerald-800 on `#ECFDF5` | **7.7 : 1** | **AAA** | Correct answer state, `"Verified"` badges |
| `#991B1B` Red-800 on `#FEF2F2` | **7.8 : 1** | **AAA** | Incorrect answer state, destructive error alerts |
| `#92400E` Amber-800 on `#FFFBEB` | **7.0 : 1** | **AAA** | `"Unverified"` caution badge & warning box on `/ppsc/[slug]` |

---

## 2. Keyboard Navigation & Focus Architecture

1. **Skip Link:** First focusable DOM element inside root layout: `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` jumping directly past Navbar and Standing Notice Strip into `<main id="main-content">`.
2. **Visible Focus Indicator (`focus-visible`):**
   - On light surfaces (`#FFFFFF` / `#FAFBFC`): `outline: 2px solid #0D4A28; outline-offset: 2px;`.
   - On dark green surfaces (`#0D4A28` / `#08331B` / `#051C0E`): `outline: 2px solid #F0B938; outline-offset: 2px;`.
   - Never apply `outline-none` without an equally visible `:focus-visible` replacement ring!
3. **MCQ & Geography Quiz Option Lists (A-D / A-E):**
   - Render inside semantic `<fieldset>` + `<legend>` (or `role="radiogroup" aria-labelledby="question-prompt-id"`), with real `<button type="button">` items carrying clear letter markers (`Option A: ...`) and explicit state indicators beyond color:
     - Correct selection renders **Check icon (`aria-hidden="true"`) + visible/SR text `"Correct answer"`** (`aria-pressed="true"`).
     - Incorrect selection renders **Cross icon + text `"Your selection - Incorrect"`**, while the true option marks itself `"Correct answer"`. (Meets WCAG 1.4.1 Use of Color).
4. **Search Autocomplete Combobox (`HeroSearch` & Navbar Search):**
   - Input uses `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`.
   - Supports `ArrowDown` / `ArrowUp` to move highlighted hit, `Enter` to navigate or submit `/search?q=...`, and `Escape` to collapse popover cleanly without clearing query.
5. **Overlays (`MobileDrawer` & `ScoreModal`):**
   - **Focus Trap:** Opening `ScoreModal` moves focus automatically to modal title / close button and traps `Tab` / `Shift+Tab` within modal controls; pressing `Escape` or dismissing restores focus precisely to the invoking control or quiz container header (`aria-modal="true" role="dialog" aria-labelledby="..."`).
   - Background scroll is locked safely (`overflow: hidden`) while `MobileDrawer` or `ScoreModal` is open, and background DOM carries `inert` or `aria-hidden="true"` when modal is active.
6. **Pagination Controls (`PaginationBar`) & MCQ Question Jumper (`[Prev] [1..N] [Next]`):**
   - Wrap inside semantic `<nav aria-label="Countries pagination">` / `<nav aria-label="Question navigation">` (separate landmark label from Breadcrumbs).
   - Mark the active page / active question button with `aria-current="page"` (or `aria-current="step"` on MCQ jumper), give numbered MCQ jumper buttons descriptive accessible names (`aria-label="Question 3, answered"` / `"Question 4, unanswered"`), enforce `min-h-[44px]` hit areas, and never expose correctness attrs on unanswered buttons.
   - `CircularProgressRing` (`X/N` answered on `/mcq/practice`): Pair an accessible `role="img" aria-label="X of N questions answered"` (or `aria-hidden="true"` on decorative SVG paired with `aria-live="polite"` text counter) so screen readers read accurate progress cleanly.

---

## 3. Screen Reader Announcements (`aria-live`) & Non-Color Cues

- **Filter & Pagination Counts (`/geography`, `/mcq`, `/library`, `/ppsc`):** Render a polite live region (`<div role="status" aria-live="polite" className="sr-only">`) updating cleanly on filter/page interaction: e.g. `"Showing 1 to 24 of 250 countries"` or `"Showing 14 countries in Asia"`.
- **Quiz Grading & Score Increment:** On option lock in `/mcq/practice` and `/geography` Tier 2, populate a polite `aria-live="polite"` status region announcing:
  - *"Correct! Your answer Islamabad matches. Score 4 of 10."*
  - OR *"Incorrect. You selected Tokyo; the correct answer is Kyoto. Explanation: ..."*
- **Non-Color Epistemic Indicators:** Every badge (`Verified`, `Unverified`, `Disputed`, `Archived`, `Platform recommendation, not official`) includes explicit visible icon + explicit visible text label (never rely strictly on colored dots or red/green borders alone).
- **Flags & Official Logos:**
  - Country flags carry descriptive alt attributes from `CountryEntity.flag.alt` (e.g., `"National flag of Pakistan"`).
  - Authority logos carry descriptive alt text `"Official emblem of Punjab Public Service Commission (PPSC)"` when linked cleanly inside labeled cards, or `alt=""` with visible heading inside the same interactive `<Link>` to avoid duplicate screen-reader echo.
- **Standalone Accessibility Statement (`/accessibility`):** Lists target conformance (WCAG 2.2 AA), keyboard navigation map (`Tab`, `Enter`, `Space`, `Escape`, `Arrows`), reduced-motion guarantees, and direct `mailto:faculty@docmubashirchaudhary.com?subject=Accessibility%20Feedback` contact link.

---

## 4. Backend Integration Points

- **Alt & Label Integrity (`geography/countries.json` & `questions/ppsc-samples.json`):** `CountryEntity.flag.alt` directly supplies alt attributes on `CountryCard` and `/geography/[slug]`; `QuestionSchema.options[].id` (`a..e`) and `correctOptionId` bind cleanly to accessible radio/button aria labels without exposing answer keys in the DOM before user selection!
- **Pre-Lock Answer Security Note:** Rendered HTML attributes on unanswered options MUST NOT place `data-correct="true"` or hidden labels inside the DOM until locked, preventing screen-reader users (and inspect-element spoilers) from hearing/reading the answer prematurely.
- **Disputed & Unverified Flags:** `Verification.status` (`'unverified'`) and `DisputedFlags.disputedNote` MUST expose native semantic `<aside aria-label="...">` or `<strong>` alert banners to screen readers automatically.

