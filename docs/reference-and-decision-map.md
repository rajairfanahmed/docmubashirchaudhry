# Reference & Decision Map

> Evidence traceability matrix aligning the live **v3.0 DocMubashir Exam Portal** (`37` routes, Supabase Auth + Postgres, Cloudflare R2, Geography + Exam corpus) with the adopted **Frontend Redesign & UX Engineering Playbook** ([`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md)).
>
> **Legend:** `[PLAYBOOK]` Adopted Redesign Playbook (`Sections 0-20`) · `[REQUIREMENT]` Owner v3.0 functional rule · `[OBSERVED]` Direct codebase/asset check · `[CONFLICT RESOLUTION]` Intentional migration replacing superseded v3.0 visual choices.

---

## 1. Visual Assets & Brand Continuity

| Asset / Primitive | Observed Asset / Reality | Redesign Decision |
| --- | --- | --- |
| `public/images/mubashirchaudhry1 (3).jpg` | Doc Mubashir Chaudhry in dark suit beneath the PPSC circular emblem wall | **Retained (`/` Hero):** Framed cleanly inside a light-first split editorial hero (`aspect-[4/5]`), replacing the dark-green hero wall. |
| `public/images/mubashirchaudhry1 (4).jpg` & `(5).jpg` | Academic/institutional portraits (`"Justice Integrity Fairplay"`, flags) | **Retained (`/about`, optional `/ppsc`):** Authentic institutional provenance imagery without stock/AI replacements. |
| `src/components/branding/DmcLogo.tsx`, `public/icon.svg`, `public/favicon.svg` | Transparent pure geometric vector `DMC` emblem (no square/circle enclosure) | **Preserved Strictly:** Kept intact across Header, Admin Console, and favicons; adapts stroke cleanly with restrained `--color-brand-deep` (`#204638`). |
| `lucide-react` + `Logo.dev` | `lucide-react` v0.475.0 installed; CSP permits `img.logo.dev` | **Governed Icon/Mark Rule:** Lucide for UI icons (removed decorative-only card clutter, zero emojis); `Logo.dev` strictly for verified third-party domains - never DMC emblem or subject icons; text badges beat guessed logos. |

---

## 2. Key Conflict Resolutions & System Migrations

| Decision Area | Previous State (v3.0 Implementation) | Adopted Redesign Target (`Phase 1 - Phase 7`) | Source Tags |
| --- | --- | --- | --- |
| **Palette & Hero Surfaces** | Dark emerald `#0D4A28` / `#08331B` hero gradients, thick dark green strips, `#F0B938` gold card rails, 10 pastel subject pairs, `#FEF08A` fact pills everywhere | Light-first neutral editorial canvas (`--color-page: #F7F8F5`, `--color-surface: #FFFFFF`, `--color-surface-soft: #F0F2ED`, `--color-ink: #171C1A`, `--color-action: #19231D`, `--color-brand-deep: #204638`, selective `--color-accent: #D9F36A` / `#192116`). Semantic status tokens kept distinct (`#EAF5EE`/`#21633E`, `#FFF4D9`/`#79520B`, `#FCEDEC`/`#A3342E`, `#EAF1F8`/`#315D86`). | `[CONFLICT RESOLUTION]` `[PLAYBOOK §2.2-2.3]` |
| **MCQ Stage & Question Card** | Soft-mint `.mcq-sheet-surface` (`#E6F4F1`) with oversized circular `<svg>` arcs, redundant score pill + progress ring stacking | Calm, distraction-free study workspace on neutral `--color-surface` / `--color-page`. Remove decorative circular arcs and heavy mint washes; keep crisp `Question X of Y`, dominant stem, large accessible options, immediate inline explanation, and single clean progress indicator. | `[CONFLICT RESOLUTION]` `[PLAYBOOK §2.2, §6.4]` |
| **Card Borders, Pills & Tables** | Every card used `border-t-4` / `border-l-4`, dense golden pills inside `CountryCard`, nested cards, equal-weight status chips | Fine `1px` `--color-border: #E2E7E1`; reserve cards for distinct destinations/actions; switch dense facts (`/geography/[slug]`, `/ppsc/[slug]`, admin views) to scannable lists & `<dl>`/`<table>` tables; strip gratuitous badges/pills. | `[PLAYBOOK §1.4, §2.5, §5.4, §7.2-7.3]` |
| **Interaction Framework** | Mixed ad-hoc Tailwind buttons (`variant` + booleans) and CSS-keyframe modals | Explicit Material Design 3 behavioral contract (without stock MUI look): `5` clean button variants (`primary`, `secondary`, `tertiary`, `destructive`, `quiet`), focus-trapped accessible dialogs, consistent state matrix, keyboard/touch parity. | `[PLAYBOOK §3, §7]` |
| **Motion Stack** | Both `lenis` (`SmoothScrollProvider.tsx`) & CSS keyframes alongside `motion` (`^14.12.0`) | Standardize interactive state/presence transitions on `motion/react` (`LazyMotion` + `<MotionConfig reducedMotion="user">`) within `90-260ms` ease-out/ease-in budgets; remove forced smooth scroll (`lenis`), bouncy/confetti celebrations, scroll-triggered homepage sequences, and continuous timer pulsing. | `[PLAYBOOK §8]` `[OBSERVED]` |
| **Preserved Core Functional Behavior** | `37` routes, redirects, Supabase Auth + `AuthModal` action resumption, Cloudflare R2 signed URLs, Practice vs Timed Mock rules (`-0.25` neg marking, auto-submit), EN/UR/bilingual RTL, `/admin/*` allow-list isolation, SEO/noindex | **100% Untouched Business Logic:** Visual & UX improvements operate strictly above existing API contracts, route paths, URL params, local draft persistence, and database schemas. | `[REQUIREMENT]` `[PLAYBOOK §0]` |

---

## 3. Target Spec Matrix

- **Foundation:** [`visual-design.md`](./visual-design.md) · [`animations-motion-design.md`](./animations-motion-design.md) · [`frontend-architecture.md`](./frontend-architecture.md)
- **Layout & Components:** [`structural-layout.md`](./structural-layout.md) · [`ui-components.md`](./ui-components.md)
- **Workflows & Quality:** [`ux-interaction-design.md`](./ux-interaction-design.md) · [`responsive-design.md`](./responsive-design.md) · [`accessibility.md`](./accessibility.md) · [`performance-optimization.md`](./performance-optimization.md) · [`seo.md`](./seo.md)
- **Authoritative Guidelines:** [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) · [`DESIGN_BRIEF.md`](./DESIGN_BRIEF.md)
