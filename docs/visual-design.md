# Visual Design Specification (Step 2 of 10)

> **Consumer Skill:** `02-visual-design` (Foundation Phase - Run After Step 1)
> **Scope:** Complete color system with strict usage rules, exact golden answer-pill contrast standard, 10 subject tile pastels, typography families and scale, spacing rhythm, Material Design border/elevation depth, and iconography / official logo rules.
> **Token Architecture Reference:** Populates the variables declared in `src/app/globals.css` (configured in [`frontend-architecture.md`](./frontend-architecture.md)).

---

## 1. Visual Direction & Design Rationale

The visual language fuses **Material Design surface clarity and tactile interactive states** with the portal's institutional **Emerald & Gold academic identity**:
- **Neutral Paper Canvas (`#FAFBFC` / `#F8FAFC`)** keeps long-form exam preparation legible without glare.
- **Pure White Elevated Cards (`#FFFFFF`)** framed by subtle `1px solid #E2E8F0` hairlines and soft multi-layer shadows establish clear visual scan hierarchy.
- **Deep Forest Emerald (`#0D4A28` -> `#08331B`)** signals authoritative civil service rigor on hero banners, primary section bars, and the footer (`#051C0E`).
- **Warm Gold (`#F0B938` / `#FBBF24`) & Highlighter Yellow (`#FEF08A` + `#78350F` Ink)** turn high-yield answers, primary quiz CTAs, and active indicators into instant cognitive landmarks.

---

## 2. Color System & Usage Rules

### A. Brand & Surface Tokens
| Token Name | Hex Value | Usage Rule | Contrast Note |
|---|---|---|---|
| `--dmc-brand-forest` | `#0D4A28` | Primary brand buttons, active pagination fill, header accent logo part 1, quiz banner base | White text `#FFFFFF` (10.3:1 AAA) |
| `--dmc-brand-dark` | `#08331B` | Hero gradient end stop, dark strip backgrounds (`PreFooterCta`), focus ring depth | White text `#FFFFFF` (13.8:1 AAA) |
| `--dmc-brand-emerald` | `#116135` | Hero gradient start, secondary hover fills on dark containers | White text `#FFFFFF` (7.5:1 AAA) |
| `--dmc-brand-surface-dark` | `#093A1F` | Translucent dark metric boxes inside Hero (`#093A1F` / 80% + emerald border) | Off-white `#ECFDF5` |
| `--dmc-brand-footer` | `#051C0E` | Persistent global footer background | Slate/Emerald light links `#CBD5E1` (> 11:1) |
| `--dmc-accent-gold` | `#F0B938` | Primary high-emphasis CTA buttons (`Start Quiz`, `Attempt Free Mock Exam`), card left bar (`4px` solid), active hero search focus highlight, `Question N` uppercase eyebrows | Dark Slate `#0F172A` text (9.9:1 AAA). **Never** place white text on `#F0B938`. |
| `--dmc-accent-gold-hover` | `#D97706` / `#F59E0B` | Hover/pressed state for solid gold buttons and active dot pulse (`#F59E0B`) | `#0F172A` text |
| `--dmc-highlight-bg` | `#FEF08A` | **Mandatory background** for golden answer pills (Country Capital/Currency/Language facts, MCQ revealed correct answer pill) | **Paired exclusively** with `#78350F` |
| `--dmc-highlight-ink` | `#78350F` | **Mandatory text & icon ink** inside `#FEF08A` pills (overrides legacy `#854D0E`) | **10.2:1 contrast ratio** on `#FEF08A` (WCAG AAA) |
| `--dmc-surface-ground` | `#FAFBFC` | Main `<body />` and page canvas background | Primary ink `#0F172A` |
| `--dmc-surface-muted` | `#F8FAFC` | Nested band strips, table zebra headers, subtle secondary panels | `#334155` text |
| `--dmc-surface-card` | `#FFFFFF` | Cards (`CountryCard`, `PdfCard`, `ExamTile`, `QuestionCard`), Navbar surface | `#0F172A` primary ink |
| `--dmc-surface-mcq-sheet` | `#E6F4F1` / `#F0FBF8` | Outer pale-mint soft canvas wash exclusively wrapping `/mcq/practice` (`mcqs-design.png` sheet) | Decorative curved arcs `rgba(13, 74, 40, 0.08)`; paired white card `#FFFFFF` |
| `--dmc-mcq-heading` | `#14281D` | Deep forest question stem & ring gauge ink inside `/mcq/practice` (`mcqs-design.png`) | Crisp high contrast on `#FFFFFF` |
| `--dmc-ring-track` | `#E5E7EB` | Inactive track stroke for `/mcq/practice` circular `X/N` progress ring (`strokeWidth: 10-11px`) | Paired with `--dmc-brand-forest` active stroke |
| `--dmc-ink-primary` | `#0F172A` | Headings (`h1`-`h4`), question stems, card titles, form labels | 17.4:1 on `#FFFFFF` |
| `--dmc-ink-secondary` | `#475569` | Body descriptions, card subtitles, secondary tabular labels | 7.6:1 on `#FFFFFF` |
| `--dmc-ink-muted` | `#64748B` | Captions, file metadata, `"Unanswered"` indicator, breadcrumbs (`>= 4.7:1` on `#FFFFFF`) | Minimum readable gray `#64748B`; avoid `#94A3B8` for body copy |
| `--dmc-border-subtle` | `#E2E8F0` | Standard `1px` Material card outline, table rows, divider hairlines | Visual boundary against `#FAFBFC` |
| `--dmc-border-strong` | `#CBD5E1` | Input borders, inactive button borders, hover card outline emphasis | 3:1 UI boundary when paired with `#94A3B8` hover |

### B. Semantic, Epistemic & Quiz State Tokens
| State / Role | Background | Border | Text / Icon | Usage |
|---|---|---|---|---|
| **Verified Fact / Correct Option** | `#ECFDF5` | `#10B981` (`1.5px`) | `#065F46` (icon `#059669`) | Verified provenance badge, Tier 2/MCQ correct selection & checkmark, `"Open"` post badge, `"Free/Solved"` header check pills |
| **Incorrect Option** | `#FEF2F2` | `#EF4444` (`1.5px`) | `#991B1B` (icon `#DC2626`) | Locked wrong option (`X` icon) & correction alert panel |
| **Unverified Notice / Pending Check** | `#FFFBEB` | `#F59E0B` (`1.5px`) | `#92400E` (icon `#D97706`) | Top warning box on `/ppsc/[slug]` (`"Unverified"` badge until `verification.status === 'verified'`), `"Draft"`/`"Pending Verification"` notices |
| **Disputed Fact / Archived Item** | `#FFF7ED` (disputed) / `#F1F5F9` (archived) | `#F97316` / `#94A3B8` | `#9A3412` / `#334155` | Disputed capital/currency caution callout; `"Archived"` PDF banner (`library/resource/[slug]`) & Closed recruitment posts |
| **Editorial Plan Isolation** | `#EFF6FF` or `#F8FAFC` dashed | `#93C5FD` or `2px dashed #CBD5E1` | `#1E3A8A` (`Platform recommendation, not official` badge) | Strictly isolates `editorialTopicWeights` from the white/emerald-framed `Official Blueprint` block |

### C. Subject Taxonomy Pastel Tile Palette (`f0919006.png` Reference)
Used on Homepage Subject Quick Grid (5x2 on desktop), `/mcq` subject cards, and `/topics/[subject]/[topic]` icon squircles:
1. **General Knowledge & Geography:** Tile `#ECFDF5`, Icon Ink `#0D4A28` (`sub-gk`)
2. **Pakistan Affairs & History:** Tile `#DCFCE7`, Icon Ink `#15803D` (`sub-pak-studies`)
3. **Islamic Studies & Ethics:** Tile `#FEF3C7`, Icon Ink `#B45309` (`sub-islamic-studies`)
4. **Everyday Science:** Tile `#F3E8FF`, Icon Ink `#7E22CE` (`sub-everyday-science`)
5. **English Grammar & Vocab:** Tile `#DBEAFE`, Icon Ink `#1D4ED8` (`sub-english`)
6. **Urdu Literature & Grammar:** Tile `#FFEDD5`, Icon Ink `#C2410C` (`sub-urdu`)
7. **Basic Math & Mental Ability:** Tile `#FFE4E6`, Icon Ink `#BE123C` (`sub-math`)
8. **Basic Computer & IT:** Tile `#E0F2FE`, Icon Ink `#0369A1` (`sub-computer`)
9. **Sports & Physical Ed:** Tile `#FEF9C3`, Icon Ink `#A16207` (`sub-sports`)
10. **Past Papers & Mixed Sets:** Tile `#EDE9FE`, Icon Ink `#6D28D9` (mixed practice / library quick card matching the 10-tile visual grid symmetry)

---

## 3. Typography System

- **Font Stack:** `Plus Jakarta Sans` (`--font-jakarta`, weights `500`, `600`, `700`, `800`) for display/headings/UI labels paired with `Inter` (`--font-inter`, weights `400`, `500`, `600`) for body prose, tabular metadata, and long explanations. Loaded via `next/font/google` with `display: 'swap'`.
- **Tabular Numerals:** Apply `font-variant-numeric: tabular-nums` on all scores (`0 / 50`), file sizes (`2.51 MB`), dates (`2026-11-11`), question counters (`Question 1 of 20`), and Basic Scales (`BS-14`, `BS-16`).

### Type Scale (6 Concrete Steps + Micro Label)
| Token Role | Mobile -> Desktop Size (`clamp` or breakpoint) | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-hero` | `2rem` (`32px`) -> `2.75rem` (`44px`) | `800` ExtraBold | `1.15` | `-0.025em` | Homepage Hero `h1` only |
| `page-title` | `1.625rem` (`26px`) -> `2.125rem` (`34px`) | `800` ExtraBold | `1.2` | `-0.02em` | Interior page `h1` (`/geography`, `/library`, `/ppsc/[slug]`) |
| `section-heading` | `1.375rem` (`22px`) -> `1.75rem` (`28px`) | `700` Bold | `1.25` | `-0.015em` | Section headers (`Latest PDFs`, `Pakistan's Top Exam Authorities`, `Browse Subjects`) |
| `card-title` | `1.0625rem` (`17px`) -> `1.1875rem` (`19px`) | `700` Bold | `1.35` | `-0.01em` | Country name, PDF title, Post title, MCQ prompt stem |
| `body-base` | `0.9375rem` (`15px`) -> `1rem` (`16px`) | `400` Regular (`500` UI options) | `1.6` | `0` | Prose, MCQ options A-D, Pedagogical explanations (`max-width: 68ch` on prose pages) |
| `body-sm` | `0.875rem` (`14px`) | `500` Medium | `1.5` | `0` | Navigation links, card subtitle rows, golden answer pill value (`font-weight: 700`) |
| `label-micro` | `0.6875rem` (`11px`) - `0.75rem` (`12px`) | `700` Bold | `1.25` | `+0.06em` (`uppercase`) | Pill eyebrows (`QUESTION 1`, `PREPARE FOR`), verification badges, breadcrumbs |

---

## 4. Spacing, Radii & Material Surface Elevation

### Spacing Scale (4px / 8px Base Rhythm)
- `--dmc-space-1`: `4px` (tight badge gaps)
- `--dmc-space-2`: `8px` (icon-to-label gap, pill spacing)
- `--dmc-space-3`: `12px` (chip gaps, compact meta row)
- `--dmc-space-4`: `16px` (mobile horizontal padding, form field spacing, card grid gap on mobile)
- `--dmc-space-5`: `20px` (compact card inner padding)
- `--dmc-space-6`: `24px` (standard card inner padding on tablet/desktop, desktop grid gap)
- `--dmc-space-8`: `32px` (section header bottom margin)
- `--dmc-space-12`: `48px` (vertical section separation on mobile/tablet)
- `--dmc-space-16`: `64px` (major band separation on desktop)

### Border Radius Tokens (Matching Material Discipline + `38d65f1d`/`f0919006`/`0b875c04`)
- `--dmc-radius-pill`: `9999px` (golden answer pills, `Prepare For` / verification status chips, A-Z filter pills)
- `--dmc-radius-button`: `10px` (`0.625rem` - buttons, inputs, select dropdowns)
- `--dmc-radius-squircle`: `12px` (`0.75rem` - 44x44 / 48x48 pastel subject icon containers)
- `--dmc-radius-card`: `16px` (`1rem` - primary Material content cards, quiz module, seal cards)
- `--dmc-radius-modal`: `20px` (`1.25rem` - Results Modal, Mobile Drawer header)

### Material Elevation Hierarchy
- **Level 0 (`--dmc-shadow-none`):** Page ground (`#FAFBFC`), subtle inline filters, breadcrumbs.
- **Level 1 (`--dmc-shadow-1`):** `0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)` paired with `1px solid #E2E8F0`. Default state for Country, PDF, Exam, Subject, and Post cards.
- **Level 2 (`--dmc-shadow-2`):** `0 8px 20px -4px rgba(13, 74, 40, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)`. Card hover lift, sticky navbar scrolled state, sticky mobile PDF bar.
- **Level 3 (`--dmc-shadow-3`):** `0 20px 32px -8px rgba(8, 51, 27, 0.18), 0 8px 16px -4px rgba(15, 23, 42, 0.06)`. Results Modal (`ScoreModal`), search autocomplete popover, mobile drawer panel.

---

## 5. Imagery, Flags & Official Authority Seals

1. **Official Commission Logos (`Logo.dev` CDN in `AuthorityExamTiles`, `/exams`, hub headers):**
   - Render authentic commission logos from `exams.json` and `/data/v1/examinations/branding.json` (`src/lib/branding/logos.ts`) using `logoUrl` (`https://img.logo.dev/{domain}?token=pk_e4a3hiZuS9GaAmHepVmkcw&size=128&format=png&fallback=404` for verified domains `PPSC`, `FPSC`, `CSS / PMS`, `NTS`, `SPSC`, and `null` for `KPPSC`/`BPSC`).
   - Display inside clean white rounded containers (`#FFFFFF`, `border: 1px solid #E2E8F0`, `48x48px` or `64x64px` `object-contain` slot) with an `onError` handler swapping seamlessly to a high-contrast forest/slate `fallbackMonogram` badge whenever `logoUrl === null` or offline.
   - Mandatory visual caption below the strip: *"All examination authority seals remain property of their respective commissions and appear solely for candidate navigation and nominative reference. docmubashirchaudhry is strictly independent and unaffiliated."*
2. **Official Subject Icons (`subjects.json` / `SUBJECT_ICON_CATALOG`):**
   - Map `subject.iconName` (`Globe`, `Landmark`, `BookOpenCheck`, `FlaskConical`, `Languages`, `Feather`, `Calculator`, `Cpu`, `Trophy`) to Lucide React icons at `1.75px` stroke inside `40x40` / `44x44` pastel squircles, or render `subject.iconUrl` (`https://flagcdn.com/pk.svg` on Pakistan Affairs) framed cleanly when supplied.
3. **Country Flags (`CountryCard`, `/geography/[slug]`, Teaser):**
   - Render `country.flag.svgPath` inside a crisp bordered `4:3` or `3:2` flag frame (`border: 1px solid #CBD5E1`, `rounded-md`) using `https://flagcdn.com` or local static SVG paths, paired with text fallback (`country.flag.emoji`) if an external image fails offline.
3. **PDF Booklet Cover Thumbnails (`/library` & `/library/resource/[slug]`):**
   - If `PdfResource.thumbnailPath` exists, render high-contrast portrait `3:4` thumbnail with subtle page shadow.
   - When `thumbnailPath` is omitted (current v1 state), render a **deterministic Academic A4 Folio Cover** (`#0D4A28` top band with emerald crest, cream/white body with booklet title, `gradeLabel` badge e.g. `BS-14`, `"500+ Solved MCQs"`, and `"Verified PDF"` stamp) so cards never look broken.
4. **Iconography:** Lucide React (`1.75px` stroke default; `16px` inline, `20px` card tile, `24px` header actions). Zero inconsistent emoji icons for UI actions; Reserve emojis exclusively for `flag.emoji` data fallback.

---

## 6. Backend Integration Points

- **Visual Rendering Tied Directly to Backend States (`docs/backend/database-design.md`):**
  - `VerificationSchema.status` maps 1:1 to semantic token pairs:
    - `'verified'` -> Emerald verified pill (`#ECFDF5` / `#065F46`).
    - `'unverified'` -> Amber warning pill (`#FFFBEB` / `#92400E`) on `/ppsc/[slug]` (`posts-ppsc.json` and `blueprints-ppsc.json` start here until confirmed) and Country cards pending verification.
    - `'disputed'` -> Orange caution callout (`#FFF7ED` / `#9A3412`) showing `disputed.disputedNote`.
    - `'outdated'` -> Neutral slate warning.
  - `ContentLifecycleStatusSchema` (`'draft' | 'published' | 'archived'`): `'archived'` (`PdfResource.status === 'archived'` or `RecruitmentPost.postStatus === 'archived'`) renders desaturated slate headers (`#F1F5F9` / `#334155`) and muted border styling so candidates never mistake archived material for active cycles.
  - `Blueprint` Dual-Block Visual Boundary: `officialSections` renders inside an authoritative solid-bordered emerald-accented card; `editorialTopicWeights` + `editorialDisclaimer` renders inside a distinct dashed-slate/soft-blue card explicitly carrying a `"Platform recommendation, not official"` pill badge.
  - `Subject.accentHex` from `src/data/taxonomy/subjects.json` can annotate subtle top borders, while the tile surface background uses the standardized 10-token pastel palette above to preserve WCAG text legibility.

