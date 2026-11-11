import type { MetadataRoute } from 'next';
import { buildCanonicalUrl } from '@/lib/seo/metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/geography', '/ppsc', '/library', '/topics', '/data/v1/'],
        disallow: ['/api/']
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
        allow: ['/', '/geography', '/ppsc', '/library', '/topics', '/data/v1/'],
        disallow: ['/api/']
      }
    ],
    sitemap: buildCanonicalUrl('/sitemap.xml')
  };
}
