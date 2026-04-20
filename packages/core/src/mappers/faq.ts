import type { FAQPage } from 'schema-dts';
import type { FAQInput } from '../types';
import { canonicalId } from '../id';
import { devWarn } from '../utils/warn';

let faqEligibilityWarned = false;

/**
 * @internal Test-only: resets the once-per-module FAQ eligibility warning
 * so a spy can assert the warning fires deterministically across tests.
 * Not part of the public API.
 */
export function __resetFaqWarningForTests(): void {
  faqEligibilityWarned = false;
}

/**
 * MAP FAQ PAGE
 * Generates a Schema.org FAQPage.
 *
 * NOTE on Google eligibility: as of August 2023 Google restricts FAQ rich
 * results to government and authoritative health-authority sites. FAQPage
 * markup is still valid and useful for Bing, DuckDuckGo, and LLMs
 * (ChatGPT, Perplexity, Claude). Keep emitting it; just don't expect a
 * Google SERP rich result on commercial sites.
 *
 * @see https://developers.google.com/search/updates#august-2023
 */
export function mapFAQPage(input: FAQInput): FAQPage {
  if (!faqEligibilityWarned) {
    faqEligibilityWarned = true;
    devWarn(
      `FAQPage is still useful for Bing, DuckDuckGo, and LLM / answer-engine ingestion. Google restricts FAQ rich results to government and health sites (since Aug 2023), so you will not see the rich result in Google SERPs.`,
    );
  }
  return {
    '@type': 'FAQPage',
    '@id': input.schemaId || (input.url ? canonicalId.faqPage(input.url) : undefined),
    name: input.title,
    url: input.url,
    inLanguage: input.language,
    
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