# DESIGN BRIEF: docmubashirchaudhary (Frontend Redesign & UX Engineering)

> Master design brief uniting the live **v3.0 DocMubashir Exam Portal** implementation (`37` App Router routes + Supabase/R2 backend) with the adopted **Frontend Redesign & UX Engineering Playbook** ([`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md)).
>
> **Status:** Adopted Project Redesign Standard - Executed sequentially across **Phase 0 -> Phase 7** without modifying backend contracts, data models, or route behavior.

---

## 0. Current Baseline & Audit Reference

Before applying visual or layout edits, all engineering work starts from observed repository facts:

1. **Installed Stack (`package.json`):**
   - Next.js `^15.2.0` (`next build`), React `^19.0.0`, Tailwind CSS `^4.0.9`, TypeScript strict (`tsc --noEmit`), Vitest `^5.1.0`, `motion` (`motion/react` `^14.12.0`), `lucide-react` (`^0.475.0`), `minisearch`, `zod`, `@supabase/ssr`, `@supabase/supabase-js`, `@aws-sdk/client-s3`.
   - *Motion Audit Note:* Confirm removal/replacement of legacy `lenis` (`SmoothScrollProvider`) and celebratory `canvas-confetti` where they conflict with Section 8 motion restraint rules, consolidating interactive React motion cleanly on `motion/react` + `<MotionConfig reducedMotion="user">`.
2. **Existing Visual Baseline vs. Redesign Target:**
   - Currently deployed (`src/app/globals.css`, `src/lib/tokens/visual-tokens.ts`): heavy `#0D4A28` / `#08331B` emerald heroes, full-width dark green dividers, gold border accents (`border-l-4`, `border-t-4`), `#FEF08A` pills across geography cards, 10 unrelated pastel subject categories, and soft-mint `.mcq-sheet-surface` circular arcs behind quiz cards.
   - **Adopted Redesign Shift:** Move to a **calm, light-first academic editorial system** (`--color-page: #F7F8F5`, `--color-surface: #FFFFFF`, `--color-surface-soft: #F0F2ED`, `--color-ink: #171C1A`, `--color-brand-deep: #204638` restrained identity, `--color-accent: #D9F36A` selective highlight with `#192116` ink, `--color-action: #19231D` crisp dark primary CTAs, clean fine `1px` `--color-border: #E2E7E1`, and distraction-free quiz workspaces free of decorative arcs).
3. **Preserved Core Assets (`public/images/`, `src/components/branding/DmcLogo.tsx`):**
   - Preserve the real Doc Mubashir Chaudhry portrait (`mubashirchaudhry1 (3).jpg` in Homepage Hero; `(4).jpg` / `(5).jpg` on `/about`).
   - Preserve the pure vector transparent `DmcLogo` (`public/icon.svg`, `public/favicon.svg`) with zero enclosing square or circle.
   - Keep Lucide icons as the single icon family and enforce strict `Logo.dev` verification/usage limits (third-party verified exam domains only).
4. **Authoritative Route & Data Inventory:**
   - All `37` routes, redirects (`/countries` -> `/geography`, `/ppsc/[slug]/blueprint` -> `/ppsc/[slug]`, `/css-pms/[track]` -> `/css-pms`), Supabase Auth + Action-Continuation Modal, R2 signed downloads, Practice/Mock quiz grading/auto-submit, EN/UR/bilingual RTL support, `/admin/*` isolation, and SEO indexation/noindex rules remain 100% preserved per [`frontend-architecture.md`](./frontend-architecture.md) and [`structural-layout.md`](./structural-layout.md).

---

## 1. Product Identity, UX Priorities & Access Clarity

- **Portal Name & Positioning:** `docmubashirchaudhry` (`https://docmubashirchaudhry.vercel.app`)
- **Tagline (Preserved Verbatim):**
  > `"Notes, MCQs, quizzes, practice material and other useful resources, all in one place for PPSC and FPSC aspirants."`
- **Five UX Priorities (Strict Precedence):** `1. Clarity` -> `2. Findability` -> `3. Confidence` -> `4. Efficiency` -> `5. Delight`.
- **Five-Second Rule:** Every route immediately answers: *Where am I? What is here? What is my primary next action? Is this open or sign-in protected?*
- **Consistent Scoped Access Messaging:** Open reading for Home, World Geography & 250 countries, Exam hubs, PPSC/FPSC guides, and catalog browsing; free sign-in clearly communicated upfront at Quiz Start and Watermarked PDF Download with instant action resumption.

---

## 2. Eight-Phase Implementation Plan (`Phase 0 -> Phase 7`)

| Phase | Focus Area | Primary Specs |
| --- | --- | --- |
| **Phase 0** | Complete repository & UX audit across all 37 routes + screenshots before styling edits | [`frontend-architecture.md`](./frontend-architecture.md), [`reference-and-decision-map.md`](./reference-and-decision-map.md) |
| **Phase 1** | Light-first visual foundation tokens (`#F7F8F5` / `#FFFFFF` / `#171C1A` / `#204638` / `#D9F36A` / `#19231D`), typography, spacing, radii, shadows, motion tokens | [`visual-design.md`](./visual-design.md), [`animations-motion-design.md`](./animations-motion-design.md) |
| **Phase 2** | Shared Material Design 3 UI primitives (Buttons with 5 explicit variants, Inputs, Badges/Chips, Cards, Breadcrumbs, Pagination, Alerts, Toasts, Skeletons, Dialogs, Drawers) | [`ui-components.md`](./ui-components.md) |
| **Phase 3** | Application shell: Public Navbar + mobile drawer, slim Trust notice, organized Footer + optional Pre-Footer CTA, Student Account menu, isolated `/admin/*` AdminShell | [`structural-layout.md`](./structural-layout.md), [`accessibility.md`](./accessibility.md) |
| **Phase 4** | Public page archetypes (`/` editorial hero, `/search`, `/geography/*`, `/exams/*`, `/ppsc/*`, `/fpsc`, `/css-pms`, `/nts`, `/topics/*`, `/library/*`, editorial/legal/status pages) | [`structural-layout.md`](./structural-layout.md), [`seo.md`](./seo.md) |
| **Phase 5** | High-interaction experiences (`/mcq`, distraction-free `/mcq/practice`, `/geography#quiz-module`, `/quizzes`, `/quizzes/[slug]`, `AuthModal` continuation, PDF gated downloads & sticky bar) | [`ux-interaction-design.md`](./ux-interaction-design.md), [`structural-layout.md`](./structural-layout.md) |
| **Phase 6** | Private student history (`/my-attempts`, `/my-downloads`) & Admin operational console (`/admin`, `users`, `quizzes`, `questions`, `pdfs`) | [`structural-layout.md`](./structural-layout.md), [`responsive-design.md`](./responsive-design.md) |
| **Phase 7** | Full cross-viewport visual QA (`360px`–`1440px`), task-based usability walkthrough, regression & automated test verification, CWV/a11y/build checks | [`responsive-design.md`](./responsive-design.md), [`accessibility.md`](./accessibility.md), [`performance-optimization.md`](./performance-optimization.md) |

---

## 3. Backend Integration & Traceability Ledger

All APIs remain unchanged:
- **Auth & Profile:** `/api/auth/{session,oauth,login,signup,callback,logout}`
- **PDFs & Downloads:** `/api/pdfs`, `/api/pdfs/[id]/download` (short-lived R2 signed URL)
- **Quizzes & Mocks:** `/api/quizzes`, `/api/quizzes/[id]/{start,check-answer,submit}`
- **Student History & Analytics:** `/api/me/{attempts,downloads}`, `/api/analytics/visit`, `/api/health`
- **Admin Operations:** `/api/admin/{pdfs,pdfs/[id],pdfs/upload-url,quizzes,quizzes/[id],questions,questions/[id],questions/import}`, `/api/admin/analytics/{overview,users,quizzes,pdfs,prune}`
- **Public Reference Corpus:** `ContentRepository`, `/api/countries`, `/api/questions`, `/data/v1/*`

**Complete Spec Index:**
- [`visual-design.md`](./visual-design.md) · [`structural-layout.md`](./structural-layout.md) · [`ui-components.md`](./ui-components.md)
- [`animations-motion-design.md`](./animations-motion-design.md) · [`ux-interaction-design.md`](./ux-interaction-design.md) · [`frontend-architecture.md`](./frontend-architecture.md)
- [`responsive-design.md`](./responsive-design.md) · [`accessibility.md`](./accessibility.md) · [`performance-optimization.md`](./performance-optimization.md) · [`seo.md`](./seo.md)
- [`reference-and-decision-map.md`](./reference-and-decision-map.md) · [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md)
