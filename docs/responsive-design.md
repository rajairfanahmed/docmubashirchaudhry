# Responsive Design Specification

> Content-first responsive reflow across all `37` routes adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Section 12. Design around real content readability and ergonomics - never arbitrary device assumptions.

---

## 1. Required Verification Widths & Core Reflow Strategy

Every redesigned archetype, navigation drawer, dialog, card grid, quiz runner, and admin table must be visually and functionally inspected at all **six target widths**:

| Viewport Width | Category | Primary Verification Focus |
| --- | --- | --- |
| **`360 px`** | Small Mobile | Strict zero horizontal scroll (`scrollWidth <= innerWidth`), stacked filter controls, full wrapping of long country names, emails, filenames, and Urdu stems |
| **`390 px`** | Standard Mobile | Mobile drawer ergonomics, single-column thumb-friendly MCQ options, sticky mobile PDF bar clearance above Footer |
| **`768 px`** | Portrait Tablet | Responsive 2-column grid utilization (not stretched mobile cards), Admin sidebar collapse/drawer access, readable metadata rows |
| **`1024 px`** | Landscape Tablet / Small Laptop | Transition cleanly to desktop `Navbar`, `AdminShell` sidebar parity, aligned asymmetric grids |
| **`1280 px`** | Standard Desktop | Optimal `max-w-7xl` container proportions, balanced Homepage split hero, side-by-side Admin authoring forms |
| **`1440 px`** | Wide Desktop | Controlled whitespace & line length (`reading` / `narrow` prose containers never span unbounded width) |

---

## 2. Mobile-First Public Flows vs. Desktop-First Admin Console

- **Public Study Flows (Mobile-First):**
  - **Navigation:** Collapse desktop links cleanly before wrapping into two rows; slide-over mobile drawer keeps generous tap spacing and accessible `NavbarSearch` strip.
  - **Homepage Hero (`/`):** Stacks portrait cleanly below/beside headline on narrow viewports with reserved aspect ratio so the headline + Search + Primary CTAs appear immediately on first paint.
  - **Filters & Toolbars (`/geography`, `/library`, `/quizzes`, `/ppsc`):** Convert multi-column desktop filter bars into deliberate cleanly spaced stacked or collapsible mobile filter layouts rather than cramped horizontal inputs.
  - **Interactive Quizzes (`/mcq/practice`, `/geography#quiz-module`, `/quizzes/[slug]`):** 1-column large (`min-h-[52px]`) thumb-accessible option cards on mobile expanding cleanly to 2-column (`md:grid-cols-2`) on tablet/desktop; Urdu stems wrap comfortably without horizontal overflow or option key collision.
  - **PDF Resource Detail (`/library/resource/[slug]`):** Sticky bottom download action on `< md` (`StickyMobileDownloadBar`) hides automatically when the footer enters view (`IntersectionObserver`) and adds safe bottom padding so content and focused controls are never covered.
- **Admin Console (`/admin/*`, Desktop-First with Full Tablet/Mobile Usability):**
  - Desktop (`>= lg`) displays persistent left sidebar (`256px`) + data workspace side-by-side (`Questions` list + editor).
  - Tablet and phone viewports provide a collapsible menu bar and **never force a 7-column desktop table to crush or clip off-screen** - supply horizontal scroll wrappers with clear scroll indicators or stacked responsive card rows (`md:hidden` / `overflow-x-auto`).

---

## 3. Overflow & Text Wrapping Guards

- Apply `min-w-0`, `break-words`, and controlled truncation (`truncate` only where full text remains inspectable or in secondary subtitles) across long PDF titles, admin user email addresses, SHA-256 checksums (`break-all`), and multi-currency/multi-language country data (`CountryCard` overflow caps + structured detail tables).
- Avoid fixed pixel heights on text cards that clip resized text or multi-line Urdu calligraphy.
