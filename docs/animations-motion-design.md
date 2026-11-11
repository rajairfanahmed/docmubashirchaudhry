# Animations & Motion Design Specification (Step 7 of 10)

> **Consumer Skill:** `07-animations-motion-design` (Enhancement Phase - Run After Step 6)
> **Scope:** Restraint-first, purposeful academic micro-interactions, GPU-composited transitions, `>= 70%` World Geography quiz celebration choreography, strict `prefers-reduced-motion` static fallbacks, and interruption behavior.
> **Token & State Dependencies:** Enhances static states defined in [`ui-components.md`](./ui-components.md) without modifying visual color tokens in [`visual-design.md`](./visual-design.md).

---

## 1. Motion Philosophy & Budget

Students preparing for competitive exams use the portal rapidly and repeatedly on mobile hardware. Motion MUST be **crisp, tactile, fast (`150ms - 320ms`), non-blocking, and strictly GPU-composited (`transform`, `opacity`)**:
- **Zero gratuitous scroll-jacking, parallax, or floating hero gimmicks.**
- **Allowed animated CSS properties ONLY:** `transform`, `opacity` (plus SVG `stroke-dashoffset` or CSS color transitions `background-color`/`border-color` on short 150ms button feedback). Never animate `width`, `height`, `top`, `left`, or layout `margin`/`padding`.

---

## 2. Specific Approved Motion Inventory

Every approved motion below specifies exact trigger, duration, easing, interruption handling, and mandatory `prefers-reduced-motion: reduce` fallback:

| Component / Interaction | Trigger | Motion Details (`no-preference`) | Interruption Handling | `prefers-reduced-motion: reduce` Fallback |
|---|---|---|---|---|
| **1. Card Hover Elevation (`CountryCard`, `PdfCard`, `ExamTile`, `SubjectQuickTile`)** | `:hover` / pointer enter | `transform: translateY(-2px)` + smooth shadow/border transition (`180ms cubic-bezier(0.2, 0.8, 0.2, 1)`) | Immediately reverses cleanly on pointer leave without overshoot | Zero `translateY`; crisp border color (`#0D4A28`) + background tint change only |
| **2. Button & Option Press Feedback (`Button`, MCQ Option A-D)** | `:active` press / select | Brief `transform: scale(0.985)` (`100ms ease-out`) settling cleanly when option locks | Immediately transitions to locked Emerald/Crimson state on click/Space | Instant visual color lock, zero scaling |
| **3. Live Bulletin Pulse Dot (`Hero` / `Status` / Active `Open` PPSC pill)** | Ambient loop (single subtle indicator max per screen) | `.pulse-dot` radial opacity & gentle `scale(1 -> 1.45 -> 1)` halo (`2s ease-in-out infinite`) | N/A | Static solid `#059669` dot (`animation: none`) |
| **4. MCQ / Quiz Explanation Reveal (`ExplanationBox`)** | Option click locks answer | Smooth fade + subtle slide (`opacity: 0 -> 1`, `translateY(-6px -> 0)`, `220ms ease-out`) | If user rapidly clicks `"Next Question"`, unmount/reset cleanly without lingering fade timers | Instant appearance (`opacity: 1`, `transition: none`) |
| **5. Tier 1 -> Tier 2 Smooth Scroll Jump (`Test in Quiz` / `Quiz this selection`)** | Button click | `element.scrollIntoView({ behavior: 'smooth', block: 'start' })` followed by focus shift to quiz heading | User manual touch/wheel scroll immediately cancels browser smooth scroll | `behavior: 'auto'` (instant clean jump + focus transfer) |
| **6. Mobile Navigation Drawer & Filter Panel** | Hamburger toggle / Search toggle | Slide-fade reveal (`opacity: 0 -> 1`, `translateY(-8px -> 0)`, `200ms cubic-bezier(0.16, 1, 0.3, 1)`) | Re-toggling before completion reverses immediately via CSS transition (`Escape` closes instantly) | Instant visibility toggle (`opacity: 1`, `transform: none`) |
| **7. Modal & Popover Entrance (`ScoreModal`, Search Autocomplete)** | Quiz completion / Query hits | Backdrop fade `160ms`; Dialog card `opacity: 0 -> 1` + `scale(0.96 -> 1)` (`220ms cubic-bezier(0.16, 1, 0.3, 1)`) | Pressing `Escape` or clicking `Retake` immediately unmounts and clears pending timers | Instant dialog mount (`opacity: 1`, `transform: none`) |
| **8. Geography Quiz Celebration (`>= 70%` Score in `ScoreModal`)** | Quiz ends with `Math.round((score / total) * 100) >= 70` | Lightweight GPU-composited emerald (`#10B981`, `#0D4A28`) & gold (`#F0B938`, `#FEF08A`) celebratory confetti burst (`1400ms` max, auto-terminating, max 28 lightweight CSS particles OR crisp Canvas overlay with `pointer-events: none` strictly inside modal header) | Auto-stops cleanly at `1400ms` OR instantly cancels if user clicks `Retake`, `Next`, or closes modal (`useEffect` cleanup) | **Zero particle motion.** Renders a crisp, high-contrast **Static Achievement Badge** (`Trophy` icon inside `#FEF08A` / `#F0B938` ring labeled `"70%+ Mastery Achieved"`) matching user spec verbatim |
| **9. Progress Stepper, Top Loading Bar & MCQ Circular Ring (`mcqs-design.png`)** | Next Question advance / `+1` point / route navigation | `transform: scaleX(progress)` (`250ms ease-out`) on linear bars; SVG `stroke-dashoffset` smooth arc transition (`250ms ease-out`) on `/mcq/practice` circular `X/N` ring; Lenis smooth scroll (`SmoothScrollProvider`) + non-blocking top loading bar (`TopLoadingBar`) + hamburger icon morph | Updates smoothly to new target fraction on rapid answers or navigation; cancels scroll cleanly on touch/wheel input | Instant `scaleX` / `stroke-dashoffset` jump (`transition: none`); instant scroll (`behavior: 'auto'`); instant menu toggle |

---

## 3. Global Reduced-Motion CSS Rule

Enforce a safety baseline in `src/app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .pulse-dot::after,
  .animate-celebration-particle {
    animation: none !important;
  }
}
```

And implement a tiny shared hook `useReducedMotion()` checking `window.matchMedia('(prefers-reduced-motion: reduce)')` inside interactive React components (`ScoreModal` confetti vs static badge, `scrollIntoView` behavior `'auto'` vs `'smooth'`).

---

## 4. Backend Integration Points

- **Question & Quiz Timing Independence:** All quiz scoring (`quiz-engine.ts`), option locking, and `dmc:v1:*` `localStorage` persistence happen **synchronously on state commit**, never waiting on animation `onAnimationEnd` callbacks so users clicking `"Next Question"` rapidly or testing with `prefers-reduced-motion` never lose points or drop state.
- **Zero Loading-Screen Delays:** Because `/data/v1/` data is static and small, never add artificial delay timers (`setTimeout`) before showing quiz cards or search results; show skeleton shimmer ONLY during genuine async network fetch of `/data/v1/search-index/all.json`.

