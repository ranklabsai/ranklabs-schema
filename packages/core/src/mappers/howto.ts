import type { HowTo, HowToStep, HowToSupply, HowToTool, MonetaryAmount } from 'schema-dts';
import type { HowToInput, HowToStepInput } from '../types/howto';
import { canonicalId } from '../id';
import { mapImage, mapVideo } from './media';

/**
 * MAP HOWTO
 * Converts a step-based guide into a Schema.org HowTo.
 *
 * Google's HowTo rich result eligibility has tightened over time, but it's
 * still worth emitting for Bing, DuckDuckGo, and LLM ingestion (Claude,
 * ChatGPT, and Perplexity all parse HowTo for instructional retrieval).
 */
export function mapHowTo(input: HowToInput): HowTo {
  return {
    '@type': 'HowTo',
    '@id': input.schemaId || canonicalId.howTo(input.url),
    name: input.name,
    description: input.description,
    url: input.url,

    image: input.image ? mapImage(input.image) : undefined,
    video: input.video ? mapVideo(input.video) : undefined,

    totalTime: input.totalTime,

    estimatedCost: input.estimatedCost
      ? ({
          '@type': 'MonetaryAmount',
          value: input.estimatedCost.amount,
          currency: input.estimatedCost.currency,
        } satisfies MonetaryAmount)
      : undefined,

    supply: input.supplies?.map(mapSupply),
    tool: input.tools?.map(mapTool),

    step: input.steps.map(mapStep),
  };
}

function mapSupply(s: string | { name: string; image?: import('../types').ImageInput }): HowToSupply {
  if (typeof s === 'string') return { '@type': 'HowToSupply', name: s };
  return {
    '@type': 'HowToSupply',
    name: s.name,
    image: s.image ? mapImage(s.image) : undefined,
  };
}

function mapTool(t: string | { name: string; image?: import('../types').ImageInput }): HowToTool {
  if (typeof t === 'string') return { '@type': 'HowToTool', name: t };
  return {
    '@type': 'HowToTool',
    name: t.name,
    image: t.image ? mapImage(t.image) : undefined,
  };
}

function mapStep(step: HowToStepInput): HowToStep {
  return {
    '@type': 'HowToStep',
    name: step.name,
    text: step.text,
    url: step.url,
    image: step.image ? mapImage(step.image) : undefined,
    video: step.video ? mapVideo(step.video) : undefined,
  };
}
