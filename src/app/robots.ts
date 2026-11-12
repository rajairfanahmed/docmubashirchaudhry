import type { MetadataRoute } from 'next';
import { buildCanonicalUrl } from '@/lib/seo/metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/geography', '/ppsc', '/quizzes', '/exams', '/library', '/topics', '/data/v1/'],
        disallow: ['/api/', '/admin/', '/my-attempts', '/my-downloads']
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'Google-Extended',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai'
        ],
        allow: ['/', '/geography', '/ppsc', '/quizzes', '/exams', '/library', '/topics', '/data/v1/'],
        disallow: ['/api/', '/admin/', '/my-attempts', '/my-downloads']
      }
    ],
    sitemap: buildCanonicalUrl('/sitemap.xml')
  };
}
