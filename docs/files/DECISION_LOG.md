# Project Decision Log

> Last updated: 2026-11-14
> Project: docmubashirchaudhry
> Source: compiled from the planning conversation and from decisions already cited in `MASTER_PRD.md`, `FRONTEND_PRD.md` and `BACKEND_PRD.md`. No new decisions are introduced here; this file is the single place to read their status, rationale and consequences together.

## Status definitions
`OPEN` · `PROPOSED` · `FINALIZED` · `ASSUMPTION` · `DEFERRED` · `OUT_OF_SCOPE` · `REVISED`

## Decisions

### DEC-001: Treat the product as a new platform, Geography excepted
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Context:** The GitHub repo available for review (`iqra-smith/mubashir`) has one commit, lists no Clerk, Supabase or R2 packages, and has no `/admin`, `/quizzes` or `/my-attempts` routes, while the live Vercel deployment already shows Sign In, protected downloads, a quizzes hub and `/my-attempts`. The code actually running in production is not available for review.
- **Options considered:** (a) Specify against the old repo as the baseline and treat the live site as unexplained drift. (b) Specify as a change request against the live site's unseen code. (c) Treat everything except Geography as a new platform, written from the owner's feature list, and treat any existing code as reference only.
- **Decision:** Option (c). World Geography is the one exception and keeps its current behavior.
- **Rationale and trade-offs:** Specifying against code nobody can see risks silently contradicting it. Starting fresh for everything but Geography avoids guessing at unseen implementation while still protecting the one module known to work well. Trade-off: some already-built work may be redone if it turns out to match these requirements.
- **Approved by:** Project contact (rajairfana551@gmail.com), in chat.
- **Affected IDs:** All FEAT-IDs except FEAT-03. ROLE-01..03. OBJ-01..06.
- **Affected documents:** `MASTER_PRD.md` section 1, 5; `FRONTEND_PRD.md` section 2; `BACKEND_PRD.md` section 1.
- **Risks/follow-up:** R-01. Getting access to the real deployed repo (OQ-01) could still reveal reusable work.
- **Previous decision:** N/A.

### DEC-003: Sign-in methods limited to Google and email
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Context:** The owner asked for proper Google and email sign-up and sign-in, with no other options.
- **Decision:** Clerk, with exactly two sign-in methods: Google OAuth and email with password plus a verification code. No phone, Facebook, Apple or other providers.
- **Rationale:** Matches the owner's explicit instruction and keeps the identity surface small to secure.
- **Approved by:** Project contact, in chat.
- **Affected IDs:** FEAT-06, FR-02, API-01, API-02.
- **Affected documents:** `MASTER_PRD.md` section 9; `FRONTEND_PRD.md` section 1, UI-010; `BACKEND_PRD.md` section 1, 6.
- **Risks/follow-up:** None identified beyond standard Clerk account-security practice (2-step verification for admins, see DEC-020).
- **Previous decision:** N/A.

### DEC-004: Next.js, React, TypeScript on Vercel serverless functions
- **Status:** ASSUMPTION, not yet confirmed against the real deployed code
- **Date:** 2026-11-14
- **Context:** Both the old reference repo and the live site appear to use Next.js with the App Router. The actual branch deployed to Vercel has not been inspected.
- **Decision (working):** Keep Next.js, React, TypeScript, App Router, with Vercel serverless functions for the backend. No separate backend service.
- **Rationale and trade-offs:** Consistent with everything observable about the project; avoids introducing a second framework for a two-person team. Trade-off: if the real deployed code uses a materially different setup, this assumption must be revisited before build (see OQ-01).
- **Approved by:** Not yet explicitly approved; carried forward as the working assumption in both PRDs.
- **Affected IDs:** All FEAT-IDs with a frontend or backend surface.
- **Affected documents:** `MASTER_PRD.md` section 9; `BACKEND_PRD.md` section 1; `architecture.md`.
- **Risks/follow-up:** R-01. Confirm once repo access is available (OQ-01).
- **Previous decision:** N/A.

### DEC-005: Admin has no sub-roles
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Context:** A three-tier Owner / Admin / Editor model was proposed, where an Editor could manage quizzes and PDFs without seeing user personal data, on the reasoning that fewer people seeing personal data is safer.
- **Options considered:** (a) Three roles, Owner, Admin, Editor. (b) Two roles, Owner and Admin. (c) One role, Admin, no restrictions.
- **Decision:** Option (c). There is one admin role with no restrictions. Two people hold it today: the project contact and Mubashir sir.
- **Rationale:** The owner stated there are only two admins and no restriction is needed between them.
- **Approved by:** Project contact, in chat.
- **Affected IDs:** ROLE-03, FEAT-13..17, API-20..32.
- **Affected documents:** `MASTER_PRD.md` section 4, 5; `BACKEND_PRD.md` section 6.
- **Risks/follow-up:** Because both admins see everything, verified-email gating and 2-step verification (DEC-020) carry more weight as the only safeguard.
- **Previous decision:** Supersedes the three-role proposal above.

### DEC-006: Use the word "user", never "student"
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Decision:** The signed-in, non-admin role and all related copy and identifiers use "user". "Student" is not used anywhere in the product.
- **Approved by:** Project contact, in chat (explicit correction: "user kahe, student nahi").
- **Affected IDs:** ROLE-02, all FEAT/UI copy referring to this role.
- **Affected documents:** `FRONTEND_PRD.md` section 1; `MASTER_PRD.md` section 4.
- **Previous decision:** N/A.

### DEC-007: No public leaderboard
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Decision:** Quiz scores are visible only to the user who earned them and to admins. No feature shows one user's score to another.
- **Rationale:** Owner's explicit preference, stated from the first planning pass and repeated when confirmed.
- **Approved by:** Project contact, in chat.
- **Affected IDs:** FEAT-10, API-11, UI-015.
- **Affected documents:** `MASTER_PRD.md` section 3, 5; `FRONTEND_PRD.md` UI-014.
- **Previous decision:** N/A.

### DEC-008: New-user notification is immediate; quiz-join notification is a daily digest
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Context:** The owner wants to know about new registrations and about quiz participation, but an email on every single quiz start would flood the inbox.
- **Decision:** A new user triggers a dashboard bell item and an immediate email. A quiz join triggers a dashboard bell item immediately, naming the user, but email notification for quiz joins is batched into one daily summary.
- **Rationale:** Balances the owner's wish to "know who is participating" against email volume.
- **Approved by:** Project contact, in chat.
- **Affected IDs:** FEAT-18, API-29, API-33, DATA-10, DATA-15.
- **Affected documents:** `BACKEND_PRD.md` section 4.8; `FRONTEND_PRD.md` UI-028.
- **Risks/follow-up:** Which email service sends these is still open (DEC-018). Digest send time defaults to 08:00 Pakistan time, pending owner confirmation.
- **Previous decision:** N/A.

### DEC-009: No download limits and no retake limits
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Context:** A per-user per-day PDF download limit was proposed as the most practical anti-scraping measure; a quiz retake limit was also considered.
- **Decision:** No hard limit on either. Instead, the admin dashboard silently flags a user whose daily download count is unusually high (FEAT-29), without blocking them; blocking remains a manual admin action.
- **Rationale:** The owner preferred visibility and manual control over automatic blocking.
- **Approved by:** Project contact, in chat.
- **Affected IDs:** FEAT-09, FEAT-11, FEAT-29, API-07, API-15.
- **Affected documents:** `MASTER_PRD.md` section 5; `BACKEND_PRD.md` section 4.4, 4.7, 8.
- **Previous decision:** N/A.

### DEC-012: Geography is restyled only, behavior unchanged
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Decision:** The 250 country records, filters, search, pagination, country and continent pages, and the Geography quiz keep their current behavior and routes. Only the visual styling changes, to match the new look.
- **Rationale:** The owner repeatedly confirmed Geography is working well and should be kept as is.
- **Approved by:** Project contact, in chat.
- **Affected IDs:** FEAT-03, UI-007.
- **Affected documents:** `MASTER_PRD.md` DEC-001, OBJ-04; `FRONTEND_PRD.md` UI-007.
- **Previous decision:** Reinforces the Geography exception carved out in DEC-001.

### DEC-013: Exact footer note and credentials text, verbatim
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Decision:** The footer on every page carries the owner's note and credentials block exactly as written (see `FRONTEND_PRD.md` UI-030), not paraphrased. The full block also appears on the About page.
- **Context:** The live site currently shows a paraphrased "Prepared & Curated By" line instead of the owner's exact text.
- **Rationale:** The owner's wording and credentials are his own statement and must not be altered.
- **Approved by:** Project contact, in chat.
- **Affected IDs:** FEAT-05, UI-009, UI-030.
- **Affected documents:** `FRONTEND_PRD.md` UI-030, UI-009.
- **Risks/follow-up:** R-10. Wording of a short non-affiliation line placed near the credentials, so "FIA, PPSC, PERA... Mentor" is not misread as current employment, is PROPOSED and still needs the owner's sign-off (FO-08).
- **Previous decision:** N/A.

### DEC-014: Hero photo choice
- **Status:** PROPOSED, owner's final choice still pending
- **Date:** 2026-11-14
- **Context:** The live hero currently uses the photo with the PPSC crest in the background, which can read as if the site is officially affiliated with PPSC. The owner delegated the choice to the planning assistant.
- **Recommendation:** Use the photo in front of the "Justice, Integrity, Fairplay" wall for the hero (neutral, no government crest). Keep the PPSC-crest photo for the About page, with an honest caption and the non-affiliation line nearby.
- **Approved by:** Not yet, owner delegated but has not confirmed the specific recommendation.
- **Affected IDs:** UI-001, UI-009.
- **Affected documents:** `FRONTEND_PRD.md` UI-001, UI-009.
- **Risks/follow-up:** R-09, FO-01.
- **Previous decision:** N/A.

### DEC-015: In-house components, not a ready-made UI library
- **Status:** PROPOSED
- **Date:** 2026-11-14
- **Decision (working):** Build the component set in-house, themed to the forest green and gold brand, rather than adopting a ready-made component library.
- **Rationale:** Needed to hit the "premium, not template" look the owner asked for; a stock library tends to look stock.
- **Approved by:** Not yet explicitly approved by the owner.
- **Affected IDs:** All UI-IDs.
- **Affected documents:** `FRONTEND_PRD.md` section 1.
- **Previous decision:** N/A.

### DEC-016: Motion library for light animation
- **Status:** PROPOSED
- **Date:** 2026-11-14
- **Decision (working):** Use the Motion library (formerly Framer Motion), applied lightly: page fade, card lift, bottom sheet, option feedback, timer warning. No parallax, no autoplay, reduced-motion respected everywhere.
- **Rationale:** Matches the owner's "not too heavy" animation brief from the earlier design discussion.
- **Approved by:** Not yet explicitly approved by the owner.
- **Affected IDs:** All UI-IDs with interaction states.
- **Affected documents:** `FRONTEND_PRD.md` section 2.
- **Previous decision:** N/A.

### DEC-017: Analytics tool for visit counts
- **Status:** OPEN
- **Date:** 2026-11-14
- **Context:** The owner wants to know how many people visit the site. No tool has been chosen.
- **Options to weigh when this is picked:** a cookieless, privacy-respecting analytics tool versus a full-featured one; cost at the project's traffic scale; whether it needs to distinguish bot traffic.
- **Affected IDs:** FEAT-20, OBJ-06, API-20.
- **Affected documents:** `MASTER_PRD.md` OBJ-06; `BACKEND_PRD.md` section 4.13, 7.
- **Next action:** Owner and planning assistant to pick a tool at the stack-confirmation stage.
- **Previous decision:** N/A.

### DEC-018: Email service for notifications
- **Status:** OPEN
- **Date:** 2026-11-14
- **Context:** New-user emails and the daily digest (DEC-008) need a sending service; none has been chosen.
- **Affected IDs:** FEAT-18, API-29, API-33.
- **Affected documents:** `BACKEND_PRD.md` section 1, 4.8, 7.
- **Next action:** Choose at the stack-confirmation stage, checking current pricing and sending limits against expected volume.
- **Previous decision:** N/A.

### DEC-019: MVP (P0) and later-phase (P1) scope
- **Status:** FINALIZED
- **Date:** 2026-11-14
- **Decision:** P0 is FEAT-01 through FEAT-18, FEAT-21 and FEAT-22 as listed in `MASTER_PRD.md` section 5. P1 is FEAT-19, FEAT-20, FEAT-23 through FEAT-29. Out of scope: ads, payments, download limits, retake limits. Deferred: certificates, an Urdu interface (menus stay English; question content can still be Urdu), WhatsApp, a public leaderboard.
- **Rationale:** The owner approved this split explicitly ("approved") after reviewing the full feature list and checkpoint summary.
- **Approved by:** Project contact, in chat.
- **Affected IDs:** All FEAT-IDs.
- **Affected documents:** `MASTER_PRD.md` section 5, 12; `implementation-plan.md`.
- **Previous decision:** N/A.

### DEC-020: Admin identity via verified email in a Vercel environment variable
- **Status:** PROPOSED, safeguards still being finalized
- **Date:** 2026-11-14
- **Context:** Admin access is granted by email. Granting it without conditions risks someone signing up with a similar or spoofed address claiming to be an admin.
- **Decision (working):** An account is admin only if its Clerk email is verified and appears in an `ADMIN_EMAILS` list stored as a Vercel environment variable, never in the database and never settable through any API. Both admin accounts are required to turn on Clerk's 2-step verification.
- **Rationale:** Keeps the admin list outside normal application data paths, where it cannot be changed by a compromised database row or a bug, at the cost of needing a code deploy to change who is an admin.
- **Approved by:** Project contact approved "no restriction, admin ho jai email ke through" for the list mechanism; the verified-email and 2-step-verification safeguards were proposed afterward and are still PROPOSED pending explicit confirmation.
- **Affected IDs:** FEAT-13, API-02, DEC-005.
- **Affected documents:** `BACKEND_PRD.md` section 4.2, 8; `MASTER_PRD.md` section 9.
- **Risks/follow-up:** R-07. Confirm 2-step verification is turned on for both admin accounts before launch.
- **Previous decision:** N/A.

### DEC-022: Whether Geography quiz results count in admin participation tracking
- **Status:** OPEN (ASSUMPTION A-02 used to proceed)
- **Date:** 2026-11-14
- **Context:** Geography has its own quiz, run entirely in the browser, with no login. Whether that activity should also be saved to a signed-in user's history and counted in the admin's participation view is undecided.
- **Working assumption:** It stays open to everyone, runs client-side as today, and is not counted in admin participation figures.
- **Affected IDs:** FEAT-03, FEAT-08, FEAT-15.
- **Affected documents:** `FRONTEND_PRD.md` UI-007; `MASTER_PRD.md` section 13 (A-02).
- **Next action:** Owner confirms whether this assumption should become a decision or be reversed.
- **Previous decision:** N/A.

### DEC-023: Whether Practice MCQs require sign-in
- **Status:** OPEN
- **Date:** 2026-11-14
- **Context:** FEAT-30 (topic-wise MCQ practice) was added by the planning assistant from the owner's feature list, not explicitly specified by the owner. Whether it should sit behind sign-in like full quizzes, or stay fully open like Geography, is undecided.
- **Working assumption:** Open to everyone, not saved.
- **Affected IDs:** FEAT-30, UI-032.
- **Affected documents:** `FRONTEND_PRD.md` UI-032.
- **Next action:** Owner decides whether FEAT-30 is wanted at all, and if so, its access rule.
- **Previous decision:** N/A.

### DEC-024: What happens to a user's data on account deletion
- **Status:** OPEN (principle finalized, details open)
- **Date:** 2026-11-14
- **Context:** Users can delete their own account (FEAT-24). Personal data (name, email, scores) now exists, so deletion must be handled carefully.
- **Finalized principle:** The user can delete their account and their personal data is removed.
- **Open detail:** Whether past quiz attempts are deleted entirely or kept anonymously (showing "Deleted user") for the owner's own statistics; how long anonymized download logs are kept.
- **Working assumption:** Profile is anonymized (name, email, avatar removed, status set to deleted); the row stays so historical attempts and downloads keep a reference, shown as "Deleted user".
- **Affected IDs:** FEAT-24, DATA-01, DATA-06, DATA-09.
- **Affected documents:** `BACKEND_PRD.md` section 3, 4.9.
- **Next action:** Owner confirms the anonymize-and-keep approach, or asks for full deletion of attempts and downloads too.
- **Previous decision:** N/A.

### DEC-025: How a negative total score is displayed
- **Status:** OPEN
- **Date:** 2026-11-14
- **Context:** Negative marking can push a raw score below zero. Whether the result screen should show the true negative number or floor it at zero is undecided.
- **Working assumption:** The stored score can be negative; the displayed percentage uses `max(0, score) / totalMarks` so the percentage never shows negative, but the open question is whether the raw score itself should also be floored at zero or shown as is.
- **Affected IDs:** FEAT-10, API-10, API-11, UI-015.
- **Affected documents:** `BACKEND_PRD.md` section 4.4.
- **Next action:** Owner picks one of the two display options.
- **Previous decision:** N/A.

## Open questions
| ID | Question | Why it matters | Affected scope | Next action | Status |
|---|---|---|---|---|---|
| OQ-01 | Which repository and branch is actually deployed on Vercel, and can it be shared or its key files pasted (`package.json`, the `src/app` folder list, the Clerk webhook file, the Supabase SQL, the `/admin` routes)? | Without this, "already built" and "new" cannot be told apart, and this PRD risks being written against code that does not exist | All FEAT-IDs, DEC-001, DEC-004 | Owner to provide repo access or the listed files | OPEN |
| OQ-02 | What is Mubashir sir's email address, for the second admin entry? | Needed to complete the `ADMIN_EMAILS` list | FEAT-13, DEC-020, D-01 | Owner to provide | OPEN |
| OQ-03 | Should a Geography quiz result be saved to a signed-in user's history and counted in admin participation? | Changes whether Geography needs any backend write at all | FEAT-03, FEAT-15, DEC-022 | Owner decides | ASSUMPTION in use |
| OQ-04 | Should Practice MCQs (FEAT-30, `/mcq`) require sign-in? | Changes FEAT-30's backend and privacy footprint | FEAT-30, DEC-023 | Owner decides whether FEAT-30 proceeds and on what terms | OPEN |
| OQ-05 | Do Pakistan's data-protection rules impose duties on this project, now that real personal data (name, email, scores) is collected? | Legal exposure | NFR-04, DEC-024 | Legal advice, not something this document can answer | OPEN |
| OQ-06 | What are the actual plan limits for Vercel (function duration, cron frequency, request size), Supabase (connection and storage limits, backup behavior) and Clerk and R2 (free-tier caps)? | Several designs (PDF stamping, cron jobs, direct-to-R2 upload) depend on these limits | FEAT-09, FEAT-17, FEAT-18, FEAT-27, R-02 through R-05 | Verify against each provider's current official pricing and limits pages before the stack checkpoint | OPEN |
| OQ-07 | What R2 storage allowance should the dashboard bar measure against? | FEAT-14's storage bar needs a configured ceiling, not a guess | FEAT-14, API-21 | Confirm the plan in use and its allowance | OPEN |
| OQ-08 | What is the final PDF upload size limit? | Upload validation and user messaging depend on an exact number | FEAT-17, API-28 | Owner confirms or accepts the proposed 25 MB | OPEN |
| OQ-09 | Is `faculty@docmubashirchaudhary.com` the correct corrections-contact address, given the site name is spelled "chaudhry"? | A wrong address means student corrections never arrive | FEAT-05, UI-033 | Owner to confirm the exact address | OPEN |
| OQ-10 | What is the source and licence of the PPSC, FPSC, NTS and CSS/PMS commission logos already in use? | Legal and trust risk if logos are not properly licensed | UI-002, UI-003, UI-004 | Owner to confirm source | OPEN |
| OQ-11 | Should PDF uploads get malware/virus scanning? | Upload-safety completeness | FEAT-17, BACKEND_PRD section 4.6 | Decide at build time; current assessment is low risk since only trusted admins upload | OPEN |
| OQ-12 | Should a negative total score be shown as a negative number, or floored at zero for display? | Result-screen wording and the score column in CSV exports | FEAT-10, DEC-025 | Owner decides | OPEN |

## Assumptions
| ID | Assumption | Reason used | Validation needed | Status |
|---|---|---|---|---|
| A-01 | Only the World Geography module is kept from any existing work; everything else is specified as new | No access to the real deployed code (OQ-01) | Confirmed by the owner in chat | FINALIZED |
| A-02 | The Geography quiz keeps running fully in the browser, open to everyone, with no save to user history | No decision yet on OQ-03 | Owner confirmation (DEC-022) | ASSUMPTION |
| A-03 | Exactly two people hold the admin role, with no restrictions between them | Owner's explicit statement | None, already confirmed | FINALIZED |
| A-04 | The real deployed code still uses Next.js, React, TypeScript and the App Router | Seen in an older repo snapshot and inferred from the live site's behavior | Confirm once repo access exists (OQ-01) | ASSUMPTION |
| A-05 | The real deployed code still uses Tailwind CSS for styling | Same basis as A-04 | Confirm once repo access exists (OQ-01) | ASSUMPTION |

## Change history
| Date | Decision ID | Previous state | New state | Approval | Documents synchronized |
|---|---|---|---|---|---|
| 2026-11-14 | DEC-005 | PROPOSED (three roles: Owner, Admin, Editor) | FINALIZED (one role, Admin, no restrictions) | Project contact, in chat | `MASTER_PRD.md`, `BACKEND_PRD.md` |
| 2026-11-14 | DEC-006 | Draft used "student" in early notes | FINALIZED ("user" only) | Project contact, in chat | `MASTER_PRD.md`, `FRONTEND_PRD.md` |
| 2026-11-14 | DEC-001 | Change request against the live site, assuming its code was reachable | FINALIZED (new platform except Geography) | Project contact, in chat | `MASTER_PRD.md`, `FRONTEND_PRD.md`, `BACKEND_PRD.md` |
