import type { HowTo } from 'schema-dts';
import type { ImageInput, VideoInput } from './common';

/**
 * HOWTO INPUT
 * Step-based instructional content: how-to guides, care instructions,
 * setup walkthroughs. Google's rich-result eligibility for HowTo has
 * narrowed over time, but LLMs (ChatGPT, Claude, Perplexity) parse HowTo
 * eagerly for instructional retrieval.
 * @see https://schema.org/HowTo
 * @see https://developers.google.com/search/docs/appearance/structured-data/how-to
 */
export interface HowToInput {
  name: string;
  description: string;
  url: string;
  schemaId?: string;

  image?: ImageInput;
  video?: VideoInput;

  /**
   * ISO 8601 duration (e.g. "PT30M" = 30 minutes, "PT1H15M" = 1h15m).
   * Sum of step times; callers can compute or omit.
   * @see https://schema.org/totalTime
   */
  totalTime?: string;

  estimatedCost?: {
    amount: string | number;
    currency: string;
  };

  /** Materials/ingredients consumed during the process. */
  supplies?: Array<string | { name: string; image?: ImageInput }>;

  /** Tools used but not consumed. */
  tools?: Array<string | { name: string; image?: ImageInput }>;

  /** Ordered steps. At least one is required. */
  steps: HowToStepInput[];
}

export interface HowToStepInput {
  name: string;
  /**
   * Step body. Plain text is safest; a small HTML subset is acceptable
   * (same subset Google allows for FAQPage answers). Sanitize CMS input.
   */
  text: string;
  image?: ImageInput;
  url?: string;
  video?: VideoInput;
}

export type HowToMapper = (input: HowToInput) => HowTo;
