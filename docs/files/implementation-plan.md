# Implementation Plan

> Last updated: 2026-11-14
> Expands the Delivery Plan in `MASTER_PRD.md` section 12 into a working sequence for the engineering skills to follow. Estimates are relative (S, M, L); no dates are promised, since team capacity is not known (`MASTER_PRD.md` section 12). Do not start M1 until the M0 exit criteria are met.

## How to read this plan
Each milestone lists: what it includes (by FEAT, API and DATA ID), what it depends on, what must be true to call it done, and the open items from `DECISION_LOG.md` that could still change its scope. A milestone is not "implementation-ready" while a P0 open item inside it remains unresolved; build it anyway only if the owner accepts the risk explicitly.

## M0: Decisions and access (S, OPEN)
**Includes:** closing OQ-01 through OQ-12.
**Depends on:** owner responses; access to the actually-deployed repository and branch.
**Exit criteria:** every P0-relevant open question in `DECISION_LOG.md` is either closed or explicitly accepted as a risk by the owner; DEC-004 (framework) and DEC-020 (admin safeguards) are confirmed, not just assumed.
**Why first:** every later milestone touches code whose shape depends on these answers, most of all OQ-01 (what actually exists today) and OQ-06 (provider plan limits, which affect M2 through M5's designs directly).

## M1: Identity and admin guard (M, depends on M0)
**Includes:** FEAT-06 (sign up and sign in), FEAT-07 (user profile), FEAT-13 (admin sign-in and protection).
**APIs:** API-01, API-02, API-03, API-04, API-24 (block, though FEAT-23 itself is P1, the status column it writes to is needed from DATA-01's first migration).
**Data:** DATA-01 (profiles), DATA-14 (webhook_events).
**Depends on:** M0; Clerk and Supabase projects provisioned; `ADMIN_EMAILS` environment variable set for both admins (needs OQ-02, Mubashir sir's email).
**Exit criteria:** AC-002, AC-003, AC-004, AC-005, AC-014 all pass. A non-admin visiting `/admin` sees the standard 404. A duplicate Clerk webhook produces exactly one profile row.
**Open items that could still change this milestone:** DEC-020's 2-step-verification requirement is PROPOSED, not yet confirmed; OQ-02.

## M2: Content tools (L, depends on M1)
**Includes:** FEAT-16 (admin quiz and question creation, import, publish), FEAT-17 (easy PDF upload).
**APIs:** API-26, API-27, API-28.
**Data:** DATA-02, DATA-03, DATA-04, DATA-05, DATA-13 (quizzes and questions), DATA-08 (pdf_resources).
**Depends on:** M1 (admin guard must exist before any admin-only write path is built); R2 bucket provisioned; owner has started writing real quiz questions, since this milestone has no content to test with otherwise.
**Exit criteria:** AC-018, AC-019, AC-020 pass. An admin can create a question in English or Urdu, build a quiz from existing questions, and publish it. An admin can upload a real PDF end to end, including the presigned-URL flow in `architecture.md` 3.4.
**Open items:** OQ-08 (final upload size limit); OQ-11 (malware scanning, likely deferred past this milestone given its current low-risk assessment).

## M3: Quiz taking (L, depends on M2)
**Includes:** FEAT-08 (taking quizzes), FEAT-09 (full-length mock tests), FEAT-10 (results and attempt history).
**APIs:** API-05 through API-12.
**Data:** DATA-06, DATA-07.
**Depends on:** M2, since a quiz must exist to attempt one.
**Exit criteria:** AC-006 through AC-011 pass, including the timer auto-submit, the Urdu right-to-left rendering, resume after leaving, and a result screen with explanations that is only visible to its owner.
**Open items:** DEC-022 (does Geography's own quiz plug into this at all, or stay fully separate as assumed); DEC-025 (negative-score display, affects the result screen built here).

## M4: PDF library (M, depends on M2)
**Includes:** FEAT-11 (PDF library), FEAT-12 (my downloads).
**APIs:** API-13 through API-16.
**Data:** DATA-09.
**Depends on:** M1 (download requires an active, non-blocked user) and M2 (a published PDF to download).
**Exit criteria:** AC-012, AC-013 pass. A download is stamped with the user's name, email and access ID, logged, and shown in My Downloads. Risk R-04 (stamping inside serverless limits) has been tested with real file sizes before this milestone is called done, not assumed safe.
**Open items:** R-04 is the main risk; if it fails under real load, this milestone's technical approach (not its scope) changes.

## M5: Admin dashboard and alerts (M, depends on M1, M3, M4)
**Includes:** FEAT-14 (dashboard with storage bar), FEAT-15 (admin users and participation), FEAT-18 (notifications).
**APIs:** API-20, API-21, API-22, API-23, API-25, API-29, API-33 (the digest and finalize-attempts jobs specifically).
**Data:** DATA-10, DATA-15, DATA-18.
**Depends on:** M1 (there must be users to list), M3 (there must be attempts to show participation for) and M4 (there must be downloads to total).
**Exit criteria:** AC-015, AC-016, AC-017, AC-021, AC-022 pass. The storage bar reflects a real R2 measurement, not a placeholder. The daily digest email sends once per day even if the cron fires twice.
**Open items:** DEC-017 (analytics tool for the visits figure on the dashboard), DEC-018 (email service for the digest and new-user email); both are OPEN and this milestone cannot fully close until they are picked.

## M6: Public pages and design (M, depends on M1)
**Includes:** FEAT-01 (home), FEAT-02 (exam hubs), FEAT-04 (search), FEAT-05 (about and footer), FEAT-22 (homepage country card fix), FEAT-30 (practice MCQs, if approved, see DEC-023).
**Data:** DATA-16 (static exam content files), DATA-17 (Geography, unchanged, DEC-012).
**Depends on:** M1 only loosely, since most of this milestone is public and does not require sign-in; it is sequenced here because the header's signed-in state (built in M1) appears on every one of these pages.
**Exit criteria:** AC-001, AC-024, AC-025 pass. The Pakistan homepage card shows only Pakistani Rupee, Urdu and English. The footer shows the owner's exact note and credentials on every page.
**Open items:** DEC-014 (hero photo, still pending the owner's final confirmation of the recommendation); FO-06/OQ-10 (commission logo licensing); DEC-023 (whether FEAT-30 is built at all).

## M7: Security and accessibility (M, depends on M1 through M6)
**Includes:** FEAT-21 (security hardening) across every milestone above.
**Covers:** the full control list in `BACKEND_PRD.md` section 8: admin gating, authorization, database access, input validation, webhook security, CSRF/origin checks, XSS and CSP, security headers, PDF protection, upload safety, quiz integrity, rate limiting, secret handling, logging, audit, dependency hygiene; and the accessibility targets in `FRONTEND_PRD.md` section 9.
**Exit criteria:** AC-023 passes (no critical or high finding open). WCAG 2.2 AA checks pass on public and user pages per NFR-05.
**Open items:** OQ-05 (legal review of Pakistani data-protection duties is outside what this milestone's engineering work can resolve); OQ-09 (confirm the corrections-contact email address before it is published anywhere).

## M8: P1 features (M, depends on M5)
**Includes:** FEAT-19 (activity log), FEAT-20 (site visit counts), FEAT-23 (block or suspend a user, the UI for a capability API-24 already supports from M1), FEAT-24 (delete own account), FEAT-25 (report a wrong question), FEAT-26 (CSV export), FEAT-27 (weekly backup), FEAT-28 (site-down alert), FEAT-29 (download volume flag).
**APIs:** API-04, API-17, API-30, API-31, API-32, API-33 (the reconcile and backup-adjacent jobs), API-34.
**Data:** DATA-11, DATA-12.
**Depends on:** M5, since most of these extend the admin dashboard built there.
**Exit criteria:** AC-026 through AC-032 pass.
**Open items:** DEC-024 (exact account-deletion data handling); DEC-017/DEC-018 if not already closed in M5.

## M9: Launch (S, depends on M7)
**Includes:** final run-through of every P0 acceptance criterion (AC-001 through AC-025 at minimum; AC-026 onward if P1 shipped alongside P0), a restore drill from a real backup, and the launch checklist implied by `BACKEND_PRD.md` section 8 and 9 (no critical or high security finding open; secrets rotated out of any shared channel used during build; monitoring and the uptime check live).
**Exit criteria:** launch checklist complete, owner sign-off.

## Testing carried through every milestone
Pulled from `BACKEND_PRD.md` section 11 and `FRONTEND_PRD.md` section 13, not repeated per milestone above: scoring unit tests (including negative marking and Urdu text), timer and expiry rules, import validation, authorization checks (a user cannot read another user's result; a non-admin always gets 404), webhook replay and forgery tests, oversized or non-PDF upload rejection, end-to-end sign-up-to-first-quiz and sign-up-to-first-download flows.

## Sequencing notes
- M2, M3 and M4 can run partly in parallel once M1 is done, since quiz-building (M2) and PDF upload (M2) do not depend on each other; M3 depends on M2's quiz side only, M4 on M2's PDF side only.
- M6 (public pages) can start as soon as M1's header component exists; it does not need to wait for M3 through M5 to finish, only to show the right signed-in state once they land.
- M7 (security) is listed as its own milestone because it cuts across all the others, not because it is a separate, separately schedulable chunk of work; individual controls (input validation, origin checks) should be built into M1 through M6 as they are written, with M7 as the dedicated review and closeout pass.

## What this plan does not do
It does not assign dates, does not assume a team size, and does not promise that the relative sizes above are accurate without the owner and whoever builds this agreeing on them. It also does not resolve any OPEN decision; see `DECISION_LOG.md` for those and `MASTER_PRD.md` section 13 for the full risk register.
