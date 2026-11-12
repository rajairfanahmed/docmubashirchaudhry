import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { loadDefaultSnapshot } from '@/lib/data';
import {
  generateGeographyQuestion,
  generateGeographyQuizSet,
  isAnswerCorrect,
  isCountryEligibleForFact,
  normalizeAnswer
} from '@/lib/quiz';
import { GET as getCountriesQuizRoute } from '@/app/api/countries/quiz/route';

describe('Geography Quiz Engine', () => {
  const snapshot = loadDefaultSnapshot();
  const maps = {
    currenciesById: new Map(snapshot.currencies.map((c) => [c.id, c])),
    languagesById: new Map(snapshot.languages.map((l) => [l.id, l]))
  };

  it('normalizes Unicode diacritics and whitespace consistently', () => {
    expect(normalizeAnswer('  Brasília ')).toBe('brasilia');
    expect(isAnswerCorrect('brasilia', ['Brasília'])).toBe(true);
    expect(isAnswerCorrect('Tokyo', ['Brasília'])).toBe(false);
  });

  it('accepts all official capitals for South Africa and excludes sibling official capitals from distractors', () => {
    const southAfrica = snapshot.countries.find((c) => c.id === 'zaf');
    expect(southAfrica).toBeDefined();

    const q = generateGeographyQuestion(southAfrica!, 'capital', snapshot.countries, maps, 'zaf-seed-1');
    expect(q).not.toBeNull();
    expect(q!.options).toHaveLength(4);
    expect(q!.acceptedAnswers).toEqual(['Pretoria', 'Cape Town', 'Bloemfontein']);

    expect(isAnswerCorrect('Cape Town', q!.acceptedAnswers)).toBe(true);
    expect(isAnswerCorrect('bloemfontein', q!.acceptedAnswers)).toBe(true);

    const distractorOptions = q!.options.filter((opt) => opt !== q!.correctAnswer);
    expect(distractorOptions).not.toContain('Cape Town');
    expect(distractorOptions).not.toContain('Bloemfontein');
  });

  it('never uses shared Eurozone EUR currencies as distractors for Germany', () => {
    const germany = snapshot.countries.find((c) => c.id === 'deu');
    expect(germany).toBeDefined();

    const q = generateGeographyQuestion(germany!, 'currency', snapshot.countries, maps, 'deu-eur-1');
    expect(q).not.toBeNull();
    expect(q!.options).toHaveLength(4);

    const euroCount = q!.options.filter((opt) => opt.toLowerCase().includes('euro')).length;
    expect(euroCount).toBe(1);
  });

  it('excludes disputed country capitals from verified capital quiz generation', () => {
    const palestine = snapshot.countries.find((c) => c.id === 'pse');
    expect(palestine).toBeDefined();

    expect(isCountryEligibleForFact(palestine!, 'capital', snapshot.countries, maps)).toBe(false);
    expect(generateGeographyQuestion(palestine!, 'capital', snapshot.countries, maps, 'pse-1')).toBeNull();
  });

  it('excludes draft or unverified countries from quiz generation', () => {
    const draftCountry = {
      ...structuredClone(snapshot.countries[0]),
      id: 'tst',
      status: 'draft' as const,
      verification: {
        ...snapshot.countries[0].verification,
        status: 'unverified' as const
      }
    };

    expect(isCountryEligibleForFact(draftCountry, 'capital', snapshot.countries, maps)).toBe(false);
    expect(generateGeographyQuestion(draftCountry, 'capital', snapshot.countries, maps, 'tst-1')).toBeNull();
  });

  it('produces identical options deterministically for the same seed', () => {
    const pakistan = snapshot.countries.find((c) => c.id === 'pak')!;
    const firstRun = generateGeographyQuestion(pakistan, 'capital', snapshot.countries, maps, 'fixed-seed-99');
    const secondRun = generateGeographyQuestion(pakistan, 'capital', snapshot.countries, maps, 'fixed-seed-99');

    expect(firstRun?.options).toEqual(secondRun?.options);
    expect(firstRun?.distractorSources.some((tier) => tier === 'sameRegion' || tier === 'sameContinent')).toBe(true);
  });

  it('returns null safely when fewer than 3 distinct distractors exist', () => {
    const tinyPool = snapshot.countries.slice(0, 2);
    expect(isCountryEligibleForFact(tinyPool[0], 'capital', tinyPool, maps)).toBe(false);
    expect(generateGeographyQuestion(tinyPool[0], 'capital', tinyPool, maps, 'tiny-1')).toBeNull();
  });

  it('builds one question per eligible country for B, A, and All selections with no 20-question cap', async () => {
    const published = snapshot.countries.filter((c) => c.status === 'published');
    const factSequence = ['capital', 'currency', 'language'] as const;

    const bCountries = published.filter((c) => c.nameCommon.toUpperCase().startsWith('B'));
    const bEligible = bCountries.filter((c) =>
      factSequence.some((ft) => isCountryEligibleForFact(c, ft, published, maps))
    );
    expect(bEligible.length).toBe(21);

    const bQuiz = generateGeographyQuizSet({
      countries: bEligible,
      allCountries: published,
      onePerCountry: true,
      seed: 'test-letter-B',
      maps
    });
    expect(bQuiz).toHaveLength(21);
    expect(new Set(bQuiz.map((q) => q.countryId)).size).toBe(21);

    const aCountries = published.filter((c) => c.nameCommon.toUpperCase().startsWith('A'));
    const aEligible = aCountries.filter((c) =>
      factSequence.some((ft) => isCountryEligibleForFact(c, ft, published, maps))
    );
    const aQuiz = generateGeographyQuizSet({
      countries: aEligible,
      allCountries: published,
      onePerCountry: true,
      seed: 'test-letter-A',
      maps
    });
    expect(aQuiz).toHaveLength(aEligible.length);

    const allEligible = published.filter((c) =>
      factSequence.some((ft) => isCountryEligibleForFact(c, ft, published, maps))
    );
    const allQuiz = generateGeographyQuizSet({
      countries: allEligible,
      allCountries: published,
      onePerCountry: true,
      seed: 'test-all',
      maps
    });
    expect(allQuiz).toHaveLength(allEligible.length);
    expect(allQuiz.length).toBeGreaterThan(200);

    // Backend /api/countries/quiz endpoint returns full uncapped selection lengths
    const bRes = await getCountriesQuizRoute(
      new NextRequest('http://localhost:3000/api/countries/quiz?letter=B')
    );
    expect(bRes.status).toBe(200);
    const bBody = await bRes.json();
    expect(bBody.totalQuestions).toBe(21);
    expect(bBody.questions).toHaveLength(21);

    const allRes = await getCountriesQuizRoute(
      new NextRequest('http://localhost:3000/api/countries/quiz?letter=all')
    );
    expect(allRes.status).toBe(200);
    const allBody = await allRes.json();
    expect(allBody.totalQuestions).toBe(allEligible.length);
    expect(allBody.questions).toHaveLength(allEligible.length);

    const badRes = await getCountriesQuizRoute(
      new NextRequest('http://localhost:3000/api/countries/quiz?letter=INVALID')
    );
    expect(badRes.status).toBe(400);
  });
});

