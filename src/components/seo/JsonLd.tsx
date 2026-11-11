import { serializeJsonLd } from '@/lib/seo/structured-data';

export interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Renders structured Schema.org JSON-LD inside Server Components.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

