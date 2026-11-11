/**
 * Countries Learning Platform - Legacy Static Fallback Configuration
 * Runtime API tokens are never embedded in client bundles.
 */

export const APP_CONFIG = {
  appName: 'GeoCountries Learning Platform',
  version: '2.0.0',

  // Static JSON Dataset Endpoints (no client bearer credentials)
  api: {
    primaryEndpoint: '/data/v1/geography/countries-quiz-v1.json',
    fallbackEndpoint: '/data/countries-fallback.json',
    localFallbackUrl: 'data/countries-fallback.json',
    headers: {
      'Accept': 'application/json'
    },
    timeoutMs: 5000,
    cacheKey: 'dmc:v1:geography-countries'
  },

  // Pagination Settings
  pagination: {
    referenceCardsPerPage: 8,
    maxQuizDistractors: 3
  }
};

