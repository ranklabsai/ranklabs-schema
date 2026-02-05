import type { FAQPage } from 'schema-dts';
import type { FAQInput } from '../types';
import { canonicalId } from '../id';

/**
 * MAP FAQ PAGE
 * Generates the specific structure for "People Also Ask" snippets.
 */
export function mapFAQPage(input: FAQInput): FAQPage {
  return {
    '@type': 'FAQPage',
    '@id': input.schemaId || (input.url ? canonicalId.faqPage(input.url) : undefined),
    name: input.title,
    url: input.url,
    
    // The Core List
    mainEntity: input.questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer, // HTML is allowed here
      },
    })),
  };
}