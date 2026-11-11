# JSON Content Model & Storage Design (Database-Free)

> Status: Confirmed (PRD v2.0 Mandate)  
> Last updated: 2026-11-11

## 1. Storage technology
Version-controlled JSON files under `src/data/` validated with **Zod** (`src/lib/schemas/`) and compiled at build time into immutable/versioned static slices under `public/data/v1/`. Per PRD Section 6.3, relational/document databases and ORMs are explicitly excluded.

## 2. Data ownership and tenancy
- Single public educational catalog (`docmubashirchaudhry` editorial repository).
- No user accounts, multi-tenancy, or private user tables.
- Anonymous student quiz progress resides strictly inside client `localStorage` under namespaced keys (`dmc:v1:geography-quiz`, `dmc:v1:mcq`) with an instant "Clear my progress" action and zero server transmission.

## 3. Canonical entities & collections (`src/data/`)
| Entity | File location | Primary key / slug | Key provenance & constraints |
|---|---|---|---|
| `Source` | `src/data/sources.json` | `id` | `authorityType` (`official_commission`, `official_gazette`, `un_geodata`, `editorial`, `secondary_portal`), `url`, `accessedAt`, `reliability` (`primary` \| `secondary`) - 8 citations including `src-mledoze-countries` |
| `Continent` | `src/data/geography/continents.json` | `id`, `slug` | 6 continents (`Asia`, `Europe`, `Africa`, `Americas`, `Oceania`, `Antarctica`) |
| `Region` | `src/data/geography/regions.json` | `id`, `slug` | 25 UN M49 subregions + `reg-antarctic`, `continentId -> Continent.id` |
| `Currency` | `src/data/geography/currencies.json` | `id`, `code` (ISO 4217) | 160 currencies with `symbol` and `minorUnit` (`0`, `2`, `3`) |
| `Language` | `src/data/geography/languages.json` | `id`, `iso639_1` / `iso639_2` | 154 languages with `name`, optional `nativeName`, `family` |
| `Country` | `src/data/geography/countries.json` | `id`, `slug`, `isoAlpha2`, `isoAlpha3` | All 250 countries & territories (194 sovereign UN states); multi-value arrays `capitals[]`, `currencyIds[]`, `officialLanguageIds[]`; per-country `disputed` flags & `verification` provenance |
| `Exam` | `src/data/examinations/exams.json` | `id`, `slug` | `bodyCode`, optional `logoDomain`, `logoUrl` (Logo.dev CDN), `fallbackMonogram`, `status`, `verification` |
| `RecruitmentPost` | `src/data/examinations/ppsc/recruitment-posts.json` | `id`, `slug` | `examId`, `basicScale` (data-driven per F1), `advertisementNo`, `caseNo`, `heldConditional` (F3), `verification` |
| `Blueprint` | `src/data/examinations/ppsc/blueprints.json` | `id`, `version` | Strictly separates `officialSections` (`officialMarksPct` nullable) from `editorialTopicWeights` (author estimation only) |
| `Subject` & `Topic` | `src/data/taxonomy/subjects.json`, `topics.json` | `id`, `slug` | Hierarchical taxonomy (9 subjects with `iconName`, `badgeLabel`, optional `iconUrl`; 10 topics) linking Blueprint, Question, and PdfResource |
| `Question` | `src/data/questions/**/*.json` | `id` | 4-5 MCQ options, `correctOptionId`, explanation, attribution (`self_written`, `past_paper_memory`, `public_domain`, `licensed`), `verification` |
| `PdfResource` | `src/data/resources/pdf-resources.json` | `id`, `slug` | `filePath` (verified non-duplicated `%PDF-` file under `/documents/`), exact `fileSizeBytes`, `sha256`, `rights`, `verification` |

## 4. Relationships and referential rules (PRD Section 8.6)
15 automated checks run via `npm run validate`:
1. Unique IDs and slugs within every collection.
2. Foreign keys (`country.continentId`, `country.regionId`, `country.currencyIds[]`, `country.officialLanguageIds[]`, `post.examId`, `blueprint.postId`, `question.topicIds[]`, `pdf.postIds[]`, `*.verification.sourceIds[]`) must resolve.
3. No published (`status: "published"`) record may hold `verification.status: "unverified"` or empty `sourceIds`.
4. Editorial syllabus estimates (`editorialTopicWeights`) are stored in a dedicated field separate from `officialSections`, prohibiting unlabeled official marks mixing.
5. `PdfResource.fileSizeBytes` and `sha256` must match bytes on disk; file magic bytes must begin with `%PDF-`; `R10_PDF_NO_DUPLICATE_HASH` forbids duplicate `.pdf` SHA-256 binaries inside `public/documents/`; `R12_SAFE_PDF_PATH` restricts paths to clean `/documents/*.pdf` entries without `..`, query/hash strings, or control characters.
6. Any record marked `disputed: true` must carry a non-empty `disputedNote` and exclude affected fact fields from auto-generated MCQ options.

## 5. Build-time static artifacts (`public/data/v1/`)
Generated deterministically via `npm run data:build`:
- `manifest.json`: `datasetVersion`, `generatedAt`, per-file SHA-256 checksums, entity counts.
- `geography/reference.json`, `geography/countries.json`, `geography/countries-quiz-v1.json`, `geography/pages/index.json` + `geography/pages/page-*.json`.
- `examinations/exams.json`, `examinations/branding.json`, `examinations/posts-ppsc.json`, `examinations/blueprints-ppsc.json`.
- `taxonomy/subjects.json`, `taxonomy/topics.json`.
- `resources/pdfs.json`, `questions/ppsc-samples.json`, `questions/pages/index.json` + `questions/pages/page-*.json`, `sources.json`.
- `search-index/all.json`: Pre-built serialized MiniSearch index.

## 6. Pending owner verification items
- Complete editorial review of synced sovereign states (`194`) and territories (`56`) across all 250 records beyond the initial 45 manually annotated entries (automated sync attached `src-mledoze-countries` + `src-un-geodata-m49` + `src-iso-4217`).
- Official `ppsc.gop.pk` advertisement/syllabus PDF attachment for PPSC Ad 11/2026 Intelligence Officer (currently held `unverified` / secondary-source cited per Finding F4).

