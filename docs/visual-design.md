# Visual Design Specification

> Light-first **Refined Academic Editorial** visual language (2026) adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Section 2. Preserves real domain assets, typography clarity, and semantic accuracy while removing decorative visual noise.

---

## 1. Visual Direction & Anti-Patterns to Eliminate

### Creative Direction
- Contemporary, calm, light-first academic editorial design prioritizing hierarchy, proportion, whitespace, and reading endurance for long exam-study sessions.
- Inspired by restraint, crisp contrast, and selective lime/ivory/deep-ink balance - never copying external dashboards or flooding pages with accent color.

### What the Redesign Explicitly Moves Away From
Do **not** merely repaint green surfaces. Rebalance hierarchy and remove redundant ornamentation:
- **No** large solid emerald hero backgrounds as the default on public pages.
- **No** full-width dark-green divider strips around routine messages or quiz headers.
- **No** multiple competing greens within the same viewport.
- **No** gold used as a general-purpose brand accent (reserve amber/warning hues cleanly for warnings or rare explicit highlights).
- **No** 10 unrelated bright pastel colors across every subject tile and metadata chip (use a compact, low-saturation tint set only where semantic taxonomy genuinely helps).
- **No** thick colored top/left borders (`border-t-4`, `border-l-4`) stamped onto every card.
- **No** large mint gradient quiz panels with decorative circular arcs behind questions.
- **No** golden highlight pills wrapped around every capital, currency, language, or answer (`AnswerHighlight` abuse) - rely on crisp typography, definition lists, and clean tables first.
- **No** nested cards inside cards, identical 3-column card grids everywhere, floating shape clutter, or pill-shaped styling on nav items, filters, metadata, and buttons simultaneously.

---

## 2. Color System Foundation

Validate contrast for every foreground/background pairing in the live DOM and centralize values as CSS custom properties (`src/app/globals.css`) and token maps (`src/lib/tokens/visual-tokens.ts`). **Never scatter raw hex values inside components.**

### Canonical Design Token Table
| Token | Value | Role & Usage Rule |
| --- | --- | --- |
| `--color-page` | `#F7F8F5` | Main neutral light-first page canvas |
| `--color-surface` | `#FFFFFF` | Primary cards, dropdown menus, dialogs, form inputs |
| `--color-surface-soft` | `#F0F2ED` | Secondary grouping regions, subtle inset panels |
| `--color-surface-raised` | `#FBFCFA` | Quiet elevated surfaces and subtle headers |
| `--color-ink` | `#171C1A` | Primary headings, question stems, body copy |
| `--color-ink-secondary` | `#4E5952` | Supporting descriptions and secondary labels |
| `--color-ink-muted` | `#747F77` | Metadata and low-priority timestamps (never essential prose) |
| `--color-border` | `#E2E7E1` | Standard `1px` structural separators and card outlines |
| `--color-border-strong` | `#C8D0C8` | Input fields, table rules, focused divider contrast |
| `--color-brand-deep` | `#204638` | Restrained DMC brand/identity continuity |
| `--color-accent` | `#D9F36A` | Selective highlight & high-priority emphasis (key CTA, active tab/nav indicator, progress mark) |
| `--color-accent-ink` | `#192116` | High-contrast text/icons on `--color-accent` surfaces |
| `--color-action` | `#19231D` | Primary dark CTA button fill |
| `--color-action-hover` | `#29372F` | Primary CTA hover fill |
| `--color-success-bg` | `#EAF5EE` | Verified / correct feedback fill |
| `--color-success-ink` | `#21633E` | Verified / correct text & icons |
| `--color-warning-bg` | `#FFF4D9` | Caution / timer warning / unverified background |
| `--color-warning-ink` | `#79520B` | Warning text & icons |
| `--color-danger-bg` | `#FCEDEC` | Error / wrong answer / critical alert fill |
| `--color-danger-ink` | `#A3342E` | Error text & icons |
| `--color-info-bg` | `#EAF1F8` | Informational / editorial note background |
| `--color-info-ink` | `#315D86` | Informational text & icons |

### Strict Color Application Rules
1. Keep most of every viewport neutral (`#F7F8F5` / `#FFFFFF` / `#F0F2ED`) so typography and educational content lead.
2. Apply `--color-accent` (`#D9F36A` + `--color-accent-ink: #192116`) sparingly: never paint every card, badge, icon, or button lime.
3. **Never** render `#D9F36A` lime or pale mint text on white/near-white surfaces (fails WCAG legibility).
4. Keep semantic status hues (`success`, `warning`, `danger`, `info`) strictly independent from `--color-brand-deep` (`#204638`).
5. Never communicate quiz correctness, verification status, or timer severity via color alone - pair with explicit Lucide icons and text/SR labels.
6. **Dark Surfaces:** Reserve `#171C1A` / `#19231D` selectively for high-contrast anchors (footer, optional focused timer region, or isolated promotional strip when clearly justified). Keep headers, heroes, sections, and cards predominantly light.

---

## 3. Typography & Bilingual Urdu RTL Metrics

Retain existing Google Font families without unnecessary swaps:
- **Display & Headings:** `Plus Jakarta Sans` (`--font-jakarta`) - controlled weight (`600`–`700`, avoid extra-bold `800` on every heading) and tight tracking.
- **Body, Controls, Tables & Metadata:** `Inter` (`--font-inter`) - generous line-height (`1.6`–`1.65`) on long study pages.
- **Urdu Script (Conditional Load):** `Noto Nastaliq Urdu` (`--font-urdu`) applied strictly via `.type-urdu` / `.font-urdu` on `dir="rtl" lang="ur"` containers (`line-height: 2.0–2.1`) with `.bidi-isolate` (`unicode-bidi: isolate`) and `<span dir="ltr">` wrapping embedded Latin keys (`A.`–`D.`), numerals, and scores.

### Desktop Typographic Scale & Constraints
| Role | Desktop Range | Notes |
| --- | --- | --- |
| **Hero / Page Display (`H1` landing)** | `40 - 56 px` | Fluid `clamp()`, restrained weight `700` |
| **Page Title (`H1` inner pages)** | `32 - 42 px` | One clear `<h1>` per page |
| **Section Heading (`H2`)** | `22 - 28 px` | `1.25` line height |
| **Card / Resource Title (`H3`)** | `16 - 19 px` | Strongest text inside a card |
| **Body Copy** | `15 - 17 px` | Never shrink mobile body text below readable `15px` |
| **Supporting Text** | `13 - 14 px` | High-contrast `--color-ink-secondary` (`#4E5952`), never low-contrast grey |
| **Metadata** | `12 - 13 px` | Strictly secondary (file sizes, dates, counts) with `tabular-nums` |

- Minimize uppercase all-caps eyebrow text and small tracking-heavy micro-labels (`text-[10px] uppercase` noise).
- Keep font sizing consistent across sibling cards and table rows.

---

## 4. Layout, Spacing, Shape & Elevation

- **Spacing Scale:** `4px / 8px` systematic tokens across gutters, section rhythm, and card padding (`--dmc-space-1` through `--dmc-space-16`).
- **Modest Radius Hierarchy:**
  - Controls, inputs, checkboxes, small chips: `6px - 10px` (`--radius-button`)
  - Cards, tables, inset panels: `12px - 16px` (`--radius-card`)
  - Dialogs, drawers, featured sheets: `16px - 20px` (`--radius-modal`)
  - Reserve `9999px` pills for true compact status indicators rather than rounding every filter, nav link, and CTA into capsules.
- **Fine Borders & Selective Shadows:** Default to crisp `1px solid var(--color-border)` and subtle surface contrast (`#FFFFFF` vs `#F7F8F5` vs `#F0F2ED`). Apply elevation shadows only on dropdown menus, floating bars, dialogs, and active hovered interactive cards.

---

## 5. Imagery, Icons & Brand Identity Rules

- **Educator Photography:** Keep real local photographs (`public/images/mubashirchaudhry1 (3).jpg` framed neatly inside Homepage editorial hero; `(4).jpg` and `(5).jpg` for `/about`). Enforce explicit aspect ratios (`aspect-[4/5]` / `width` + `height`) to prevent CLS.
- **DMC Emblem (`DmcLogo`):** Preserve the transparent pure vector emblem (`public/icon.svg`, `public/favicon.svg`) with zero enclosing square or circle badge.
- **Iconography:** Use `lucide-react` consistently and purposefully; remove decorative icons on cards where they fail to improve scan recognition; **zero emojis** as functional UI icons.
- **Commission & Third-Party Logos:** Render official exam/commission marks only when verified (`ppsc`, `fpsc`, etc.); use crisp styled text badges rather than guessed seals. `Logo.dev` is permitted solely for verified external domains where it aids recognition - never for `DmcLogo`, generic UI icons, or subject categories, and strictly within API key & attribution rules.
