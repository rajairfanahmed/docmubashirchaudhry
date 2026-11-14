# Frontend Product Requirements Document

> Status: PROPOSED (items marked FINALIZED were approved by the owner in chat)
> Version: 0.1
> Last updated: 2026-11-14
> Source of truth for frontend experience and client-side behavior.

## 1. Frontend Overview
- Supported surfaces: responsive web (mobile first, tablet, desktop). No native app.
- Framework and language: Next.js, React, TypeScript, App Router (ASSUMPTION, confirm against deployed code).
- Rendering strategy: public content pages are pre-rendered for speed and search. User and admin pages are rendered per request after sign-in and are never indexed. The quiz player is a client-side screen backed by the server.
- UI and styling approach: Material Design as the base language, themed with the platform's forest green and gold. Components are built in-house, not imported as a ready-made library (PROPOSED, DEC-015).
- Authentication integration: Clerk, custom branded sign-in dialog, Google and email plus verification code only (FINALIZED, DEC-003).
- Main user roles: ROLE-01 Visitor, ROLE-02 User, ROLE-03 Admin. The word "student" is not used anywhere; use "user" (FINALIZED, DEC-006).
- Design references and brand inputs (owner-provided): Google and Material Design look and feel, premium, not a template; icons on all components, cards and sections; commission logos kept as they are used now (PPSC, FPSC and others); brand green `#0B4619` and the golden answer pill (`#FEF08A` background, `#78350F` text) kept for Geography; five owner photos for use where suitable, one in the hero.

## 2. Experience Principles and Constraints
1. **Google-like clarity.** One clear action per screen, generous white space, a prominent search bar, rounded surfaces, tonal color, and plain labels. Not a copy of any Google product, logo or font. Google Sans is not assumed to be licensed for this use; use Roboto or Inter (PROPOSED, check licence at design stage).
2. **Premium, not template.** Every page is composed for its content: real photos, real logos, real counts. No stock layout blocks with filler.
3. **Icons everywhere that help.** Every card, section heading, button group and status has a Material Symbols Rounded icon (PROPOSED, SVG, not the full icon font, to keep pages light). Icon-only buttons have text labels or accessible names.
4. **Honest content.** Show a number only when it is real and above zero. Do not show "0 Active Quizzes". Empty areas show a calm message with the next step.
5. **Human words.** Copy is written the way a teacher speaks to an aspirant (see copy rules below). No machine-sounding or marketing words.
6. **Light motion.** Motion is used only to explain state (page fade, card lift, bottom sheet, option feedback, timer warning). Library: Motion (formerly Framer Motion), used lightly (PROPOSED, DEC-016). Everything respects the reduced-motion setting. No parallax, no autoplay.
7. **Mobile first.** Users are mostly on phones. Minimum touch target 44 by 44 px.
8. **Accessibility.** WCAG 2.2 AA targets for all user-facing pages (see section 9).
9. **Urdu is a first-class content language.** Questions, options and explanations may be Urdu; they render right to left in a suitable Urdu font (FINALIZED, NFR-07). Site menus remain English (Urdu interface is DEFERRED).
10. **Geography stays.** The existing Geography module keeps its behavior, routes and 250 records. It is restyled only to match the new look where this does not change its behavior (FINALIZED, DEC-012).

### Copy rules (owner requirement: no AI-sounding words)
- Write short sentences. Say what the thing is and what it gives. Use "you" for the user.
- Do not use: AI, smart, seamless, unlock, empower, journey, revolutionary, cutting-edge, leverage, supercharge, game-changing, "powered by", "next-level", "elevate", "transform".
- Do not use em dashes or en dashes. Use commas, colons or full stops.
- Names the owners use stay as they are: "Doc Mubashir Chaudhry".
- Sample lines (PROPOSED, owner to edit):
  - Hero heading: "Learn with Doc Mubashir Chaudhry" (FINALIZED text from the owner's list).
  - Hero line: "Notes, MCQs, quizzes, practice material and other useful resources, all in one place for PPSC and FPSC aspirants." (taken from the owner's own meta description on the live site).
  - Sign-in prompt: "Sign in to take this quiz. It is free."
  - Empty quizzes: "No quizzes are published yet. Check back soon, or try Geography practice."
  - Blocked: "Your account is not active right now. Write to rajairfana551@gmail.com."

### Logo rules
Keep the commission emblems already used (PPSC, FPSC, NTS, CSS/PMS) on exam cards and hubs. Always show the standing line: "Independent educational platform, not affiliated with PPSC, FPSC, NTS or any government commission." Where a logo cannot be loaded, show a text badge in the same size. Logo licensing and the current external logo source are OPEN (OQ-10).

## 3. Navigation and Information Architecture
**Top bar (all pages):** logo and name, Home, Geography, PPSC, FPSC, PDF Library, Quizzes, search icon, and either Sign in or the user menu. Under 840 px width the top bar shows logo, search and menu; navigation moves to a drawer and the signed-in user area gets a bottom bar (Home, Quizzes, Library, Geography, Account).

**User menu (signed in):** My Profile, My Attempts, My Downloads, Sign out. Admins also see "Admin" (not shown to anyone else).

**Admin navigation:** a navigation rail on desktop and a drawer on mobile: Dashboard, Users, Participation, Quizzes, Questions, PDFs, Notifications, Reported questions, Activity log. A bell with an unread count is in the admin top bar.

**Route map**
| Area | Routes | Access |
|---|---|---|
| Public | `/`, `/exams`, `/exams/[slug]`, `/ppsc`, `/ppsc/[slug]`, `/ppsc/[slug]/blueprint`, `/fpsc`, `/css-pms`, `/nts`, `/geography`, `/geography/[slug]`, `/geography/continent/[slug]`, `/search`, `/about`, `/methodology`, `/corrections`, `/copyright`, `/privacy`, `/terms`, `/accessibility`, `/status`, `/mcq`, `/topics/[subject]/[topic]` | Open |
| User | `/quizzes`, `/quizzes/[id]`, `/quizzes/[id]/attempt/[attemptId]`, `/quizzes/[id]/result/[attemptId]`, `/library`, `/library/[exam]`, `/library/resource/[slug]`, `/account`, `/account/attempts`, `/account/downloads` | Library and quiz lists are visible to everyone; starting a quiz and downloading need sign-in; account pages need sign-in |
| Admin | `/admin` and below | Verified admin only; anyone else gets the 404 page |

`/my-attempts` and `/my-downloads` redirect to `/account/attempts` and `/account/downloads`.

## 4. Page and Screen Specifications

### UI-030: Global header and footer
- Route/access: every page. Open.
- Purpose: orient, search, sign in, and carry the owner's note and credentials.
- Footer content (FINALIZED, DEC-013), shown at the bottom of every page, exactly as written by the owner:

```
Note: My Views are personal and for academic debate only!!

Prepared & Shared By:
Doc Mubashir Chaudhry
M.Phil. Biology | B.S Botany | B.A | M.A English | M.A Political Science | Basic IT Course | B-Pharmacist | Philanthropist |
Writer | Researcher | Career Counselor | FIA | PPSC | PERA | FPSC | CSS | PMS Mentor & Competitive Exam Educator
The University of Agriculture, Faisalabad
```
- Also in the footer (PROPOSED): the non-affiliation line next to the credentials, link groups (Study, About and standards, Account), and the copyright line. Link groups: Geography, PPSC, FPSC, All exams, PDF Library, Quizzes; About, Methodology, Report a correction, Copyright, Privacy, Terms, Accessibility; My Profile, My Attempts, My Downloads, Status.
- Layout: the note block sits in a tonal surface across the full width with a small person icon and the educator's name as a heading; links sit above it in columns (stacked on mobile).
- States: none beyond static.
- Acceptance: AC-025.

### UI-001: Home
- Route/access: `/`, open.
- Purpose: tell a new visitor what this is within five seconds, and send each kind of visitor to the right place.
- Information hierarchy and sections, in order:
  1. **Hero.** Left: a row of commission logo chips, the heading "Learn with Doc Mubashir Chaudhry", one supporting line, a large rounded search bar (Google-style, with a search icon and suggestion chips such as "Intelligence Officer BS-14", "Pakistan", "General Ability"), and two buttons: "Explore quizzes" and "Browse PDFs". Right: the owner's photo in a large rounded frame on a soft green tonal shape, with a caption "Doc Mubashir Chaudhry, competitive exam educator and mentor". Photo choice: PROPOSED the black-shirt photo with the "Justice, Integrity, Fairplay" wall (neutral, no official crest); the owner delegated the choice to me (DEC-014). Photos are resized and compressed to WebP with a fixed aspect ratio so the page does not jump while loading. On mobile the photo sits below the heading, above the search bar, at a smaller size.
  2. **Commission shortcuts.** Cards for PPSC, FPSC, CSS/PMS, NTS, each with its logo, a one-line description and an arrow. Geography has its own card with a globe icon.
  3. **Quick actions.** Four icon tiles: Quizzes (timer icon), PDF Library (PDF icon), Geography (globe icon), Practice MCQs (quiz icon).
  4. **Latest PDFs.** Up to three cards. Hidden if there are none.
  5. **Latest quizzes.** Up to three quiz cards with exam logo, question count, time and marks. Hidden if there are none.
  6. **Geography preview.** One country card (Pakistan) with golden pills for capital, currency and official language, and "Start Geography quiz". Shows only the real values: Pakistani Rupee and Urdu and English (FEAT-22 fix).
  7. **About the educator.** A short strip with the owner's name, two lines of text and a link to About.
  8. **What is open and what needs sign-in.** Three icon rows: Read and study (open), Take quizzes (free sign-in), Download PDFs (free sign-in).
- Data needs: latest PDFs and quizzes (API-05, API-13), country data (content files).
- States: loading skeletons for sections 4 and 5; empty sections are hidden, never shown with zeros; failure shows a retry text in place of the section.
- Responsive: single column on mobile; hero becomes stacked; commission cards form a horizontal scroller with snap on small screens.
- Accessibility: one H1; the photo has a descriptive alt text; search is a labelled form.
- SEO: title and description as the owner's live meta text; Organization data.
- Acceptance: AC-001, AC-024.

### UI-002: Exams index
- Route: `/exams`, open. Cards for PPSC, FPSC, CSS/PMS, NTS, each with logo, name, one line and a link. Data: content files. Empty state not expected. Mobile: one column.

### UI-003: Exam hub (FPSC, CSS/PMS, NTS and `/exams/[slug]`)
- Route: `/fpsc`, `/css-pms`, `/nts`, `/exams/[slug]`, open.
- Sections: header with logo and the non-affiliation line; official website link with the date it was last checked; "Quizzes for this exam" row; "PDFs for this exam" row; "Practice by topic" chips. 
- Empty state: if a section has no content, show "Nothing published here yet" with links to the PPSC hub and Geography. No made-up filler content.
- Data: quizzes (API-05 filtered by exam), PDFs (API-13 filtered by exam), content files.

### UI-004: PPSC hub
- Route: `/ppsc`, open. A list of recruitment posts (for example Intelligence Officer BS-14, Tehsil Sports Officer BS-16) with status chips Open, Closed, Upcoming and a filter. Each item shows post title, scale, vacancies, closing date, and links to the post page. Data: content files. Empty state as UI-003.

### UI-005: PPSC post page
- Route: `/ppsc/[slug]`, open. Header with post title, scale, vacancies. A source box with the official link and "last checked" date. Tabs or sections: Syllabus and marks (links to UI-006), Quizzes for this post, Solved PDFs for this post. A "Report a correction" link.
- Rule (carried from the platform's own Methodology): official numbers are shown only when a source states them; study suggestions are clearly labelled "Platform recommendation, not official".

### UI-006: Blueprint page
- Route: `/ppsc/[slug]/blueprint`, open. Official blueprint block (paper type, total marks, time, sections as published, source and verification date, version selector). A separate block labelled as a recommendation.

### UI-007: World Geography (KEPT, FINALIZED)
- Routes: `/geography`, `/geography/[slug]`, `/geography/continent/[slug]`, open.
- Retain exactly: 250 country records; A to Z letter bar; continent and region filters; instant search with clear filters; pagination; "Quiz this selection (N)"; country cards with flag, capital, currency, official language in golden pills; Test in Quiz on each card; the quiz module on the same page with score, progress, explanations and results; country pages and continent pages.
- Changes allowed: visual restyle to match the new look; fix the homepage card (UI-001) so it shows only the country's own currencies and languages.
- OPEN (DEC-022): whether Geography quiz attempts should also be saved to a signed-in user's history, and counted in admin participation. Default assumption A-02: it stays open to all, runs in the browser, and is not counted.
- Acceptance: AC-024.

### UI-008: Search
- Route: `/search`, open. One large search field. Results grouped as Exams, PDFs, Countries, Topics and Quizzes (published only) with counts. Empty result: "No match for [term]" with suggestions. Data: prebuilt index file; quiz titles included only if published.

### UI-009: About
- Route: `/about`, open. The educator's photo (a second owner photo may be used here with an honest caption such as "At a visit"; the PPSC-crest photo only with that caption and the non-affiliation line), full credentials block exactly as in UI-030, the platform's purpose, the contact email, and the independence statement.

### UI-010: Sign-in and sign-up dialog (FEAT-06)
- Route: a dialog opened from any page; also `/sign-in` for direct links. Open.
- Trigger: header Sign in, Start quiz, Download PDF.
- Content: two tabs, Sign in and Create account. "Continue with Google" button with the Google mark, a divider with "or", email field, password field (show or hide icon), name field on create account, then a 6-digit code step ("We sent a code to your email"), "Forgot password" link, and on create account a checkbox "I agree to the Privacy Policy and Terms" with links. No other sign-in method is shown (FINALIZED).
- Validation: email format; password minimum length set by Clerk rules (display the rule); name 2 to 60 characters; code 6 digits. Validation runs when a field loses focus and on submit. Messages are plain: "Enter a valid email", "That code is not right. Try again", "This code expired. Send a new one".
- States: loading spinner inside the button, button disabled while sending; duplicate submit prevented; email already registered: "This email already has an account. Sign in instead."; network error with retry; blocked user: "Your account is not active right now. Write to rajairfana551@gmail.com."; success closes the dialog and returns to the previous page or the quiz or PDF the user was opening.
- Mobile: dialog becomes a full-screen sheet.
- Accessibility: focus moves into the dialog, is trapped, returns to the trigger on close; Escape closes; the checkbox and every field have labels.
- Data/API: Clerk for the sign-in itself; API-02 afterwards to read the user's status and role.
- Acceptance: AC-002, AC-003, AC-004, AC-006.

### UI-011: My Profile (`/account`, FEAT-07, FEAT-24)
- Access: signed in. Sections: avatar and name, verified email (read only), sign-in method (Google or email), member since, editable name, "My attempts" and "My downloads" shortcuts, and a "Delete my account" area. Delete opens a confirmation dialog explaining what is removed and what is kept (per DEC-024), with a typed confirmation. States: saving, saved snackbar, error text. Acceptance: AC-005, AC-028.

### UI-012: Quizzes hub (`/quizzes`, FEAT-08)
- Access: list visible to everyone; starting needs sign-in.
- Content: filter chips for Exam (with logos), Type (Topic, Post-wise, Full-length mock), Language (English, Urdu, Both); quiz cards with exam logo, title, number of questions, time, total marks, negative marking badge if on, language badge, and a Start button. A user's unfinished attempts appear first as "Continue" cards.
- States: loading skeleton cards; empty "No quizzes published yet"; filter with no result "No quiz matches. Clear filters".

### UI-013: Quiz start screen (`/quizzes/[id]`)
- Shows title, description, exam, number of questions, time, total marks, negative marking value (for example "Each wrong answer takes away 0.25 marks"), sections for mocks, and the rules in plain words (time ends the quiz, you can leave and come back before time ends, you can retake any time). Buttons: Start (or Continue if one is in progress). Signed-out: the Start button opens UI-010.

### UI-014: Quiz player (`/quizzes/[id]/attempt/[attemptId]`, FEAT-08, FEAT-09)
- Access: owner of the attempt only.
- Layout: top bar with quiz title, a timer chip (turns amber at 5 minutes and red at 1 minute, with a text change for screen readers) and "Question 7 of 50". Centre: question card (Urdu right to left when needed), four option tiles A to D, flag button. Bottom bar: Previous, Next, and Submit on the last question. Desktop: a navigator panel on the right with numbered tiles (answered, unanswered, flagged, current). Mobile: the navigator opens as a bottom sheet from a grid icon.
- Mock tests: section tabs along the top and a section summary in the navigator.
- Behavior: selecting an option saves it right away (API-09) with a small "Saved" indicator; no correctness is shown during the attempt; the user can change an answer until submit; leaving the page keeps the attempt and the timer running; returning resumes with saved answers and the remaining time (server time is the authority); at zero the quiz submits itself.
- Submit: a dialog shows answered, unanswered and flagged counts with "Submit now" and "Keep going".
- Failure: if saving fails, the option keeps its mark, a "Not saved, retrying" note shows, and retries continue; a banner appears if the connection is lost; submit retries safely (idempotent).
- Accessibility: options are a radio group; the timer is not read out every second, it announces at 10, 5, 1 minute and 30 seconds; full keyboard use (arrow keys to move, Enter to select, shortcuts listed in a help dialog).
- Acceptance: AC-007, AC-008, AC-009, AC-010.

### UI-015: Result and review (`/quizzes/[id]/result/[attemptId]`, FEAT-10, FEAT-25)
- Access: the attempt's owner and admins.
- Content: a score card (score out of total, percent, correct, wrong, unanswered, time taken, negative marks taken off), a section breakdown for mocks, then every question with the user's answer, the correct answer, and the explanation. Filter chips: All, Wrong, Unanswered, Flagged. Each question has "Report this question". Buttons: Retake, Back to quizzes.
- Scores are visible only to this user and to admins (FINALIZED, DEC-007).
- States: loading; attempt not submitted yet redirects back to the player.

### UI-016: My Attempts (`/account/attempts`)
- Signed in. A list or table (cards on mobile): quiz, date, status (In progress, Submitted, Auto-submitted), score, percent, buttons for Result or Continue. Empty: "You have not taken a quiz yet" with a link to Quizzes.

### UI-017: PDF Library (`/library`, `/library/[exam]`, FEAT-11)
- List visible to everyone. Search field; filters for Exam (logos), Subject, Topic, Year; sort by newest, title, size. PDF cards: PDF icon or first-page thumbnail, title, exam, subject, year, pages, file size, author, Verified badge, and a Download button. Signed-out: the button opens UI-010. Empty: "No PDFs match" with clear filters.

### UI-018: PDF detail (`/library/resource/[slug]`)
- Same details in full: description, author line "Prepared and shared by Doc Mubashir Chaudhry", edition note, file size, pages, rights note, related PDFs, a sticky Download button on mobile, and "Report a problem" (email link). Download starts after sign-in; a snackbar confirms "Your copy is ready" and notes that the file carries the user's name and email.
- Acceptance: AC-012, AC-013.

### UI-019: My Downloads (`/account/downloads`)
- Signed in. List of PDFs the user downloaded with date and a Download again button. Empty state with a link to the library.

### UI-020: Admin entry and stealth (FEAT-13)
- Route: `/admin`. If the person is not a verified admin (signed out, user, blocked), the page is the same 404 page used for any missing page, with no hint that an admin area exists. Admin sign-in uses the same dialog (UI-010); after sign-in an admin lands on `/admin`. Admin 2-step verification is a Clerk requirement for these accounts (PROPOSED).
- Acceptance: AC-014.

### UI-021: Admin dashboard (`/admin`, FEAT-14, FEAT-18, FEAT-20)
- Top bar: title, bell with unread count, the admin's avatar.
- Row of stat cards, each with an icon: Total users (and new this week), Quiz attempts (and today), PDF downloads (and today), Site visits today and this week (from the analytics tool, OPEN), Published quizzes, Published PDFs.
- **Storage card with a bar.** "Storage: 1.4 GB of 10 GB used" with a horizontal bar. Green below 70%, amber from 70%, red from 90%. A "Last checked" time and a refresh icon. The allowance number comes from a setting, not from guesswork (OQ-07). Below the bar: number of files and the largest files.
- Charts: sign-ups per day and attempts per day (last 30 days), simple bars.
- Recent activity: latest sign-ups, latest quiz attempts with scores, latest downloads.
- Flags (PROPOSED, FEAT-29): users with unusually many downloads today.
- Bell panel: new user and quiz join items with name, time, and link; "Mark all read".
- States: each card loads on its own with a skeleton and a retry if it fails; zero data shows "No data yet".
- Acceptance: AC-015, AC-016, AC-021.

### UI-022: Admin users (`/admin/users`, FEAT-15, FEAT-26)
- A table (cards on mobile): avatar, name, email, sign-in method, joined, last seen, attempts, downloads, status chip. Search by name or email; filters: status, joined date; sort. Pagination 25 per page. "Export CSV" button. Row opens UI-023.

### UI-023: Admin user detail (`/admin/users/[id]`, FEAT-15, FEAT-23)
- Profile block, status, counts. Tabs: Attempts (quiz, date, status, score, percent, link to the result), Downloads (file, date), Activity. Button "Block user" (red, outlined) or "Unblock", with a dialog that asks for an optional reason and shows what will happen. Blocked users show a clear red status chip.
- Acceptance: AC-017, AC-026.

### UI-024: Admin participation (`/admin/participation`)
- Table of attempts across all users: user, quiz, started, status, score, percent, time taken. Filters: quiz, user, date range, status. Row opens the attempt result. Shows who joined which quiz and what they scored. "Export CSV".

### UI-025: Admin quizzes (`/admin/quizzes`, `/admin/quizzes/new`, `/admin/quizzes/[id]`)
- List with status chips (Draft, Published, Archived), counts of attempts, and actions.
- Editor sections, in a stepper: 1 Details (title, description, exam, optional post, type, language label); 2 Settings (time in minutes or no timer, marks per question, negative marking switch and value, shuffle questions, shuffle options); 3 Questions (search and add from the question bank, reorder, override marks, sections for mocks; or create a question inline); 4 Preview (opens the quiz as a user would); 5 Publish.
- Rules: a quiz needs at least 1 question to publish; a published quiz that already has attempts shows a warning before editing questions ("Changing questions affects past results display"; past attempts keep their stored scores, DEC per `BACKEND_PRD.md` section 4); archive instead of delete when attempts exist.
- Fields and validation: see section 6.
- Acceptance: AC-018.

### UI-026: Admin questions (`/admin/questions`, `/admin/questions/new`, `/admin/questions/import`)
- List with search, filters (language, exam, subject, topic, status), bulk select. Editor with language switch (English, Urdu, Mixed), question text box (right to left when Urdu), four option boxes with a "correct" radio, explanation box, exam, subject, topic, difficulty, optional source note, status. Live preview beside the editor.
- Import screen: download a sample CSV, choose a CSV or JSON file, see a preview table with row-by-row checks, then Confirm. If any row is invalid, nothing is saved and every problem is listed.
- Acceptance: AC-018, AC-019.

### UI-027: Admin PDFs (`/admin/pdfs`, `/admin/pdfs/new`, `/admin/pdfs/[id]`, FEAT-17)
- List: title, exam, status, size, downloads, date; storage bar repeated at the top.
- Upload: drag-and-drop or choose a PDF; progress bar; automatic checks (type, size, page count); form with title, description, exam, subject, topic, year, author (default Doc Mubashir Chaudhry), rights note; Save as draft or Publish. Replacing a file creates a new version.
- Errors: not a PDF, too large, upload interrupted (resume or retry), duplicate file (warns).
- Acceptance: AC-020.

### UI-028: Admin notifications (`/admin/notifications`)
- Full list of notifications with type icon (new user, quiz join), user name, quiz, time, read state; filter by type; "Mark all read". Also controls to confirm where emails go (shows the addresses, read only in MVP).

### UI-029: Admin activity log (`/admin/activity`, FEAT-19)
- Table: time, admin, action, item. Filters by admin, action, date. Read only.

### UI-031: Admin reported questions (`/admin/reports`, FEAT-25)
- List of user reports with the question, the message, the reporting user and status (New, Looked at, Fixed, Not an issue). Link to edit the question.

### UI-032: Practice MCQs and topic pages (`/mcq`, `/topics/[subject]/[topic]`, FEAT-30)
- Pick exam, subject, topic; start a practice session of single questions with instant feedback and explanation; session summary with a retry for missed questions. Whether signing in is needed is OPEN (DEC-023); the draft assumes open and unsaved. Real counts only; topics with no questions show "No questions added yet".

### UI-033: Information and error pages
- `/methodology`, `/corrections` (explains how to report an error by email, with a pre-addressed link), `/copyright` (rights and takedown contact), `/privacy` (what is collected, why, who processes it: Clerk, Supabase, Cloudflare, the email and analytics services; how to delete the account), `/terms` (new), `/accessibility`, `/status`, a 404 page, a generic error page, and a "blocked" message page. Text is owner-reviewed; no legal claims are made without legal review (NFR-04).

## 5. Feature Interaction Specifications
| Feature ID | UI ID | User action | Expected behavior | Backend/API dependency | Acceptance IDs |
|---|---|---|---|---|---|
| FEAT-06 | UI-010 | Create account | Dialog flow, code check, return to previous page | Clerk, API-01, API-02 | AC-002..004 |
| FEAT-07 | UI-011 | Save name | Saved snackbar, new name shown | API-03 | AC-005 |
| FEAT-08 | UI-013 | Tap Start | New attempt opens in the player | API-07 | AC-006 |
| FEAT-08 | UI-014 | Select option | Saved at once, indicator shows | API-09 | AC-009 |
| FEAT-08 | UI-014 | Time ends | Auto-submit and redirect to the result | API-10 | AC-007 |
| FEAT-10 | UI-015 | Open result | Score and review shown | API-11 | AC-011 |
| FEAT-11 | UI-017/018 | Tap Download | Stamped copy downloads, snackbar confirms | API-15 | AC-012, 013 |
| FEAT-14 | UI-021 | Open dashboard | Cards, storage bar, charts | API-20, API-21 | AC-015, 016 |
| FEAT-15 | UI-023 | Block user | Dialog, status chip changes | API-24 | AC-026 |
| FEAT-16 | UI-026 | Import file | Preview, confirm, saved or all rejected | API-27 | AC-019 |
| FEAT-17 | UI-027 | Upload PDF | Progress, checks, draft or publish | API-28 | AC-020 |
| FEAT-18 | UI-021 | Open bell | Latest items, mark read | API-29 | AC-021 |

## 6. Forms and Validation
| Form | Fields and rules | Timing | Server error mapping |
|---|---|---|---|
| Sign in or sign up | Email (valid format), password (Clerk rules shown), name 2 to 60 chars (sign up), code 6 digits, consent checkbox required | On blur and submit | Provider errors mapped to the plain messages in UI-010 |
| Profile | Name 2 to 60 chars | On blur and save | 422 shows under the field |
| Delete account | Type "DELETE" to enable the button | Live | 409 or 500 shows a banner with retry |
| Quiz details | Title 3 to 120; exam required; type required; minutes whole number 1 to 600 or empty (no timer); marks per question number above 0; negative value number from 0 to the marks per question | Blur and submit | 422 per field |
| Question | Language required; text 3 to 2000 chars; 4 options each 1 to 500 chars and all different; exactly one correct; explanation optional up to 4000; exam, subject, topic required | Blur and submit | 422 per field |
| Import | File type CSV or JSON, UTF-8, at most 500 rows per import (PROPOSED); every row validated | On choose and confirm | Row list with line numbers and reasons |
| PDF upload | PDF only, size limit (PROPOSED 25 MB, OQ-08), title 3 to 150, exam required, year 1990 to current | On choose and submit | 413, 415, 422 mapped to plain messages |
| Block user | Reason optional up to 300 chars | Submit | 404 or 409 banner |
| Report question | Message 5 to 500 chars | Submit | 429 shows "Please wait before sending another" |

All forms disable the submit button while sending to prevent double submits.

## 7. UI State and Error Handling
- Loading: skeleton cards for lists and cards; spinner only inside buttons; the quiz player never blocks on non-essential data.
- Empty: a small icon, one sentence, one next step. Never fake numbers or placeholder items.
- Network failure: inline retry text; the quiz player keeps answers on the screen and retries saving.
- Expired session: a sign-in dialog opens and returns the user to the same screen; an in-progress attempt is not lost.
- Permission denied: signed-in non-admin on an admin URL sees the 404 page; a user opening another user's result sees the 404 page.
- Blocked user: sign-in works at Clerk level but protected features show the blocked message.
- Partial data: a failed card does not break the page.

## 8. Responsive Requirements
- Breakpoints: under 600 px (phone), 600 to 839 (large phone and small tablet), 840 and above (desktop).
- Phone: single column, bottom bar for signed-in users, navigators in bottom sheets, tables become cards, sticky primary buttons on PDF and quiz screens.
- Desktop: navigation rail in admin, two-column layouts for the quiz (question plus navigator) and results.
- No horizontal page scroll; wide tables scroll inside their own container.
- Touch targets 44 by 44 px minimum.

## 9. Accessibility Requirements
- Semantic landmarks, one H1 per page, labelled inputs, visible focus rings, logical tab order.
- Contrast 4.5:1 for text and 3:1 for large text and controls. The golden pill pair is about 7.8:1 by calculation; verify in design.
- Colour is never the only signal: correct and wrong, status chips and the storage bar all use text or icons as well.
- Urdu content has `lang="ur"` and `dir="rtl"` on the content, not on the whole page.
- Live regions announce saved answers, timer milestones, and errors.
- Reduced-motion setting turns off page transitions and the card lift.
- Dialogs trap focus and restore it; Escape closes non-destructive dialogs.

## 10. SEO and Rendering (Public Pages Only)
- Indexable: home, exam hubs, PPSC pages, Geography pages, library and PDF detail pages (the pages only; files are protected), topic pages, information pages.
- noindex: account, attempt, result, admin, sign-in, search results, 404.
- Metadata: unique title and description per page; canonical URLs; Open Graph image for the home page; sitemap and robots; structured data for Organization, BreadcrumbList, and CreativeWork on PDF pages.
- Keep the Google Search Console site verification already on the live site.

## 11. Frontend Data/API Integration
| UI ID | User action | API ID | Request data | Response data used | Error handling |
|---|---|---|---|---|---|
| UI-010 | After sign-in | API-02 | none | status, isAdmin, name | blocked message; retry |
| UI-011 | Save name | API-03 | name | updated profile | field error |
| UI-011 | Delete account | API-04 | confirm | none | banner |
| UI-012 | Open quizzes | API-05 | filters, page | quiz list | retry text |
| UI-013 | Open quiz | API-06 | id | quiz summary | 404 page |
| UI-013 | Start | API-07 | quiz id | attempt id, deadline | sign-in dialog if 401; blocked message if 403 |
| UI-014 | Resume | API-08 | attempt id | questions, saved answers, time left | 404 page |
| UI-014 | Select option | API-09 | question id, option id | saved flag | retry indicator |
| UI-014 | Submit | API-10 | attempt id | result id | retry safely |
| UI-015 | Open result | API-11 | attempt id | score, answers, explanations | 404 page |
| UI-016 | Open attempts | API-12 | page | attempts | retry text |
| UI-017 | Browse | API-13 | filters, page | PDF list | retry text |
| UI-018 | Open | API-14 | slug | PDF details | 404 page |
| UI-018 | Download | API-15 | pdf id | file stream | 401 dialog; 403 blocked; 500 "Try again" |
| UI-019 | Open | API-16 | page | downloads | retry text |
| UI-015 | Report | API-17 | question id, message | ok | 429 message |
| UI-021 | Open dashboard | API-20, API-21 | none | totals, storage | per-card retry |
| UI-022 | Browse users | API-22 | search, filters, page | users | retry |
| UI-023 | Open user | API-23 | id | profile, attempts, downloads | 404 page |
| UI-023 | Block | API-24 | id, status, reason | new status | banner |
| UI-024 | Browse | API-25 | filters, page | attempts | retry |
| UI-025 | Edit quizzes | API-26 | quiz fields | saved quiz | field errors |
| UI-026 | Edit and import | API-27 | question fields or file | saved, or row errors | row list |
| UI-027 | Upload | API-28 | file, details | draft or published | mapped messages |
| UI-028 | Bell | API-29 | page | notifications | retry |
| UI-029 | Open log | API-30 | filters | rows | retry |
| UI-022 | Export | API-31 | type, filters | CSV | banner |
| UI-031 | Browse | API-32 | status | reports | retry |

## 12. Frontend Non-Functional Requirements
- Performance: LCP 2.5 s or less on public pages; the quiz player loads its code only on the quiz screen; images are WebP with set sizes; fonts are subset and the Urdu font loads only when needed.
- Compatibility: last 2 versions of major browsers; Android Chrome.
- Maintainability: shared component set, shared Zod schemas, no copy-pasted components.
- Testability: end-to-end tests for sign-in, quiz attempt with timer, PDF download, admin block, import.
- Localization: English interface; Urdu content with right-to-left support; date format day month year.

## 13. Frontend Acceptance Criteria
Observable acceptance scenarios are defined once in `MASTER_PRD.md` section 16 (AC-001 to AC-032) and apply to the pages named above. Additional page-level checks:
- Given a phone 360 px wide, when the home page loads, then there is no horizontal scroll and the search bar is visible without scrolling past the photo (AC-001).
- Given an Urdu question, when it is shown in the player and the result, then it is right to left in both places (AC-008).
- Given a quiz in progress, when the network drops for 20 seconds and returns, then selected answers are saved and the timer shows the true remaining time (AC-009).
- Given an admin on a phone, when the dashboard loads, then stat cards stack and the storage bar stays readable (AC-016).

## 14. Open Items and Assumptions
| ID | Item | Impact | Next decision | Status |
|---|---|---|---|---|
| FO-01 | Hero photo final choice | Trust and look | Owner approves the neutral-wall photo or picks another (DEC-014) | PROPOSED |
| FO-02 | Icon set and font | Look and weight | Design stage (Material Symbols SVG, Roboto or Inter) | PROPOSED |
| FO-03 | Motion library | Weight | Approve Motion with light use (DEC-016) | PROPOSED |
| FO-04 | Are practice MCQs open or login-gated | Reach versus tracking | DEC-023 | OPEN |
| FO-05 | Geography quiz counted in participation | Owner tracking | DEC-022 | OPEN |
| FO-06 | Commission logo source and licence | Legal and trust | OQ-10 | OPEN |
| FO-07 | Exact visit counter source | Dashboard card | DEC-017 | OPEN |
| FO-08 | Wording of the credentials line near non-affiliation line | Misreading | Owner decision (DEC-013) | PROPOSED |
| FO-09 | Score display when negative marking makes a score below zero | Result card | DEC-025 | OPEN |

## 15. Handoff to Design Engineer and Frontend Engineering
- Read this document before implementation.
- Read `MASTER_PRD.md` for approved product goals, scope, users, and priorities.
- Read `BACKEND_PRD.md`, `architecture.md`, and `api-contract.md` for backend contracts.
- Do not invent API behavior or change approved product behavior silently.
- Pixel-level design (spacing, type scale, color tokens, component visuals) belongs to the Design Engineer. Keep Geography behavior unchanged.
