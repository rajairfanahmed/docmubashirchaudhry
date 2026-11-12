# Animations & Motion Design Specification

> Hardware-accelerated **Motion for React** (`motion/react`) + crisp CSS transition specification adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Section 8. Motion serves orientation and clarity - never speed penalties or decorative excess.

---

## 1. Library Decision & Root Configuration

- **Installed Package Inspection (`package.json`):** The project already installs `"motion": "^14.12.0"` (`motion/react` with `<MotionConfig reducedMotion="user">` + `<LazyMotion features={domAnimation}>` in `src/app/providers.tsx`). Retain `motion` and never install a competing React animation runtime.
- **Native CSS First for Simple Hover/Focus:** Use lightweight CSS `transition-colors` / `transition-transform` (`120-180ms`) for button, link, border, and option focus/hover states instead of wrapping static UI in React motion components.
- **Smooth Scroll (`lenis` via `SmoothScrollProvider.tsx`):** Dynamically imported on the client (`import('lenis')`) with `respectReducedMotion: true`, sticky-header offset (`-76px`), and `[data-lenis-prevent]` isolation inside dialogs and drawers so modals scroll cleanly without blocking SSR or harming reduced-motion users.
- **Celebrate Without Confetti:** Retire `canvas-confetti` and any bouncing post-answer option animations; use calm spring-free cubic-bezier transitions, interactive tactile hover/tap feedback (`whileHover`, `whileTap`, `.track-card`, `.dmc-press`), and clear score/feedback cards instead.

---

## 2. Motion Principles

1. **Purposeful Only:** Motion must explain a state change, establish continuity, confirm an action, or improve spatial orientation (drawers, dialogs, question swaps, expanded explanations, active filter shifts, upload progress).
2. **Zero Blocking Delays:** Interface interactions (selecting an MCQ option, opening navigation, typing search, submitting an exam) must remain immediate; motion never delays a primary action.
3. **Resilient Baseline:** Every view remains 100% readable and functional with all non-essential motion disabled.
4. **No Gratuitous Element Animation:** Do not animate every card, section, icon, or text block merely because Motion supports it.

---

## 3. Canonical Duration & Easing Tokens

| Interaction | Duration Token | Curve / Implementation |
| --- | --- | --- |
| **Button / Icon Press** | `90 - 140 ms` | Subtle tactile press (`scale(0.985)`) via CSS `ease-out` |
| **Hover / Focus Transition** | `120 - 180 ms` | Border/surface color transition via CSS; subtle elevation lift only on truly clickable cards |
| **Menu / Popover (`AccountMenu`, search suggestions)** | `160 - 220 ms` | `m.div` `opacity` + `translateY(-4px -> 0)` (`ease-out` enter, `ease-in` exit) |
| **Dialog / Mobile Drawer (`AuthModal`, `ConfirmSubmitModal`, Nav Drawer)** | `180 - 260 ms` | Backdrop fade + content slide/scale (`0.98 -> 1`) via `AnimatePresence` |
| **Small Content Reveal (`ExplanationBox`, Accordion, Inline Alert)** | `160 - 220 ms` | Smooth opacity + crisp settle without layout thrashing |
| **Route / Page Content Transition** | `140 - 200 ms` | Optional light fade strictly if it adds zero navigation latency |
| **Quiz Question / Feedback Transition** | `120 - 180 ms` | Crisp opacity swap + instant semantic state border/icon fill (zero bounce) |

- **Easing Discipline:** Use calm ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`) for entrances and clean ease-in (`cubic-bezier(0.4, 0, 1, 1)`) for exits. **Strictly forbid elastic overshoot and large spring bounces** across study workflows.

---

## 4. Where to Use vs. Where NOT to Use Motion

### Approved Motion Surfaces
- Mobile navigation slide-over drawer and `AccountMenu` dropdown entry/exit.
- Modal dialogs (`AuthModal`, `ConfirmSubmitModal`, CSV import, destructive confirmations) via `AnimatePresence`.
- Small layout transitions inside filter strips, tabs, and expanding document details.
- Progress indicators (`CircularProgressRing`, PDF upload bar) where transition makes numeric change easier to perceive.
- Quiz question swap, instant answer verification state, and inline explanation reveal.
- Non-blocking `ToastProvider` notifications (`enter`/`exit`).
- Restrained card hover lift strictly on genuinely clickable interactive cards.

### Explicit Forbidden Patterns
- **Never** add large parallax scrolling effects.
- **Never** bypass `respectReducedMotion` or `[data-lenis-prevent]` modal isolation on smooth scroll.
- **Never** mount autoplay carousels or rotating hero banners.
- **Never** use large page-wide zooms, 3D flips, or spinning transitions.
- **Never** animate every homepage section sequentially into view (`whileInView` chains that lag scrolling).
- **Never** bounce MCQ options after selection or render confetti bursts.
- **Never** pulse or blink a countdown timer continuously across an entire mock exam.
- **Never** animate large hero photography or tables in ways that delay LCP or cause layout shift.

---

## 5. Performance & Reduced-Motion Accessibility Rules

- **GPU-Composited Properties Only:** Animate `transform` (`translate3d`, `scale`) and `opacity` (plus SVG `stroke-dashoffset`). Never animate `width`, `height`, `top`, `left`, or expensive multi-element `filter: blur()` on scroll.
- **List Capping:** Never animate or stagger long lists (`24` country cards or `100` admin rows) simultaneously.
- **Multi-Layer Reduced Motion Gate (`prefers-reduced-motion: reduce`):**
  1. Keep root `<MotionConfig reducedMotion="user">` active across every route.
  2. Use `useReducedMotion()` inside custom Motion components (`motion/react`) to remove directional travel, parallax, and continuous decorative motion cleanly (preserving simple instant state/opacity feedback).
  3. Maintain CSS `@media (prefers-reduced-motion: reduce)` fallbacks stripping `.dmc-press`, progress bar transitions, and pulse animations so no movement persists.
  4. Never autoplay media or animations when reduced motion is active, and verify behavior on narrower mobile viewports and lower-powered devices.
