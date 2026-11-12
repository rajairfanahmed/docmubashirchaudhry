# Accessibility Specification (`WCAG 2.2 AA` Baseline)

> Inclusive usability, keyboard navigation, focus containment, screen-reader semantics, bilingual Urdu RTL isolation, and touch-target standards adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Section 11.
>
> **Verification Rule:** Never claim full WCAG conformance on any flow until keyboard navigation, screen-reader semantics, and contrast ratios have been directly tested on the live build.

---

## 1. Structural Semantics, Contrast & Focus Visibility

- **Semantic Landmarks & Headings:** Preserve `<header>`, `<nav>`, `<main id="main-content">` (with first-focus skip link), `<footer role="contentinfo">`, one descriptive `<h1>` per page, and sequential heading levels (`<h2>` -> `<h3>` -> `<h4>`).
- **Universal High-Contrast Focus Indicators:** Never strip `:focus-visible` outlines (`outline: none` without replacement is banned). All interactive buttons, links, inputs, tabs, and options must display a crisp visible outline (`2px solid`, `2px` offset) meeting contrast on both light (`#F7F8F5` / `#FFFFFF`) and dark (`#171C1A` / `#19231D`) surfaces.
- **Verified Foreground / Background Contrast:** Check every approved palette token pairing in live UI (`--color-ink: #171C1A` and `--color-ink-secondary: #4E5952` on `#FFFFFF` / `#F7F8F5`; `--color-accent-ink: #192116` on `--color-accent: #D9F36A`). Never place `#D9F36A` or light mint text on white/off-white backgrounds.
- **Sticky Chrome Clearance:** Anchor sections (`#quiz-module`, headings) must use `scroll-margin-top` so jumping via URL hash or keyboard Tab never hides focus behind the sticky top navbar or sticky mobile PDF bar.

---

## 2. Touch Targets, Non-Color Status & Accessible Controls

- **Minimum Interactive Hit Area:** Maintain approximately `44 x 44 CSS px` interactive target size across buttons, MCQ options, pagination buttons, icon triggers, and drawer links.
- **Zero Color-Only Indicators:** Quiz answer verification, verification status badges, and countdown severity alerts must always combine color with a recognizable Lucide icon (`CheckCircle2`, `XCircle`, `AlertTriangle`, `Clock`) and explicit visible or `sr-only` text (`"Correct answer"`, `"Incorrect selection"`, `"Selected"`).
- **Accessible Naming & Form Binding:**
  - Icon-only buttons (`Menu toggle`, `Close dialog`, `Clear input`, `Edit`, `Delete`) always carry explicit `aria-label` (plus tooltip where appropriate).
  - Form inputs always pair `<label htmlFor>` + `aria-describedby` for helper text and error alerts (`aria-invalid="true"` + `role="alert"`).
  - Never rely solely on `placeholder` text for critical instructions.

---

## 3. Dialogs, Drawers & Live Announcements

- **Dialogs & Mobile Navigation Drawer:** Trap `Tab` / `Shift+Tab` inside open overlays, support `Escape` dismissal, lock background scroll cleanly, apply `inert` / `aria-hidden` to `#dmc-app-shell`, move focus logically into the dialog/drawer on open, and restore focus to the initiating trigger control on close.
- **Live Feedback Restraint:**
  - Use `aria-live="polite"` on `ToastProvider` and MCQ verification status updates so screen readers announce feedback cleanly.
  - **Mock Exam Countdown (`MockExamTimerBar`):** Never wrap ticking seconds inside `aria-live`. Expose current clock text on focus and emit `aria-live="polite"` announcements strictly at calm milestone thresholds (`half-time`, `25% warning`, `60s remaining`, and `time expired`).
- **Reduced Motion:** Enforce `<MotionConfig reducedMotion="user">` and `@media (prefers-reduced-motion: reduce)` across custom animations and progress rings.

---

## 4. Bilingual Urdu RTL & Bidi Text Isolation

- **Proper `dir` & `lang` Scoping (`BilingualQuestionStem`):** Wrap Urdu text strictly inside `<span dir="rtl" lang="ur" className="type-urdu bidi-isolate">` with comfortable `Noto Nastaliq Urdu` line height (`~2.0-2.1`) and generous legibility (`>= 18px`).
- **Strict LTR Isolation for Mixed Tokens:** Always isolate option letters (`A.`, `B.`, `C.`, `D.`), Latin technical words inside Urdu sentences, negative-marking decimals (`-0.25`), scores (`14 / 20`), and countdown clocks inside `<span dir="ltr">` (`unicode-bidi: isolate`) so signs and digits never invert side cleanly.
