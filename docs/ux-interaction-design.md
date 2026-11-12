# UX & Interaction Design Specification

> User-first interaction rules, critical workflow continuity, plain-language error framework, and 13-state resilience matrix adopted from [`Platform_Frontend_Guidelines.md`](../Platform_Frontend_Guidelines.md) Sections 1, 9, and 10.

---

## 1. Product & UX Foundations

### 1.1 Five UX Priorities (Strict Order)
1. **Clarity:** Every route communicates what it is and the clearest next step without guessing.
2. **Findability:** Candidates locate PPSC/FPSC guides, countries, subjects, MCQs, PDFs, and personal logs rapidly.
3. **Confidence:** Verification status, source provenance, PDF byte size/edition/SHA-256, quiz timer/negative-marking rules, and access conditions are transparent upfront.
4. **Efficiency:** Core flows minimize clicks and redundant chrome.
5. **Delight:** Subtle motion and crisp proportions refine the interface without slowing down study sessions.

### 1.2 Five-Second Page Test & Plain-Language Rules
Every page header lets first-time visitors identify immediately: **Where they are**, **what content lives here**, **the primary action**, and **whether reading is open or requires sign-in**.
- Use explicit action copy (`"Download PDF"`, `"Start quiz"`, `"Review answers"`, `"Search countries"`, `"Clear filters"`), avoiding vague labels (`"Explore More"`, `"Your Journey"`).
- Never make an icon carry standalone meaning without visible text or an accessible label.
- Limit each section/card footer to one dominant primary CTA with visibly subordinate secondary actions.
- Communicate free sign-in conditions **before** starting a quiz or requesting a PDF (never ambush users after form work).
- Maintain consistent terminology across the site (e.g., clearly distinguish PDF Study Booklets vs Quizzes vs Timed Mock Exams).

### 1.3 Information Density Discipline
- Never shrink body/label font sizes or wrap every datum in pills just to squeeze facts together.
- Use labeled sections, bulleted lists, and `<dl>`/`<table>` grids for structured facts (`CountryProfile`, `PpscPostDetail`, `Admin*`); use cards only for distinct destinations/action units; show non-duplicative metadata lines.

---

## 2. Critical Interaction Workflows

### 2.1 Authentication & Exact Action Resumption (`AuthModal`, `AuthModalProvider`)
- Explain clearly why sign-in is requested right inside the modal header/context (`"Sign in to start..."` / `"Sign in to download..."`).
- Support Google OAuth (`/api/auth/oauth?provider=google&next=...`) and Email + Password login/signup (`/api/auth/login`, `/api/auth/signup`), showing verified-email instructions cleanly when email confirmation is required.
- Preserve entered email/name inputs cleanly across recoverable errors (`401`, network failure, `429`, unavailable OAuth).
- **Zero Lost Context:** Always resume the exact pending download or quiz launch cleanly on the initiating page (`onAuthenticated` callback / `next` relative path recovery) rather than kicking signed-in users back to `/`.

### 2.2 Gated PDF Download Flow (`GatedPdfDownloadButton`, `PdfDetailPanel`)
- Request temporary signed R2 URLs strictly via `GET /api/pdfs/[id]/download?mode=json`; never expose private bucket keys or permanent static hotlinks in client markup.
- Display immediate loading feedback (`Preparing link...`), then distinguish `401` (open `AuthModal` and resume), `429` (cooldown warning + retry option), `404`/`503` (unavailable/static fallback handling), expired links, and offline failures.
- Confirm `"Download started"` strictly after receiving a valid signed URL/download trigger; highlight archived notices and replacement editions on `/library/resource/[slug]`.

### 2.3 Quiz & Timed Mock Attempt Workflow (`QuizSessionRunner`)
- Upfront preview/header shows Practice vs Timed Mock mode, question count, time limit, negative marking (`-0.25`, etc.), language (`EN`/`UR`/`Bilingual`), and pass target before launch.
- Persist local quiz draft state resiliently during play; guard submission button against duplicate POST requests; show `ConfirmSubmitModal` highlighting unanswered items before final submit; ensure reliable deadline auto-submit.
- Present `QuizResultsPanel` cleanly with score, accuracy breakdown, time taken, chronological review, and private `/my-attempts` storage (zero public leaderboards).

### 2.4 Search & Filtering Synchronization
- Keep Search, Exam, Subject, Topic, Continent, Region, Letter, Sort, and Page synchronized cleanly in URL query parameters (`History.replaceState` / Next links) so browser back/forward from detail pages restores filters reliably.
- Distinguish `no query entered`, `query returned zero matches`, and `request failed`; prevent stale async responses via `AbortController`.

### 2.5 Admin Uploads & Content Editing
- Validate PDF extension/size (`<= 50 MB`), metadata fields, watermark confirmation checkbox, and question schema client-side cleanly while keeping server validation authoritative.
- Surface real upload progress percentage cleanly during direct browser-to-R2 `PUT`; retain entered metadata on error; provide cancel/retry actions safely; show specific row/column failure context on CSV question bulk imports.

---

## 3. Error Message Structure, 13 Required System States & Retry Rules

### Plain-Language Error Structure
Every UI error message follows three calm parts:
1. **What happened:** Plain, jargon-free statement (*"We couldn't load the PDF list."*).
2. **What the user can do now:** Actionable instruction (*"Check your connection and try again."*).
3. **Recovery control:** Visible button/link where retry is safe (*"Try Again"*, *"Sign In Again"*, *"Return to Library"*).
**Strict Security Hygiene:** Never render raw JavaScript stack traces, SQL/Postgres errors, internal UUID keys, or server environment secrets in UI alerts or toasts.

### All 13 Required Data & System States
Every data-driven component/route handles cleanly:
1. **Initial loading** (shape-matched skeleton, not empty message)
2. **Refreshing / revalidating** (subtle non-destructive opacity/spinner preserving existing items)
3. **Empty dataset** (zero records published yet)
4. **No search / filter results** (`Clear filters` recovery CTA)
5. **Invalid user input** (field-level `aria-invalid` + clear correction prompt preserving input)
6. **Authentication required (`401`)** (inline/modal sign-in prompt with continuation)
7. **Permission denied (`403`)** (calm access-restricted view with safe return navigation)
8. **Resource not found (`404`)** (`/not-found.tsx` / resource guidance)
9. **Rate limited (`429`)** (`Retry-After` cooldown messaging)
10. **Network disconnected / timeout** (offline/timeout recovery guidance + manual retry)
11. **Server unavailable (`503`)** (degraded notice without losing client draft/form work)
12. **Successful completion** (confirmation banner, score panel, signed link toast)
13. **Partial completion** (e.g., CSV bulk import reporting imported row count + failed row details)

### Safe Retry Discipline
- Auto-retry / offer one-click retry strictly for idempotent operations (`GET` fetches, signed download URL requests, search queries).
- **Never** automatically retry non-idempotent mutations (`quiz submit`, `quiz create`, `PDF publish`, `account creation`) unless explicit duplicate/idempotency protection guarantees safety.
