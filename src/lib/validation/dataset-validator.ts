import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import {
  BlueprintSchema,
  ContinentSchema,
  CountryEntitySchema,
  CountryQuizRuleSchema,
  CurrencySchema,
  ExamSchema,
  LanguageSchema,
  PdfResourceSchema,
  QuestionSchema,
  RecruitmentPostSchema,
  RegionSchema,
  SourceSchema,
  SubjectSchema,
  TopicSchema,
  type Blueprint,
  type Continent,
  type CountryEntity,
  type CountryQuizRule,
  type Currency,
  type Exam,
  type Language,
  type PdfResource,
  type Question,
  type RecruitmentPost,
  type Region,
  type Source,
  type Subject,
  type Topic,
  type Verification
} from '@/lib/schemas';

export interface DatasetBundleInput {
  sources: unknown[];
  continents: unknown[];
  regions: unknown[];
  currencies: unknown[];
  languages: unknown[];
  countries: unknown[];
  questionRules: unknown;
  exams: unknown[];
  recruitmentPosts: unknown[];
  blueprints: unknown[];
  subjects: unknown[];
  topics: unknown[];
  questions: unknown[];
  pdfResources: unknown[];
}

export interface ValidationIssue {
  ruleId: string;
  severity: 'error' | 'warning';
  entityType: string;
  entityId?: string;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  counts: Record<string, number>;
}

function collectPdfFilesRecursive(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPdfFilesRecursive(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      results.push(full);
    }
  }
  return results;
}

const SECRET_PATTERNS = [/rc_live_[a-zA-Z0-9]+/i, /sk_live_[a-zA-Z0-9]+/i, /BEGIN (?:RSA )?PRIVATE KEY/];

function addUniqueCheck<T extends { id: string; slug?: string }>(
  items: T[],
  entityType: string,
  errors: ValidationIssue[]
): { byId: Map<string, T> } {
  const byId = new Map<string, T>();
  const seenSlugs = new Set<string>();

  for (const item of items) {
    if (byId.has(item.id)) {
      errors.push({
        ruleId: 'R02_UNIQUE_ID',
        severity: 'error',
        entityType,
        entityId: item.id,
        message: `Duplicate id "${item.id}" in ${entityType}`
      });
    } else {
      byId.set(item.id, item);
    }

    if (item.slug) {
      if (seenSlugs.has(item.slug)) {
        errors.push({
          ruleId: 'R02_UNIQUE_SLUG',
          severity: 'error',
          entityType,
          entityId: item.id,
          message: `Duplicate slug "${item.slug}" in ${entityType}`
        });
      } else {
        seenSlugs.add(item.slug);
      }
    }
  }
  return { byId };
}

function checkVerificationGate(
  entityType: string,
  entityId: string,
  publishStatus: string,
  verification: Verification,
  sourceMap: Map<string, Source>,
  referenceDate: Date,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): void {
  if (verification.sourceIds.length === 0) {
    errors.push({
      ruleId: 'R04_EMPTY_SOURCES',
      severity: 'error',
      entityType,
      entityId,
      message: `${entityType} "${entityId}" has an empty sourceIds array`
    });
  }

  for (const sourceId of verification.sourceIds) {
    if (!sourceMap.has(sourceId)) {
      errors.push({
        ruleId: 'R03_FK_SOURCE',
        severity: 'error',
        entityType,
        entityId,
        message: `${entityType} "${entityId}" references missing sourceId "${sourceId}"`
      });
    }
  }

  if (publishStatus === 'published' && verification.status === 'unverified') {
    errors.push({
      ruleId: 'R04_PUBLISHED_UNVERIFIED',
      severity: 'error',
      entityType,
      entityId,
      message: `Published ${entityType} "${entityId}" cannot have verification.status="unverified"`
    });
  }

  if (verification.status === 'verified' && !verification.verifiedAt) {
    errors.push({
      ruleId: 'R05_VERIFIED_DATE_REQUIRED',
      severity: 'error',
      entityType,
      entityId,
      message: `${entityType} "${entityId}" is marked verified but is missing verifiedAt`
    });
  }

  const lastCheckedMs = Date.parse(verification.lastCheckedAt);
  if (!Number.isNaN(lastCheckedMs)) {
    const dueMs = lastCheckedMs + verification.reviewIntervalDays * 86_400_000;
    if (referenceDate.getTime() > dueMs) {
      warnings.push({
        ruleId: 'R14_REVIEW_OVERDUE',
        severity: 'warning',
        entityType,
        entityId,
        message: `${entityType} "${entityId}" review overdue (lastCheckedAt=${verification.lastCheckedAt}, interval=${verification.reviewIntervalDays}d)`
      });
    }
  }
}

export interface ValidateOptions {
  publicRootDir?: string;
  referenceDate?: Date;
}

/**
 * Validates the complete JSON content dataset against all 15 PRD Section 8.6 rules.
 */
export function validateDatasetBundle(
  input: DatasetBundleInput,
  options: ValidateOptions = {}
): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const referenceDate = options.referenceDate ?? new Date('2026-11-11T00:00:00Z');

  function parseCollection<S extends z.ZodTypeAny>(
    rawList: unknown[],
    schema: S,
    entityType: string
  ): z.infer<S>[] {
    const parsed: z.infer<S>[] = [];
    rawList.forEach((rawItem, idx) => {
      const res = schema.safeParse(rawItem);
      if (!res.success) {
        const idHint =
          typeof rawItem === 'object' && rawItem !== null && 'id' in rawItem
            ? String((rawItem as { id: unknown }).id)
            : `index-${idx}`;
        errors.push({
          ruleId: 'R01_SCHEMA_VALIDATION',
          severity: 'error',
          entityType,
          entityId: idHint,
          message: res.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`).join('; ')
        });
      } else {
        parsed.push(res.data);
      }
    });
    return parsed;
  }

  // Rule 1: Zod schema validation
  const sources = parseCollection(input.sources, SourceSchema, 'Source') as Source[];
  const continents = parseCollection(input.continents, ContinentSchema, 'Continent') as Continent[];
  const regions = parseCollection(input.regions, RegionSchema, 'Region') as Region[];
  const currencies = parseCollection(input.currencies, CurrencySchema, 'Currency') as Currency[];
  const languages = parseCollection(input.languages, LanguageSchema, 'Language') as Language[];
  const countries = parseCollection(input.countries, CountryEntitySchema, 'Country') as CountryEntity[];
  const exams = parseCollection(input.exams, ExamSchema, 'Exam') as Exam[];
  const posts = parseCollection(input.recruitmentPosts, RecruitmentPostSchema, 'RecruitmentPost') as RecruitmentPost[];
  const blueprints = parseCollection(input.blueprints, BlueprintSchema, 'Blueprint') as Blueprint[];
  const subjects = parseCollection(input.subjects, SubjectSchema, 'Subject') as Subject[];
  const topics = parseCollection(input.topics, TopicSchema, 'Topic') as Topic[];
  const questions = parseCollection(input.questions, QuestionSchema, 'Question') as Question[];
  const pdfResources = parseCollection(input.pdfResources, PdfResourceSchema, 'PdfResource') as PdfResource[];

  const ruleParse = CountryQuizRuleSchema.safeParse(input.questionRules);
  if (!ruleParse.success) {
    errors.push({
      ruleId: 'R01_SCHEMA_VALIDATION',
      severity: 'error',
      entityType: 'CountryQuizRule',
      message: ruleParse.error.issues.map((i) => i.message).join('; ')
    });
  }

  // Rule 2: Unique IDs & slugs + ISO/currency code uniqueness
  const { byId: sourceMap } = addUniqueCheck(sources, 'Source', errors);
  const { byId: continentMap } = addUniqueCheck(continents, 'Continent', errors);
  const { byId: regionMap } = addUniqueCheck(regions, 'Region', errors);
  const { byId: currencyMap } = addUniqueCheck(currencies, 'Currency', errors);
  const { byId: languageMap } = addUniqueCheck(languages, 'Language', errors);
  const { byId: countryMap } = addUniqueCheck(countries, 'Country', errors);
  const { byId: examMap } = addUniqueCheck(exams, 'Exam', errors);
  const { byId: postMap } = addUniqueCheck(posts, 'RecruitmentPost', errors);
  const { byId: blueprintMap } = addUniqueCheck(blueprints, 'Blueprint', errors);
  const { byId: subjectMap } = addUniqueCheck(subjects, 'Subject', errors);
  const { byId: topicMap } = addUniqueCheck(topics, 'Topic', errors);
  addUniqueCheck(questions, 'Question', errors);
  const { byId: pdfMap } = addUniqueCheck(pdfResources, 'PdfResource', errors);

  const seenAlpha2 = new Set<string>();
  const seenAlpha3 = new Set<string>();
  for (const country of countries) {
    if (seenAlpha2.has(country.isoAlpha2)) {
      errors.push({
        ruleId: 'R02_UNIQUE_ISO',
        severity: 'error',
        entityType: 'Country',
        entityId: country.id,
        message: `Duplicate isoAlpha2 "${country.isoAlpha2}"`
      });
    }
    seenAlpha2.add(country.isoAlpha2);
    if (seenAlpha3.has(country.isoAlpha3)) {
      errors.push({
        ruleId: 'R02_UNIQUE_ISO',
        severity: 'error',
        entityType: 'Country',
        entityId: country.id,
        message: `Duplicate isoAlpha3 "${country.isoAlpha3}"`
      });
    }
    seenAlpha3.add(country.isoAlpha3);
  }

  // Rule 3-5, 8, 9: Region, Country foreign keys & disputed/verified rules
  for (const region of regions) {
    if (!continentMap.has(region.continentId)) {
      errors.push({
        ruleId: 'R03_FK_CONTINENT',
        severity: 'error',
        entityType: 'Region',
        entityId: region.id,
        message: `Region "${region.id}" references missing continentId "${region.continentId}"`
      });
    }
  }

  for (const country of countries) {
    checkVerificationGate(
      'Country',
      country.id,
      country.status,
      country.verification,
      sourceMap,
      referenceDate,
      errors,
      warnings
    );

    if (!continentMap.has(country.continentId)) {
      errors.push({
        ruleId: 'R03_FK_CONTINENT',
        severity: 'error',
        entityType: 'Country',
        entityId: country.id,
        message: `Country "${country.id}" references missing continentId "${country.continentId}"`
      });
    }

    const region = regionMap.get(country.regionId);
    if (!region) {
      errors.push({
        ruleId: 'R03_FK_REGION',
        severity: 'error',
        entityType: 'Country',
        entityId: country.id,
        message: `Country "${country.id}" references missing regionId "${country.regionId}"`
      });
    } else if (region.continentId !== country.continentId) {
      errors.push({
        ruleId: 'R03_REGION_CONTINENT_MISMATCH',
        severity: 'error',
        entityType: 'Country',
        entityId: country.id,
        message: `Country "${country.id}" continentId "${country.continentId}" disagrees with region "${region.id}" (${region.continentId})`
      });
    }

    for (const cid of country.currencyIds) {
      if (!currencyMap.has(cid)) {
        errors.push({
          ruleId: 'R03_FK_CURRENCY',
          severity: 'error',
          entityType: 'Country',
          entityId: country.id,
          message: `Country "${country.id}" references missing currencyId "${cid}"`
        });
      }
    }

    for (const lid of country.officialLanguageIds) {
      if (!languageMap.has(lid)) {
        errors.push({
          ruleId: 'R03_FK_LANGUAGE',
          severity: 'error',
          entityType: 'Country',
          entityId: country.id,
          message: `Country "${country.id}" references missing officialLanguageId "${lid}"`
        });
      }
    }

    if (
      country.status === 'published' &&
      country.isSovereign &&
      !country.disputed?.capital &&
      country.capitals.length === 0
    ) {
      errors.push({
        ruleId: 'R08_COUNTRY_CAPITAL_REQUIRED',
        severity: 'error',
        entityType: 'Country',
        entityId: country.id,
        message: `Published sovereign country "${country.id}" has no capitals`
      });
    }

    if (country.status === 'published' && country.isSovereign && country.currencyIds.length === 0) {
      errors.push({
        ruleId: 'R08_COUNTRY_CURRENCY_REQUIRED',
        severity: 'error',
        entityType: 'Country',
        entityId: country.id,
        message: `Published sovereign country "${country.id}" has no currencyIds`
      });
    }

    if (country.status === 'published' && country.isSovereign && country.officialLanguageIds.length === 0) {
      errors.push({
        ruleId: 'R08_COUNTRY_LANGUAGE_REQUIRED',
        severity: 'error',
        entityType: 'Country',
        entityId: country.id,
        message: `Published sovereign country "${country.id}" has no officialLanguageIds`
      });
    }
  }

  // Rule 15: Minimum distractor availability for verified quiz facts
  const verifiedNonDisputedCapitals = new Set(
    countries
      .filter((c) => c.status === 'published' && c.verification.status === 'verified' && !c.disputed?.capital && !c.disputed?.sovereignty)
      .flatMap((c) => c.capitals.map((cap) => cap.trim().toLowerCase()))
  );
  if (countries.length > 0 && verifiedNonDisputedCapitals.size < 4) {
    errors.push({
      ruleId: 'R15_QUIZ_DISTRACTOR_POOL',
      severity: 'error',
      entityType: 'Country',
      message: `Insufficient verified distinct capitals (${verifiedNonDisputedCapitals.size}) for 4-option MCQ generation`
    });
  }

  // Taxonomy foreign keys
  for (const topic of topics) {
    if (!subjectMap.has(topic.subjectId)) {
      errors.push({
        ruleId: 'R03_FK_SUBJECT',
        severity: 'error',
        entityType: 'Topic',
        entityId: topic.id,
        message: `Topic "${topic.id}" references missing subjectId "${topic.subjectId}"`
      });
    }
    if (topic.parentTopicId && !topicMap.has(topic.parentTopicId)) {
      errors.push({
        ruleId: 'R03_FK_PARENT_TOPIC',
        severity: 'error',
        entityType: 'Topic',
        entityId: topic.id,
        message: `Topic "${topic.id}" references missing parentTopicId "${topic.parentTopicId}"`
      });
    }
  }

  // Exams
  for (const exam of exams) {
    checkVerificationGate('Exam', exam.id, exam.status, exam.verification, sourceMap, referenceDate, errors, warnings);
  }

  // Recruitment posts
  for (const post of posts) {
    checkVerificationGate(
      'RecruitmentPost',
      post.id,
      post.status,
      post.verification,
      sourceMap,
      referenceDate,
      errors,
      warnings
    );

    if (!examMap.has(post.examId)) {
      errors.push({
        ruleId: 'R03_FK_EXAM',
        severity: 'error',
        entityType: 'RecruitmentPost',
        entityId: post.id,
        message: `RecruitmentPost "${post.id}" references missing examId "${post.examId}"`
      });
    }
    if (post.blueprintId && !blueprintMap.has(post.blueprintId)) {
      errors.push({
        ruleId: 'R03_FK_BLUEPRINT',
        severity: 'error',
        entityType: 'RecruitmentPost',
        entityId: post.id,
        message: `RecruitmentPost "${post.id}" references missing blueprintId "${post.blueprintId}"`
      });
    }
    for (const tid of post.topicIds) {
      if (!topicMap.has(tid)) {
        errors.push({
          ruleId: 'R03_FK_TOPIC',
          severity: 'error',
          entityType: 'RecruitmentPost',
          entityId: post.id,
          message: `RecruitmentPost "${post.id}" references missing topicId "${tid}"`
        });
      }
    }
    for (const pdfId of post.pdfResourceIds) {
      if (!pdfMap.has(pdfId)) {
        errors.push({
          ruleId: 'R03_FK_PDF',
          severity: 'error',
          entityType: 'RecruitmentPost',
          entityId: post.id,
          message: `RecruitmentPost "${post.id}" references missing pdfResourceId "${pdfId}"`
        });
      }
    }
  }

  // Blueprint separation & uniqueness (Rules 6 & 11)
  const seenBlueprintVersions = new Set<string>();
  for (const bp of blueprints) {
    checkVerificationGate('Blueprint', bp.id, bp.status, bp.verification, sourceMap, referenceDate, errors, warnings);

    const verKey = `${bp.postId}@v${bp.version}`;
    if (seenBlueprintVersions.has(verKey)) {
      errors.push({
        ruleId: 'R11_UNIQUE_BLUEPRINT_VERSION',
        severity: 'error',
        entityType: 'Blueprint',
        entityId: bp.id,
        message: `Duplicate blueprint version "${verKey}"`
      });
    }
    seenBlueprintVersions.add(verKey);

    if (!postMap.has(bp.postId)) {
      errors.push({
        ruleId: 'R03_FK_POST',
        severity: 'error',
        entityType: 'Blueprint',
        entityId: bp.id,
        message: `Blueprint "${bp.id}" references missing postId "${bp.postId}"`
      });
    }

    const officialPctSum = bp.officialSections.reduce(
      (sum, sec) => sum + (sec.officialMarksPct ?? 0),
      0
    );
    if (officialPctSum > 100) {
      errors.push({
        ruleId: 'R06_BLUEPRINT_OFFICIAL_SUM',
        severity: 'error',
        entityType: 'Blueprint',
        entityId: bp.id,
        message: `Blueprint "${bp.id}" officialSections percentage sum (${officialPctSum}) exceeds 100`
      });
    }

    if (bp.editorialTopicWeights.length > 0) {
      if (!bp.editorialDisclaimer || !bp.editorialDisclaimer.toLowerCase().includes('editorial')) {
        errors.push({
          ruleId: 'R06_EDITORIAL_DISCLAIMER_REQUIRED',
          severity: 'error',
          entityType: 'Blueprint',
          entityId: bp.id,
          message: `Blueprint "${bp.id}" includes editorialTopicWeights without a clear editorial disclaimer`
        });
      }
      const editorialSum = bp.editorialTopicWeights.reduce((acc, w) => acc + w.estimatedWeightPct, 0);
      if (editorialSum !== 100) {
        errors.push({
          ruleId: 'R06_EDITORIAL_SUM_100',
          severity: 'error',
          entityType: 'Blueprint',
          entityId: bp.id,
          message: `Blueprint "${bp.id}" editorialTopicWeights must total 100%, got ${editorialSum}%`
        });
      }
      for (const w of bp.editorialTopicWeights) {
        if (!topicMap.has(w.topicId)) {
          errors.push({
            ruleId: 'R03_FK_TOPIC',
            severity: 'error',
            entityType: 'Blueprint',
            entityId: bp.id,
            message: `Blueprint "${bp.id}" editorial weight references missing topicId "${w.topicId}"`
          });
        }
      }
    }
  }

  // Questions (Rules 3, 4, 7)
  for (const q of questions) {
    checkVerificationGate('Question', q.id, q.status, q.verification, sourceMap, referenceDate, errors, warnings);

    for (const tid of q.topicIds) {
      if (!topicMap.has(tid)) {
        errors.push({
          ruleId: 'R03_FK_TOPIC',
          severity: 'error',
          entityType: 'Question',
          entityId: q.id,
          message: `Question "${q.id}" references missing topicId "${tid}"`
        });
      }
    }
    for (const pid of q.postIds) {
      if (!postMap.has(pid)) {
        errors.push({
          ruleId: 'R03_FK_POST',
          severity: 'error',
          entityType: 'Question',
          entityId: q.id,
          message: `Question "${q.id}" references missing postId "${pid}"`
        });
      }
    }

    const normOptionTexts = new Set<string>();
    for (const opt of q.options) {
      const normalized = opt.text.trim().toLowerCase();
      if (normOptionTexts.has(normalized)) {
        errors.push({
          ruleId: 'R07_DUPLICATE_OPTION_TEXT',
          severity: 'error',
          entityType: 'Question',
          entityId: q.id,
          message: `Question "${q.id}" has duplicate option text "${opt.text}"`
        });
      }
      normOptionTexts.add(normalized);
    }
  }

  // PDF Resources & disk verification (Rules 3, 4, 10, 12)
  for (const pdf of pdfResources) {
    checkVerificationGate('PdfResource', pdf.id, pdf.status, pdf.verification, sourceMap, referenceDate, errors, warnings);

    for (const pid of pdf.postIds) {
      if (!postMap.has(pid)) {
        errors.push({
          ruleId: 'R03_FK_POST',
          severity: 'error',
          entityType: 'PdfResource',
          entityId: pdf.id,
          message: `PdfResource "${pdf.id}" references missing postId "${pid}"`
        });
      }
    }
    for (const tid of pdf.topicIds) {
      if (!topicMap.has(tid)) {
        errors.push({
          ruleId: 'R03_FK_TOPIC',
          severity: 'error',
          entityType: 'PdfResource',
          entityId: pdf.id,
          message: `PdfResource "${pdf.id}" references missing topicId "${tid}"`
        });
      }
    }

    const hasTraversal = pdf.filePath.includes('..') || pdf.filePath.includes('\\');
    const hasUnsafeChars = /[\u0000-\u001F\u007F?#]/.test(pdf.filePath);
    const hasValidEnvelope =
      pdf.filePath.startsWith('/documents/') &&
      pdf.filePath.toLowerCase().endsWith('.pdf') &&
      pdf.filePath.trim() === pdf.filePath &&
      !pdf.filePath.includes('//');

    if (hasTraversal || hasUnsafeChars || !hasValidEnvelope) {
      errors.push({
        ruleId: 'R12_SAFE_PDF_PATH',
        severity: 'error',
        entityType: 'PdfResource',
        entityId: pdf.id,
        message: `PdfResource "${pdf.id}" filePath "${pdf.filePath}" must be a clean /documents/*.pdf path without traversal, query/hash, or unsafe control characters`
      });
    }

    if (options.publicRootDir) {
      const relative = pdf.filePath.replace(/^\/+/, '');
      const fullPath = path.join(options.publicRootDir, relative);
      if (!fs.existsSync(fullPath)) {
        errors.push({
          ruleId: 'R10_PDF_EXISTS',
          severity: 'error',
          entityType: 'PdfResource',
          entityId: pdf.id,
          message: `Missing PDF file on disk: ${fullPath}`
        });
      } else {
        const buf = fs.readFileSync(fullPath);
        if (buf.length === 0) {
          errors.push({
            ruleId: 'R10_PDF_NONEMPTY',
            severity: 'error',
            entityType: 'PdfResource',
            entityId: pdf.id,
            message: `PDF file "${fullPath}" is 0 bytes`
          });
        }
        if (buf.subarray(0, 5).toString('ascii') !== '%PDF-') {
          errors.push({
            ruleId: 'R10_PDF_MAGIC_BYTES',
            severity: 'error',
            entityType: 'PdfResource',
            entityId: pdf.id,
            message: `PDF file "${fullPath}" does not start with %PDF- magic header`
          });
        }
        if (buf.length !== pdf.fileSizeBytes) {
          errors.push({
            ruleId: 'R10_PDF_SIZE_MATCH',
            severity: 'error',
            entityType: 'PdfResource',
            entityId: pdf.id,
            message: `PDF size mismatch for "${pdf.id}": manifest=${pdf.fileSizeBytes}, disk=${buf.length}`
          });
        }
        const sha = crypto.createHash('sha256').update(buf).digest('hex');
        if (sha !== pdf.sha256) {
          errors.push({
            ruleId: 'R10_PDF_SHA256_MATCH',
            severity: 'error',
            entityType: 'PdfResource',
            entityId: pdf.id,
            message: `PDF SHA-256 mismatch for "${pdf.id}": manifest=${pdf.sha256}, disk=${sha}`
          });
        }
      }
    }
  }

  // Rule 10 duplicate-binary guard across public/documents/
  if (options.publicRootDir) {
    const documentsDir = path.join(options.publicRootDir, 'documents');
    const diskPdfs = collectPdfFilesRecursive(documentsDir);
    const hashToPaths = new Map<string, string[]>();
    for (const filePath of diskPdfs) {
      const digest = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
      const existing = hashToPaths.get(digest) ?? [];
      existing.push(path.relative(options.publicRootDir, filePath).replace(/\\/g, '/'));
      hashToPaths.set(digest, existing);
    }
    for (const [digest, relPaths] of hashToPaths.entries()) {
      if (relPaths.length > 1) {
        errors.push({
          ruleId: 'R10_PDF_NO_DUPLICATE_HASH',
          severity: 'error',
          entityType: 'PdfResource',
          message: `Duplicate PDF binary detected for sha256=${digest}: ${relPaths.join(', ')}`
        });
      }
    }
  }

  // Rule 13: Zero exposed secret strings anywhere in dataset
  const serialized = JSON.stringify(input);
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(serialized)) {
      errors.push({
        ruleId: 'R13_NO_SECRETS_IN_DATA',
        severity: 'error',
        entityType: 'Dataset',
        message: `Detected forbidden secret pattern matching ${pattern.source} inside data payload`
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts: {
      sources: sources.length,
      continents: continents.length,
      regions: regions.length,
      currencies: currencies.length,
      languages: languages.length,
      countries: countries.length,
      exams: exams.length,
      recruitmentPosts: posts.length,
      blueprints: blueprints.length,
      subjects: subjects.length,
      topics: topics.length,
      questions: questions.length,
      pdfResources: pdfResources.length
    }
  };
}

