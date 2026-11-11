# Backend Testing Strategy

> Status: Executed & Passing (47/47 Vitest Tests across 7 Suites + CLI Validation + Next Build)  
> Last updated: 2026-11-11

## 1. Quality goals
Verify zero-regression data integrity across all JSON entities, strict separation of official vs editorial claims, deterministic Geography quiz distractor and accepted-answer correctness, resilient browser storage when `localStorage` fails, fast typo-tolerant client search, and zero exposed credentials.

## 2. Test environment
- **Test runner:** Vitest running in Node/jsdom-safe pure TypeScript tests (`npm test`).
- **Fixtures:** Isolated synthetic negative test fixtures inside unit tests for testing validator failure cases without mutating canonical `src/data/*.json`.
- **No external network calls in unit tests:** `ContentRepository`, validator, quiz engine, storage wrapper, and search engine run deterministically offline.

## 3. Test layers
| Layer | Tools | Scope | Run command |
|---|---|---|---|
| Data & PDF Integrity CLI | `tsx` + Zod + Node crypto | All 15 PRD Section 8.6 rules on production `src/data/` + PDF SHA-256 & `%PDF-` bytes | `npm run validate` |
| Static Artifact Build | `tsx` + MiniSearch | Builds `/public/data/v1/` bundles, `manifest.json`, and serialized search index | `npm run data:build` |
| Unit & Integration Suite | `vitest` | Schemas, 15 validator negative cases (+ duplicate hash & unsafe PDF path), `JsonContentRepository` pagination, `/api/countries` & `/api/questions` route handlers, Logo.dev/subject branding catalogs, `lib/quiz`, `lib/storage`, `lib/search`, `mailto:` builder | `npm test` |
| Type Safety | `tsc` | Full codebase static type check (`strict: true`) | `npm run typecheck` |
| Production Bundle | `next build` | Next.js build verifying server/static compilation with wired data layer | `npm run build` |

## 4. Critical acceptance scenarios
1. Multi-capital country (South Africa: Pretoria, Cape Town, Bloemfontein) accepts any valid capital case-insensitively and never renders another valid capital as a distractor.
2. Shared currency (Eurozone EUR across Germany/France/etc.) excludes countries sharing EUR when generating currency distractors.
3. Country with `disputed.capital = true` or `verification.status !== 'verified'` is excluded from generating verified capital MCQs.
4. Validator rejects published record with `verification.status: 'unverified'`, mismatched `correctOptionId`, broken foreign key, missing PDF file, or corrupted SHA-256.
5. `storage` falls back transparently to in-memory storage when `localStorage` throws or is undefined, and resets when `datasetVersion` changes.
6. `ContentRepository` cleanly separates `officialSections` from `editorialTopicWeights` on PPSC blueprints.
7. Validator enforces `R10_PDF_NO_DUPLICATE_HASH` on disk inside `public/documents/` and `R12_SAFE_PDF_PATH` allows spaces/parentheses only within normalized `/documents/*.pdf` paths while rejecting `..` or query params.
8. Pagination helpers and Next.js Route Handlers (`/api/countries`, `/api/questions`) return clamped `PaginatedResult<T>` metadata with `200` on valid filters and `400` on invalid bounds/enum parameters.
9. Branding catalog exposes deterministic Logo.dev CDN URLs for live domains (`ppsc.gop.pk`, `fpsc.gov.pk`, `nts.org.pk`, `spsc.gos.pk`), `logoUrl: null` monogram fallback for 404 domains (`kppsc.gov.pk`, `bpsc.gob.pk`), and icon/badge metadata across all 9 canonical subjects.

## 5. Known limitations
- `npm run lint` (`next lint`) requires interactive setup because no ESLint config file exists in the repository root; static verification relies on `tsc --noEmit`, `vitest`, `validate.ts`, and `next build`.
- `scripts/check-links.ts` makes outbound HTTP `HEAD`/`GET` checks and is exercised separately from offline unit tests.
