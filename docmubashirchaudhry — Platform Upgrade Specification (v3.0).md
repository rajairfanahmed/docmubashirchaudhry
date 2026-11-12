# docmubashirchaudhry — Platform Upgrade Specification (v3.0)

**Supersedes:** the v2.0 "JSON-based, database-free" architecture, specifically its permanent no-login, no-database, no-admin-dashboard rules. **Date:** 12 November 2026 **Status:** Owner-approved direction, ready for implementation

## 0. Why v3.0 Exists

v2.0 was built around three absolute rules: no login, no database, no admin panel. That model suits a pure reference and practice library, but it cannot support what the platform now needs: individual accounts, gated premium content, and visibility into who is using the platform and how.

v3.0 replaces those three rules. The open-access philosophy is not abandoned, it is narrowed. General content, meaning the Geography reference guide, country info, PPSC/FPSC exam hub pages, and static text, stays open to everyone with no login. Only two actions require an account: taking a quiz and downloading a PDF. Everything else from v2.0 stays as it is unless listed as changed below.

## 1. What Changes From v2.0

| Area | v2.0 | v3.0 |
| --- | --- | --- |
| Architecture | Static JSON, no backend | Static frontend plus a Supabase backend |
| Database | None | Supabase Postgres |
| Authentication | None, stated as permanent | Supabase Auth: Google OAuth and email/password |
| PDF storage | Public object storage, stable public URL | Cloudflare R2, private bucket, signed URLs per session |
| Quiz history | None, browser-only | Stored server-side per user, with a local fallback |
| Admin | None | Admin dashboard restricted to the owner's whitelisted account |
| Analytics | CDN aggregates only | CDN aggregates plus first-party tables for visits, attempts and downloads |
| Leaderboard | Not applicable | Private by default; each user sees only their own result, the admin sees all |

## 2. New Features

### 2.1 Authentication and Access Control

Supabase Auth handles two sign-in methods: Google OAuth and email and password with email verification. Public pages such as the homepage, the Geography reference guide, and the exam hub text pages need no login, matching the v2.0 promise for informational content. Only two actions are gated: starting any quiz and downloading any PDF, and the sign-in prompt appears right at that action rather than as a blanket wall on arrival.

The session is handled through Supabase's JWT, stored in an httpOnly cookie via Next.js middleware rather than localStorage, which reduces the risk of token theft through client-side scripts. Admin access is a single server-checked allow-list of admin emails; a separate roles table is not needed at this scale.

### 2.2 PDF Library and Upload

Upload happens only inside the admin dashboard. The admin picks a subject or exam tag, adds a title and description, and uploads the file, which already carries the owner's watermark before it ever reaches the platform.

Files live in a private Cloudflare R2 bucket; metadata such as title, subject, tags, file size, and upload date lives in a Supabase `pdf_resources` table. Logged-in users can browse the library freely, seeing titles, descriptions and file sizes, but the file itself streams only through a server route that checks the session and issues a signed URL valid for two to five minutes, generated fresh on every download click and never exposed in page source. Each successful download is logged to a `pdf_access_log` table with the user id, the PDF id and the timestamp. This closes the exact gap v2.0 left open on purpose for simplicity: permanent public links that anyone could hotlink or redistribute.

### 2.3 Quiz System

Two quiz types exist. A Practice Quiz is subject or topic filtered and untimed by default, in the same style as the existing Geography quiz. A Full-Length Mock Exam has a fixed question count and duration meant to simulate the real PPSC or FPSC paper, with a strict timer and auto-submit when time runs out.

Each quiz carries admin-configurable options set at creation: negative marking on or off with a configurable deduction such as minus 0.25 per wrong answer, a timer on or off with a set duration, and a language field so a question can carry both English and Urdu text without duplicating the quiz. The question bank is admin-authored through the admin panel and stored in a `quiz_questions` table with subject, exam tag, difficulty, correct option and explanation.

Every attempt is stored in `quiz_attempts` with the user id, quiz id, score, correct and incorrect counts, time taken and timestamp. A user sees their own attempt history and progress over time. There is no public leaderboard; only the admin dashboard aggregates everyone's scores.

### 2.4 Admin Analytics Dashboard

The route sits behind the admin email allow-list and is not linked anywhere in public navigation. The overview shows total registered users, total site visits by day, week and month, active users today, and quizzes attempted today. A users table lists sign-up method, join date, last active date, total quizzes attempted and average score. Quiz analytics show per-quiz attempt counts, average score, pass rate and the most commonly missed questions. PDF analytics show downloads per resource and per user, and the most downloaded resources. Site visits come from a lightweight first-party page-view table rather than a third-party analytics product, since the goal is usage trends for one admin rather than a full web analytics suite.

### 2.5 Security

Every PDF sits behind a signed, short-lived URL, so no permanent public file link ever exists. Admin and API routes check the session and the email allow-list on the server, never trusting the client alone. Cloudflare rate-limiting rules sit on the auth endpoints and the PDF-signing endpoint to blunt scripted abuse. Standard hardening carries over from v2.0: security headers, dependency scanning in CI, and no secrets in the client bundle. The owner's existing watermark on each PDF remains the first line of defense, with the signed-URL layer as the second.

### 2.6 Positioning and Content

The tagline used on the homepage and in the meta description reads: "Notes, MCQs, quizzes, practice material and other useful resources, all in one place for PPSC and FPSC aspirants."

The footer carries this credit block, set apart from the main footer links by a thin divider:

> Note: My views are personal and for academic debate only.
>
> Prepared and shared by Doc Mubashir Chaudhry. M.Phil. Biology, B.S. Botany, B.A., M.A. English, M.A. Political Science, Basic IT Course, B-Pharmacist, Philanthropist, Writer, Researcher, Career Counselor. FIA, PPSC, PERA, FPSC, CSS, PMS Mentor and Competitive Exam Educator. The University of Agriculture, Faisalabad.

The Countries module stays exactly as it is today; nothing here touches it.

## 3. Frontend Design

### 3.1 Design Direction

The visual direction follows Google's own product language: generous white space, soft elevation instead of heavy borders, rounded corners between 8 and 16 pixels, a restrained palette used with intent, and motion that confirms an action rather than performing for its own sake. The existing Emerald and Gold palette from v2.0 stays as the brand identity, green for trust and for Pakistan's national color, gold for correct answers and highlights, but it now runs through Material Design's elevation and spacing system instead of flat sections with thick borders. The closest references are Google Search's calm homepage, Google Classroom's card-based layout, and Material Design 3's component shapes and visible state layers for hover, press and focus.

### 3.2 Color System

| Token | Value | Use |
| --- | --- | --- |
| Primary | Emerald 700, #047857 | Actions, links, active navigation |
| Primary dark | Emerald 900, #064E3B | Headers, primary text on light backgrounds |
| Surface | White, #FFFFFF | Cards |
| Page tint | Emerald 50, #ECFDF5 | Page background |
| Accent | Gold | Highlighted answers, streaks, locked or premium badges only |
| Correct | #166534 with a check icon | Correct quiz answer |
| Incorrect | #B91C1C with a cross icon | Incorrect quiz answer |

Elevation uses three soft, diffuse shadow levels for resting, hovered and active or modal states, never a hard drop shadow.

### 3.3 Typography

The system sans stack carries over from v2.0 for Latin text, with Noto Nastaliq Urdu loaded only where Urdu text appears, such as Urdu quiz questions. Type follows a Google-style scale of display, headline, title, body and label sizes rather than ad hoc font sizes, kept consistent across every new page so the new features read as part of the same product rather than bolted on.

### 3.4 Navigation

The header places the logo on the left and primary navigation (Home, Geography, PPSC, FPSC, PDF Library, Quizzes) center or right, with a single Sign In button when logged out, replaced by an avatar and dropdown (My Attempts, My Downloads, Sign Out) once logged in. On mobile, a hamburger menu slides in from the right as a full-height overlay in the Material style, rather than a cramped dropdown.

### 3.5 Hero Section

The hero uses the photo of Doc Mubashir Chaudhry in a suit beside the "Justice, Integrity, Fairplay" wall with the PPSC logo visible, chosen because it signals the exam-prep and government-service context without needing extra explanation. The layout is an asymmetric Google-style hero: a left column with the headline, tagline and two buttons, Browse PDF Library and Try a Quiz, and a right column holding the photo in a rounded card with a soft shadow, not a full-bleed banner. The headline carries the agreed tagline from Section 2.6.

### 3.6 Homepage Sections

1. A quick-stats strip showing total PDFs available, total quizzes and total questions, as small Material-style chips rather than an overstated dashboard.
2. An exam hubs grid for PPSC, FPSC, CSS, PMS and NTS, each card carrying a relevant icon, such as a government-building icon for PPSC and a document-check icon for FPSC, a short description and a link into that hub.
3. A Countries and Geography module card, unchanged in function, restyled only to match the new card system around its existing two-tier Reference Guide and Interactive Quiz.
4. A latest-PDFs grid of four to six recent resources, each card showing title, subject tag, file size, a small lock icon when the visitor is not logged in, and a Download button that opens the sign-in prompt if needed.
5. A footer with standard link columns (Explore, Exams, About, Contact) and the credit note from Section 2.6 set in smaller type at the very bottom, separated by a thin divider so it reads as a formal attribution rather than crowding the main links.

### 3.7 PDF Library Page

A filter bar offers a subject or exam dropdown, a search box and a sort control (newest, most downloaded), all as Material-style chips and dropdowns with visible focus states. Each PDF appears as a card with a file-type icon, title, subject tag pill, file size, a download count visible to everyone to build trust, and a Download button. A visitor who is not logged in sees the button read "Sign in to download," which opens the auth modal instead of the file.

### 3.8 Quiz Experience

The quiz selection page shows a card per quiz with subject, question count, time limit where one applies, a small negative-marking tag such as "minus 0.25 per wrong answer" when enabled, and a difficulty tag. Taking a quiz keeps the existing single-question-per-screen pattern from the Geography quiz, four options in a grid that stacks on narrow screens, a progress stepper at the top, and for timed quizzes a countdown pinned top-right that shifts from green to amber to red as time runs low.

Answer feedback keeps the same pattern already approved for the Geography quiz: green and a check for correct, red and a cross for incorrect, with the explanation shown immediately below. A question with Urdu text renders right-to-left in Noto Nastaliq Urdu while the options stay numerically left-aligned. The results screen shows score, percentage, a correct and incorrect breakdown, time taken, an expandable "Review Answers" list, and two buttons, Retake and Back to Quizzes, with no public ranking, only a link to the user's own history.

### 3.9 Authentication UI

A modal, not a full page redirect, appears the moment a visitor tries to start a quiz or download a PDF: "Sign in to continue," a primary Google button with the standard Google "G" mark, a divider reading "or," then email and password fields with a toggle to create an account. After signing in, the visitor returns to exactly the action they started rather than landing back on the homepage.

### 3.10 Admin Dashboard

The admin area uses its own layout with no public navigation and a left sidebar (Overview, Users, Quizzes, Questions, PDFs, Site Visits), in the pattern of Google's own admin consoles such as Search Console. The overview page carries the stat cards from Section 2.4 above a simple line chart of visits over the last thirty days. The upload screen is a clean form with a drag-and-drop zone, subject and tag selectors, title and description fields, a thumbnail preview confirming the existing watermark, and a single Publish button. The quiz builder lets the admin add questions one at a time or import by CSV, toggle negative marking and the timer per quiz, toggle Urdu text per question, and see a live preview of exactly how the question will render to a student.

### 3.11 Icons

One consistent set, Lucide icons, matches the existing React and Next.js stack and Material's line-icon style closely: exam-specific icons for each hub card, a lock icon for gated content, a check and a cross for quiz feedback, a download arrow, an upload-cloud icon in the admin panel, a clock for timers, and a chart icon for analytics cards. No mixed icon styles and no emoji used as functional icons anywhere.

### 3.12 Animation

Framer Motion handles motion, kept restrained: page transitions as a 150 to 200 millisecond fade with a slight upward slide, card hover as a subtle elevation increase with the shadow growing and the scale moving from 1.00 to 1.02, quiz answer feedback as a quick color transition rather than a bounce, and timer color changes as a smooth transition rather than a jarring jump. `prefers-reduced-motion` is respected everywhere, carrying over v2.0's existing accessibility commitment, and there are no autoplay carousels, no parallax and no heavy scroll-triggered effects.

### 3.13 Responsive Behavior

The public site stays mobile-first, carrying over v2.0's 44-pixel touch target and single-column base rules. The admin dashboard works down to tablet width, with full desktop as its primary target since the owner will manage content mostly from a laptop.

## 4. Data Model (Supabase)

| Table | Key fields |
| --- | --- |
| profiles | id, email, auth\_provider, display\_name, created\_at, is\_admin |
| pdf\_resources | id, title, description, subject, exam\_tag, file\_key, file\_size, uploaded\_by, created\_at |
| pdf\_access\_log | id, user\_id, pdf\_id, downloaded\_at |
| quizzes | id, title, type (practice or mock), subject, exam\_tag, time\_limit\_seconds, negative\_marking, negative\_marking\_value, created\_by, created\_at |
| quiz\_questions | id, quiz\_id, text\_en, text\_ur, options, correct\_option, explanation |
| quiz\_attempts | id, user\_id, quiz\_id, score, correct\_count, incorrect\_count, time\_taken\_seconds, created\_at |
| site\_visits | id, path, user\_id (nullable), created\_at |

## 5. Open Items Before Build

1. Confirm the admin email or emails for the allow-list.
2. Confirm the default negative-marking value, minus 0.25 is the working assumption above.
3. Decide a retention period for `site_visits` and `pdf_access_log` so these tables don't grow without bound.
4. Final review of the exact wording and placement of the footer credit block.
5. Confirm the exact mock-exam specification per exam. The old PRD cites PPSC's Intelligence Officer paper as 100 marks and 90 minutes from secondary sources only; FPSC, CSS and PMS specs need the owner's own figures before a mock exam is built for each.

*End of v3.0 specification.*
