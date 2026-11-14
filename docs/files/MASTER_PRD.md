# Master Product Requirements Document

> Status: SCOPE-BASELINED (features drafted as PROPOSED, stack partly chosen by the owner, several contracts still OPEN)
> Version: 0.1
> Last updated: 2026-11-14
> Platform owner: Doc Mubashir Chaudhry
> Project contact and approver in this planning chat: rajairfana551@gmail.com

Status words used in all documents: `OPEN`, `PROPOSED`, `FINALIZED`, `ASSUMPTION`, `DEFERRED`, `OUT_OF_SCOPE`, `REVISED`. `FINALIZED` means the owner approved it in the planning chat. Details are in `DECISION_LOG.md`.

## 1. Executive Summary
- Product: docmubashirchaudhry, a free exam preparation platform at https://docmubashirchaudhry.vercel.app
- Vision: Notes, MCQs, quizzes, practice material and solved PDFs for PPSC and FPSC aspirants (also CSS, PMS, NTS, FIA, PERA) in one place, taught under the name of Doc Mubashir Chaudhry.
- Problem solved: Aspirants find scattered, unverified material. The owners cannot see who uses their platform, who attempts quizzes, or how people score.
- Target audience: Pakistani competitive exam candidates, mostly on phones.
- Primary value proposition: Free, ad-free study material from a named educator, with timed quizzes, scored results, and protected solved PDFs.
- Planning basis (FINALIZED, DEC-001): The owner asked that the platform be specified as a new platform from the list of features he described. The World Geography module is the one exception and stays as it is. Any existing code is treated as reference only, not as a source of requirements.
- Current readiness: SCOPE-BASELINED. Not implementation-ready. See section 13 and the DECISION_LOG open questions.

## 2. Problem and Opportunity
- Current situation (verified by viewing the live site on 2026-11-14): the live site shows a home page with the owner's photo, a Geography module with 250 country profiles, exam hub links, a PDF library whose downloads require sign-in, a quizzes hub showing 0 active quizzes, and footer links to My Quiz Attempts and My Downloads. Pages behind login, including any admin area, were not verified from outside.
- Owner statement (user-provided, not verified by me): apart from Geography, several features such as the admin page and the user portal are not yet built on the front end.
- User pain points (owner-stated): the owner wants to know who accesses the site, who uses it, who solves quizzes, what everyone scored, and how many people visit; wants to upload PDFs and create quizzes easily; wants the site and PDFs protected.
- Existing alternatives: general MCQ websites and social media groups. No evidence gathered here. No market figures are claimed.
- Cost of inaction: the owners stay blind to usage, and protected material stays exposed. No quantified figure is available (ASSUMPTION).
- Evidence note: user-provided facts are marked as such. No external market research was done for this document.

## 3. Goals and Success Measures
| ID | Goal | Metric | Target | Measurement method | Status |
|---|---|---|---|---|---|
| OBJ-01 | Owners know who is using the platform | Share of sign-ups and quiz starts that appear in the admin dashboard and notification inbox | 100%, visible within 60 seconds (target TBD by owner) | Automated test plus manual check | PROPOSED |
| OBJ-02 | Owners publish content easily | Time for an admin to upload and publish one PDF, and to create and publish one quiz | PDF under 5 minutes, quiz under 15 minutes for 20 questions (TBD) | Timed walkthrough with the owners | PROPOSED |
| OBJ-03 | Protect content and the platform | Unauthenticated access to protected PDFs; non-admin access to admin pages | 0 successful cases; non-admin always sees a 404 | Security tests in the test plan | PROPOSED |
| OBJ-04 | Geography keeps working | Existing Geography routes and 250 records unchanged | 100% of current Geography behavior retained; homepage card shows correct currencies and languages | Regression checks | FINALIZED |
| OBJ-05 | Stay free and ad-free | Ads, payments, paywalls | 0 | Release checklist | FINALIZED |
| OBJ-06 | Know how many people visit | Page views and unique visitors per day | Reported in the admin dashboard; tool OPEN (DEC-017) | Analytics tool | OPEN |

No traffic or user-count targets are set because no baseline exists. They stay `TBD` until 8 weeks of data exist.

## 4. Users and Roles
| ID | Role | Goals / jobs-to-be-done | Main permissions | Context / constraints |
|---|---|---|---|---|
| ROLE-01 | Visitor (not signed in) | Read exam hubs, study Geography, search, read about the educator | View open pages only | Mostly mobile, slow connections |
| ROLE-02 | User (signed in) | Take quizzes and mock tests, see own results and history, download PDFs, manage own profile | Own data only | Signs in with Google or email. The word is "user", never "student" (FINALIZED, DEC-006) |
| ROLE-03 | Admin | See all users and activity, create quizzes and questions, upload PDFs, receive notifications, block or unblock users | Everything in the admin area, no sub-roles (FINALIZED, DEC-005) | Two people now: the owner contact (rajairfana551@gmail.com) and Mubashir sir (email TBD). Admin is decided by verified email |

## 5. Product Scope
### MVP / P0 (FINALIZED, DEC-019)
FEAT-01 Home with owner photo and headline. FEAT-02 Exam hubs including PPSC posts and blueprints. FEAT-03 World Geography (kept). FEAT-04 Search. FEAT-05 About page and footer note. FEAT-06 Sign up and sign in. FEAT-07 User profile. FEAT-08 Taking quizzes. FEAT-09 Full-length mock tests. FEAT-10 Results and attempt history. FEAT-11 PDF library. FEAT-12 My downloads. FEAT-13 Admin sign-in and protection. FEAT-14 Admin dashboard with storage bar. FEAT-15 Admin user list and user detail. FEAT-16 Admin quiz and question creation, import, publish. FEAT-17 Easy PDF upload. FEAT-18 Notifications. FEAT-21 Security hardening. FEAT-22 Homepage country card fix.

Added by me from the owner's feature list and not yet approved (PROPOSED): FEAT-30 Topic-wise MCQ practice at `/mcq` and `/topics`. Whether it is open or login-gated is OPEN (DEC-023).

### Later phases / P1 (FINALIZED, DEC-019)
FEAT-19 Admin activity log. FEAT-20 Site visit counts. FEAT-23 Block or suspend a user. FEAT-24 User deletes own account. FEAT-25 Report a wrong question. FEAT-26 CSV export of users, attempts and scores. FEAT-27 Weekly database backup. FEAT-28 Site-down alert. FEAT-29 Download volume flag for admins (PROPOSED, not yet approved).

### Explicitly out of scope
Advertisements, payments or paywalls, download limits (DEC-009), retake limits (DEC-009), public leaderboard (DEC-007), WhatsApp notifications, sign-in methods other than Google and email (DEC-003), admin sub-roles (DEC-005).

### Deferred
Certificates, Urdu interface menus (questions can be Urdu; the site menus stay English), WhatsApp.

### Assumptions and open decisions
See section 13 and `DECISION_LOG.md` (open questions OQ-01 to OQ-12).

## 6. Core User Journeys
**J-01 Visitor becomes a user.** Visitor opens a quiz or taps Download PDF, a sign-in dialog opens, visitor continues with Google or email and code, accepts Privacy and Terms, and returns to the same page. Alternate: email already registered shows "Sign in instead". Failure: wrong or expired code shows a plain message with a new-code button. Blocked user sees a message with the contact email.

**J-02 User takes a quiz.** User opens Quizzes, picks a quiz, reads the rules (time, marks, negative marking if any), starts. The timer runs, answers save as the user goes, the user can leave and resume, submits or the time runs out and it auto-submits. Result shows score, correct, wrong, unanswered, percent, and every answer with the explanation. The attempt appears in My Attempts. Retake is always allowed.

**J-03 User downloads a PDF.** Signed-in user opens the library, finds a booklet, taps Download, receives a copy stamped with the user's name, email and an access ID. The download appears in My Downloads and in the admin log.

**J-04 Admin creates and publishes a quiz.** Admin writes questions one by one or imports a CSV or JSON file (English, Urdu or mixed), builds a quiz from the questions, sets time, marks and negative marking, previews, publishes.

**J-05 Admin uploads a PDF.** Admin picks the file, fills the details, the file goes to private storage, checks run, admin publishes. The storage bar updates.

**J-06 Admin follows activity.** A bell notification and an email arrive when a user registers. A daily summary email lists who joined quizzes. Admin opens the dashboard, user list, user detail and participation view, and can block a user.

## 7. Functional Requirements
| ID | Requirement | Feature ID | Priority | Acceptance IDs | Status |
|---|---|---|---|---|---|
| FR-01 | Public pages render without sign-in | FEAT-01..05, 22, 30 | P0 | AC-001 | FINALIZED |
| FR-02 | Sign up and sign in with Google or email plus verification code only | FEAT-06 | P0 | AC-002, AC-003 | FINALIZED |
| FR-03 | Sign-up requires accepting Privacy and Terms | FEAT-06 | P0 | AC-002 | FINALIZED |
| FR-04 | Signed-in identity is mirrored into the database and updates on change | FEAT-06 | P0 | AC-004 | PROPOSED |
| FR-05 | User can view and edit own profile | FEAT-07 | P0 | AC-005 | PROPOSED |
| FR-06 | Quizzes need sign-in; each quiz has its own timer, marks and optional negative marking | FEAT-08 | P0 | AC-006, AC-007 | FINALIZED |
| FR-07 | Questions and options can be English, Urdu or mixed and display correctly right to left | FEAT-08, 16 | P0 | AC-008 | FINALIZED |
| FR-08 | Attempt can be resumed, auto-submits when time ends, can be retaken without limit | FEAT-08, 09 | P0 | AC-007, AC-009 | FINALIZED |
| FR-09 | Full-length mock tests with sections and a question navigator | FEAT-09 | P0 | AC-010 | PROPOSED |
| FR-10 | Result with explanations and saved history; scores private to the user and admins | FEAT-10 | P0 | AC-011 | FINALIZED |
| FR-11 | PDF download needs sign-in, serves a stamped copy, logs the event | FEAT-11, 12 | P0 | AC-012, AC-013 | FINALIZED (scope), PROPOSED (mechanism) |
| FR-12 | Admin area is reachable only by verified admin emails; others get a 404 | FEAT-13 | P0 | AC-014 | FINALIZED (rule), PROPOSED (safeguards) |
| FR-13 | Dashboard shows users, attempts, downloads, visits and R2 storage used | FEAT-14, 20 | P0 | AC-015, AC-016 | FINALIZED |
| FR-14 | Admin sees every user's details and quiz participation and scores | FEAT-15 | P0 | AC-017 | FINALIZED |
| FR-15 | Admin creates quizzes and questions, imports files, publishes | FEAT-16 | P0 | AC-018, AC-019 | FINALIZED |
| FR-16 | Admin uploads PDFs easily and publishes | FEAT-17 | P0 | AC-020 | FINALIZED |
| FR-17 | Notification for a new user and for quiz joins (bell and email) | FEAT-18 | P0 | AC-021, AC-022 | FINALIZED |
| FR-18 | Security controls in `BACKEND_PRD.md` section 8 | FEAT-21 | P0 | AC-023 | PROPOSED |
| FR-19 | Geography module unchanged; homepage card shows correct values | FEAT-03, 22 | P0 | AC-024 | FINALIZED |
| FR-20 | Footer shows the owner's note and credentials exactly as given | FEAT-05 | P0 | AC-025 | FINALIZED |
| FR-21 | Admin can block and unblock a user; blocked users cannot sign in to use protected features | FEAT-23 | P1 | AC-026 | FINALIZED |
| FR-22 | Activity log, account deletion, wrong-question reports, CSV export, weekly backup, down alert | FEAT-19, 24..28 | P1 | AC-027..AC-031 | FINALIZED |

## 8. Non-Functional Requirements
| ID | Category | Requirement / target | Verification | Status |
|---|---|---|---|---|
| NFR-01 | Performance | Public pages: LCP 2.5 s or less on a mid-range phone on 4G; targets for quiz and admin pages TBD | Lighthouse and field data | PROPOSED |
| NFR-02 | Availability | Target TBD; depends on the hosting plans actually in use | Uptime monitor | OPEN |
| NFR-03 | Security | Controls in `BACKEND_PRD.md` section 8; no critical or high finding open at launch | Review and tests | PROPOSED |
| NFR-04 | Privacy | Collect only name, email and activity needed; privacy notice and Terms before launch; legal review of Pakistani data-protection duties | Legal check | OPEN |
| NFR-05 | Accessibility | WCAG 2.2 AA for public and user pages; admin to the same standard | axe plus manual | PROPOSED |
| NFR-06 | Compatibility | Last 2 versions of Chrome, Safari, Firefox, Edge; Android Chrome | Browser matrix | PROPOSED |
| NFR-07 | Localization | Urdu question text with right-to-left layout and a suitable Urdu font | Visual and manual test | FINALIZED |
| NFR-08 | Data safety | Weekly database backup kept outside the database host; restore tested | Restore drill | FINALIZED |
| NFR-09 | SEO | Public pages indexable; user and admin pages noindex | Crawler check | PROPOSED |
| NFR-10 | Maintainability | Typed code, shared validation schemas, automated tests per `implementation-plan.md` | CI | PROPOSED |

## 9. Full-Stack Technology Decisions
### Frontend stack
- Framework: Next.js with React and TypeScript, App Router (ASSUMPTION: seen in an older snapshot of the project and on the live site; confirm against the deployed code). DEC-004.
- Styling and components: custom Material-inspired component set, Tailwind CSS (ASSUMPTION). Icons: Material Symbols Rounded as SVG (PROPOSED). Motion: the Motion library (formerly Framer Motion) used lightly (PROPOSED, DEC-016).
- Urdu text: a Nastaliq or Naskh web font loaded only on pages with Urdu (PROPOSED).

### Backend stack
- Next.js route handlers on Vercel serverless functions (PROPOSED). No separate backend service.
- Validation: Zod schemas shared with the frontend (PROPOSED).
- Scheduled work: Vercel Cron for the daily summary and quiz-timeout sweep; GitHub Actions for the weekly backup (PROPOSED; plan limits must be verified, OQ-06).

### Database and data access
- Supabase Postgres (FINALIZED by the owner). All browser requests go through our server; the browser never talks to the database directly; Row Level Security stays on with no public policies (PROPOSED).
- Data access layer: Supabase client on the server, no ORM (PROPOSED).

### Authentication and authorization
- Clerk, with Google and email plus verification code only (FINALIZED). Custom branded sign-in dialog (FINALIZED from owner's feature list).
- Admin decided by verified email against a list kept in a Vercel environment variable (PROPOSED, DEC-020). 2-step verification required for admins (PROPOSED).

### Storage, cache, jobs and real-time
- Cloudflare R2 private bucket for PDFs (FINALIZED). No public URLs.
- No cache layer or queue. Bell updates by polling the server (PROPOSED). No real-time channel.

### External integrations
- Clerk (webhooks), Supabase, Cloudflare R2, an email service (OPEN, DEC-018), an analytics tool (OPEN, DEC-017), an uptime monitor (OPEN).

### Hosting, deployment, and operations
- Vercel, https://docmubashirchaudhry.vercel.app (owner-provided). Environment keys for Clerk, Supabase and R2 are already set in Vercel (owner-provided; not verified by me). Plan terms and limits to be verified (OQ-06).

### Rationale and trade-offs
The owner chose Clerk, Supabase and R2. A single Next.js app keeps the system small for a two-person team. Trade-offs: serverless time and memory limits affect PDF stamping (risk R-04); free plans have limits and, for Supabase, no automatic daily backups and a pause after inactivity (verified from public pricing pages on 2026-11-14 for Supabase; to be re-checked at the time of build).

## 10. Feature Traceability Matrix
| Feature ID | Feature | Frontend UI IDs | Backend capability / API IDs | Data IDs | Acceptance IDs | Priority | Status |
|---|---|---|---|---|---|---|---|
| FEAT-01 | Home | UI-001 | none (static content) | none | AC-001 | P0 | PROPOSED |
| FEAT-02 | Exam hubs and PPSC posts | UI-002..UI-006 | none (content files) | DATA-16 | AC-001 | P0 | PROPOSED |
| FEAT-03 | World Geography (kept) | UI-007 | none (kept as is) | DATA-17 | AC-024 | P0 | FINALIZED |
| FEAT-04 | Search | UI-008 | none (index file) | DATA-16, 17 | AC-001 | P0 | PROPOSED |
| FEAT-05 | About and footer | UI-009, UI-030 | none | none | AC-025 | P0 | FINALIZED (footer) |
| FEAT-06 | Sign up and sign in | UI-010 | API-01, API-02 | DATA-01, 14 | AC-002..004 | P0 | PROPOSED |
| FEAT-07 | User profile | UI-011 | API-02, API-03 | DATA-01 | AC-005 | P0 | PROPOSED |
| FEAT-08 | Taking quizzes | UI-012..UI-015 | API-05..API-10 | DATA-02..07 | AC-006..009 | P0 | PROPOSED |
| FEAT-09 | Full-length mock | UI-014 | API-05..API-10 | DATA-02..07 | AC-010 | P0 | PROPOSED |
| FEAT-10 | Results and history | UI-015, UI-016 | API-11, API-12 | DATA-06, 07 | AC-011 | P0 | PROPOSED |
| FEAT-11 | PDF library | UI-017, UI-018 | API-13..API-15 | DATA-08, 09 | AC-012, 013 | P0 | PROPOSED |
| FEAT-12 | My downloads | UI-019 | API-16 | DATA-09 | AC-013 | P0 | PROPOSED |
| FEAT-13 | Admin protection | UI-020 | API-20 and guard | DATA-01 | AC-014 | P0 | PROPOSED |
| FEAT-14 | Dashboard and storage bar | UI-021 | API-20, API-21 | DATA-01, 06, 08, 09 | AC-015, 016 | P0 | PROPOSED |
| FEAT-15 | Admin users and participation | UI-022, UI-023, UI-024 | API-22, 23, 25 | DATA-01, 06, 07, 09 | AC-017 | P0 | PROPOSED |
| FEAT-16 | Admin quizzes and questions | UI-025, UI-026 | API-26, API-27 | DATA-02..05 | AC-018, 019 | P0 | PROPOSED |
| FEAT-17 | PDF upload | UI-027 | API-28 | DATA-08 | AC-020 | P0 | PROPOSED |
| FEAT-18 | Notifications | UI-021, UI-028 | API-29, API-33 | DATA-10 | AC-021, 022 | P0 | PROPOSED |
| FEAT-19 | Activity log | UI-029 | API-30 | DATA-11 | AC-027 | P1 | PROPOSED |
| FEAT-20 | Visit counts | UI-021 | API-20 (analytics read) | external | AC-016 | P1 | OPEN |
| FEAT-21 | Security hardening | all | all | all | AC-023 | P0 | PROPOSED |
| FEAT-22 | Homepage card fix | UI-001 | none | DATA-17 | AC-024 | P0 | FINALIZED |
| FEAT-23 | Block user | UI-023 | API-24 | DATA-01 | AC-026 | P1 | FINALIZED |
| FEAT-24 | Delete own account | UI-011 | API-04 | DATA-01, 06 | AC-028 | P1 | FINALIZED |
| FEAT-25 | Report wrong question | UI-015, UI-031 | API-17, API-32 | DATA-12 | AC-029 | P1 | FINALIZED |
| FEAT-26 | CSV export | UI-022 | API-31 | DATA-01, 06 | AC-030 | P1 | FINALIZED |
| FEAT-27 | Weekly backup | none | API-33 | all | AC-031 | P1 | FINALIZED |
| FEAT-28 | Down alert | none | API-34 | none | AC-031 | P1 | FINALIZED |
| FEAT-29 | Download volume flag | UI-021, UI-023 | API-20 | DATA-09 | AC-032 | P1 | PROPOSED |
| FEAT-30 | Topic MCQ practice | UI-032 | none or API-05 (OPEN) | DATA-03 | AC-001 | P0 | PROPOSED |

## 11. Architecture Overview
One Next.js application on Vercel serves public pages, the user area, the admin area and the API. Clerk handles sign-in and calls a webhook to create and update users in Supabase. Supabase Postgres stores users, questions, quizzes, attempts, PDF records, downloads, notifications and logs. R2 stores PDF files privately. Geography and exam content stay in static content files read at build time. A PDF download is read from R2 by the server, stamped with the user's details, and streamed to the user. Details and diagrams are in `architecture.md`.

## 12. Delivery Plan
| Milestone | Included IDs | Dependencies | Exit criteria | Estimate / status |
|---|---|---|---|---|
| M0 Decisions and access | OQ-01..OQ-12 | Owner answers; access to deployed code | Open P0 questions closed | S, OPEN |
| M1 Identity and admin guard | FEAT-06, 07, 13 | M0, Clerk, Supabase | Sign-up, webhook sync, admin 404 pass | M |
| M2 Content tools | FEAT-16, 17 | M1 | Admin can create a quiz and upload a PDF | L |
| M3 Quiz taking | FEAT-08, 09, 10 | M2 | Timed attempt, resume, auto-submit, result | L |
| M4 PDF library | FEAT-11, 12 | M2 | Stamped download, log, My Downloads | M |
| M5 Admin dashboard and alerts | FEAT-14, 15, 18 | M1, M3, M4 | Dashboard, storage bar, bell, emails | M |
| M6 Public pages and design | FEAT-01, 02, 04, 05, 22, 30 | M1 | New home, footer text, card fix | M |
| M7 Security and accessibility | FEAT-21 | M1..M6 | Review and tests pass | M |
| M8 P1 features | FEAT-19, 20, 23..29 | M5 | Checks pass | M |
| M9 Launch | all P0 | M7 | Launch checklist complete | S |

Estimates are relative (S, M, L). No dates are promised because team capacity is unknown. See `implementation-plan.md`.

## 13. Risks, Assumptions, and Dependencies
| ID | Type | Description | Impact | Mitigation / next action | Status |
|---|---|---|---|---|---|
| R-01 | Risk | The deployed code is not available to me; the GitHub repo shared earlier is an older, login-free snapshot | Spec could clash with real code | Treat as new platform (DEC-001); get the deployed repo before build | OPEN |
| R-02 | Risk | Supabase free plan: pause after inactivity and no automatic daily backups | Downtime or data loss | Weekly backup (FEAT-27); consider a paid plan at launch | OPEN |
| R-03 | Risk | Vercel plan limits (function duration, cron frequency, non-commercial terms) | Features may not fit | Verify the plan in use (OQ-06) | OPEN |
| R-04 | Risk | PDF stamping inside serverless limits | Slow or failed downloads | Test with real file sizes (2 to 3 MB files seen); fallback design in `architecture.md` | OPEN |
| R-05 | Risk | Clerk and R2 free limits | Cost or throttling | Verify before build (OQ-06) | OPEN |
| R-06 | Risk | Personal data now stored (name, email, scores) | Legal and trust risk | Privacy notice, deletion, minimum data; legal review (NFR-04) | OPEN |
| R-07 | Risk | Admin account takeover | Full data exposure | 2-step verification, verified-email rule, activity log | PROPOSED |
| R-08 | Risk | Homepage card shows 160 currencies and 154 languages for Pakistan (observed 2026-11-14); the Pakistan profile page itself is correct | Wrong facts shown | FEAT-22 fix | FINALIZED |
| R-09 | Risk | Hero photo with the PPSC crest can read as official endorsement | Trust and legal | Prefer the neutral-wall photo; keep the non-affiliation line (DEC-014) | PROPOSED |
| R-10 | Risk | The credentials line lists FIA, PPSC, PERA and others next to "Mentor", which can read as employment | Misreading | Keep the owner's text verbatim; add the non-affiliation line close to it (DEC-013) | PROPOSED |
| R-11 | Risk | The corrections email on the live site is spelled "chaudhary" while the site name is "chaudhry" | Mail may not arrive | Owner to confirm the address (OQ-09) | OPEN |
| R-12 | Risk | Anonymous visitors cannot be named; only signed-in users can | Expectation gap | Dashboard separates "visits" (anonymous totals) from "users" (named) | PROPOSED |
| A-01 | Assumption | Only Geography is kept from current work | Scope | DEC-001 | FINALIZED |
| A-02 | Assumption | Geography quiz stays open and in the browser | Scope | OQ-03 | ASSUMPTION |
| A-03 | Assumption | 2 admins, no restrictions | Security | DEC-005 | FINALIZED |
| D-01 | Dependency | Mubashir sir's email for the admin list | FEAT-13 | Owner to provide | OPEN |

## 14. Approval and Change History
| Version | Date | Change | Approved by |
|---|---|---|---|
| 0.1 | 2026-11-14 | First package: scope baselined, features drafted | Scope and listed decisions approved in chat by the project contact; documents themselves not yet reviewed |

## 15. Related Documents
- `FRONTEND_PRD.md`
- `BACKEND_PRD.md`
- `DECISION_LOG.md`
- `architecture.md`
- `api-contract.md`
- `database-design.md`
- `implementation-plan.md`

## 16. Acceptance Criteria Register
| ID | Given | When | Then |
|---|---|---|---|
| AC-001 | A visitor is not signed in | They open any open page | The page loads without a sign-in prompt |
| AC-002 | A visitor opens the sign-in dialog and chooses sign up | They have not ticked Privacy and Terms | The create-account button is disabled |
| AC-003 | A visitor signs in | They choose a method | Only Google and email with verification code are offered |
| AC-004 | A new Clerk user is created | The webhook arrives, even twice | One user row exists within 60 seconds and one admin notification is created |
| AC-005 | A user is signed in | They edit their name | The new name shows after save and in the admin user detail |
| AC-006 | A signed-out visitor | Taps Start on a quiz | The sign-in dialog opens and, after sign-in, the quiz start screen shows |
| AC-007 | A quiz has a timer | Time reaches zero | The attempt is submitted automatically and scored, even if the browser is closed (server enforces) |
| AC-008 | A question is in Urdu | It is shown | Text and options display right to left in an Urdu font |
| AC-009 | A user has an in-progress attempt | They return later within the time limit | The attempt resumes with saved answers and the remaining time |
| AC-010 | A mock test has sections | The user takes it | A navigator shows answered, unanswered and flagged questions |
| AC-011 | A user submits | The result opens | Score uses the quiz's marks and negative marking; each answer shows the correct option and explanation; other users cannot open it |
| AC-012 | A visitor is not signed in | They request a PDF file | They receive a sign-in prompt and no file |
| AC-013 | A user downloads a PDF | The download completes | The file shows the user's name, email and access ID; one log row exists and My Downloads lists it |
| AC-014 | A non-admin or signed-out person | Opens any admin route | They see the standard 404 page |
| AC-015 | An admin opens the dashboard | It loads | Totals for users, attempts, downloads and visits are shown |
| AC-016 | An admin opens the dashboard | Storage is measured | A bar shows used space against the allowance with last-checked time; amber at 70%, red at 90% |
| AC-017 | An admin opens a user | The page loads | Profile details, attempts with scores, and downloads are shown |
| AC-018 | An admin saves a question | Language is English, Urdu or mixed | It saves with exactly one correct option and appears in the question list |
| AC-019 | An admin imports a file | One row is invalid | Nothing is saved and every bad row is listed with the reason |
| AC-020 | An admin uploads a PDF | The file is not a valid PDF or is too large | It is rejected with a clear reason and nothing is stored |
| AC-021 | A user registers | The event is processed | The bell shows it and an email is sent to the admin address |
| AC-022 | Users start quizzes during a day | The daily time arrives | One summary email lists each user and quiz |
| AC-023 | The security review runs | Tests execute | No critical or high finding is open |
| AC-024 | The home page loads | The Pakistan card shows | It lists Pakistani Rupee and Urdu and English only; the 250 profiles still load |
| AC-025 | Any page loads | The footer shows | The owner's note and credentials appear exactly as given in `FRONTEND_PRD.md` section 4 (UI-030) |
| AC-026 | An admin blocks a user | The user next acts | Protected actions are refused and a clear message shows |
| AC-027 | An admin acts | The action completes | An activity log row records who, what and when |
| AC-028 | A user deletes their account | They confirm | Personal data is removed per DEC-024 and the user is signed out |
| AC-029 | A user reports a question | They submit | The admin sees it in the reports list |
| AC-030 | An admin exports | They choose a type | A CSV downloads with the filtered rows |
| AC-031 | A week passes, or the site is down | The job or monitor runs | A backup file exists in storage, or an alert email is sent |
| AC-032 | A user downloads many PDFs in a day | The count passes the threshold | The admin sees a flag; no limit is applied |
