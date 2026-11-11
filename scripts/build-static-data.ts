import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadDefaultSnapshot } from '../src/lib/data/json-repository';
import { toLegacyCountry } from '../src/lib/data/legacy-adapter';
import { paginateItems } from '../src/lib/data/repository';
import { EXAM_BRANDING_CATALOG } from '../src/lib/branding/logos';
import { validateDatasetBundle } from '../src/lib/validation/dataset-validator';
import { DatasetManifestSchema } from '../src/lib/schemas';
import { PortalSearchEngine } from '../src/lib/search';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'data', 'v1');

function sha256Hex(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function writeArtifact(
  relPath: string,
  payload: unknown,
  filesMap: Record<string, { bytes: number; sha256: string }>
): void {
  const fullPath = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  fs.writeFileSync(fullPath, serialized, 'utf8');
  const bytes = Buffer.byteLength(serialized, 'utf8');
  filesMap[relPath.replace(/\\/g, '/')] = {
    bytes,
    sha256: sha256Hex(serialized)
  };
}

function main(): void {
  const snapshot = loadDefaultSnapshot();
  const report = validateDatasetBundle(snapshot, {
    publicRootDir: path.join(rootDir, 'public'),
    referenceDate: new Date()
  });

  if (!report.valid) {
    console.error('Refusing to build static artifacts because validation failed:');
    for (const err of report.errors) {
      console.error(`  [FAIL] ${err.ruleId}: ${err.message}`);
    }
    process.exit(1);
  }

  const publishedCountries = snapshot.countries.filter((c) => c.status === 'published');
  const continentsById = new Map(snapshot.continents.map((c) => [c.id, c]));
  const currenciesById = new Map(snapshot.currencies.map((c) => [c.id, c]));
  const languagesById = new Map(snapshot.languages.map((l) => [l.id, l]));

  const legacyCountries = publishedCountries.map((country) =>
    toLegacyCountry(country, { continentsById, currenciesById, languagesById })
  );

  const searchEngine = PortalSearchEngine.fromDataset({
    countries: publishedCountries,
    regions: snapshot.regions,
    currencies: snapshot.currencies,
    languages: snapshot.languages,
    exams: snapshot.exams.filter((e) => e.status === 'published'),
    recruitmentPosts: snapshot.recruitmentPosts,
    pdfResources: snapshot.pdfResources.filter((p) => p.status === 'published'),
    questions: snapshot.questions.filter((q) => q.status === 'published')
  });

  const filesMap: Record<string, { bytes: number; sha256: string }> = {};

  fs.rmSync(path.join(outDir, 'geography', 'pages'), { recursive: true, force: true });
  fs.rmSync(path.join(outDir, 'questions', 'pages'), { recursive: true, force: true });

  writeArtifact('sources.json', { sources: snapshot.sources }, filesMap);
  writeArtifact(
    'geography/reference.json',
    {
      continents: snapshot.continents,
      regions: snapshot.regions,
      currencies: snapshot.currencies,
      languages: snapshot.languages,
      questionRules: snapshot.questionRules
    },
    filesMap
  );
  writeArtifact('geography/countries.json', { countries: publishedCountries }, filesMap);
  writeArtifact('geography/countries-quiz-v1.json', legacyCountries, filesMap);

  const countryPageSize = 24;
  const countryTotalPages = Math.max(1, Math.ceil(publishedCountries.length / countryPageSize));
  const countryPageUrls: string[] = [];
  for (let page = 1; page <= countryTotalPages; page += 1) {
    const slice = paginateItems(publishedCountries, { page, pageSize: countryPageSize }, countryPageSize);
    const relPage = `geography/pages/page-${page}.json`;
    writeArtifact(relPage, slice, filesMap);
    countryPageUrls.push(`/data/v1/${relPage}`);
  }
  writeArtifact(
    'geography/pages/index.json',
    {
      pageSize: countryPageSize,
      totalItems: publishedCountries.length,
      totalPages: publishedCountries.length === 0 ? 0 : countryTotalPages,
      pages: publishedCountries.length === 0 ? [] : countryPageUrls
    },
    filesMap
  );

  writeArtifact(
    'examinations/exams.json',
    { exams: snapshot.exams.filter((e) => e.status === 'published') },
    filesMap
  );
  writeArtifact(
    'examinations/branding.json',
    { schemaVersion: 1, commissions: EXAM_BRANDING_CATALOG },
    filesMap
  );
  writeArtifact('examinations/posts-ppsc.json', { posts: snapshot.recruitmentPosts }, filesMap);
  writeArtifact(
    'examinations/blueprints-ppsc.json',
    { blueprints: snapshot.blueprints.filter((b) => b.status === 'published') },
    filesMap
  );
  writeArtifact('taxonomy/subjects.json', { subjects: snapshot.subjects }, filesMap);
  writeArtifact('taxonomy/topics.json', { topics: snapshot.topics }, filesMap);

  const publishedQuestions = snapshot.questions.filter((q) => q.status === 'published');
  writeArtifact('questions/ppsc-samples.json', { questions: publishedQuestions }, filesMap);

  const questionPageSize = 20;
  const questionTotalPages = Math.max(1, Math.ceil(publishedQuestions.length / questionPageSize));
  const questionPageUrls: string[] = [];
  for (let page = 1; page <= questionTotalPages; page += 1) {
    const slice = paginateItems(publishedQuestions, { page, pageSize: questionPageSize }, questionPageSize);
    const relPage = `questions/pages/page-${page}.json`;
    writeArtifact(relPage, slice, filesMap);
    questionPageUrls.push(`/data/v1/${relPage}`);
  }
  writeArtifact(
    'questions/pages/index.json',
    {
      pageSize: questionPageSize,
      totalItems: publishedQuestions.length,
      totalPages: publishedQuestions.length === 0 ? 0 : questionTotalPages,
      pages: publishedQuestions.length === 0 ? [] : questionPageUrls
    },
    filesMap
  );

  writeArtifact(
    'resources/pdfs.json',
    { pdfResources: snapshot.pdfResources.filter((p) => p.status === 'published') },
    filesMap
  );
  writeArtifact('search-index/all.json', searchEngine.toJSON(), filesMap);

  // Content-addressed dataset version derived deterministically from emitted file hashes
  const digestSeed = Object.keys(filesMap)
    .sort()
    .map((k) => `${k}:${filesMap[k].sha256}`)
    .join('|');
  const datasetVersion = `v1-${sha256Hex(digestSeed).slice(0, 12)}`;

  const manifest = DatasetManifestSchema.parse({
    datasetVersion,
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    counts: {
      sources: snapshot.sources.length,
      continents: snapshot.continents.length,
      regions: snapshot.regions.length,
      currencies: snapshot.currencies.length,
      languages: snapshot.languages.length,
      countriesTotal: snapshot.countries.length,
      countriesPublished: publishedCountries.length,
      exams: snapshot.exams.filter((e) => e.status === 'published').length,
      recruitmentPosts: snapshot.recruitmentPosts.length,
      blueprints: snapshot.blueprints.filter((b) => b.status === 'published').length,
      questions: snapshot.questions.filter((q) => q.status === 'published').length,
      pdfResources: snapshot.pdfResources.filter((p) => p.status === 'published').length
    },
    files: filesMap
  });

  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`Built static /data/v1/ artifacts (datasetVersion=${datasetVersion}):`);
  for (const [rel, meta] of Object.entries(filesMap)) {
    console.log(`  - ${rel} (${(meta.bytes / 1024).toFixed(1)} KB, sha256=${meta.sha256.slice(0, 10)}...)`);
  }
}

main();

