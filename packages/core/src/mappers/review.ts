import type { Review, AggregateRating, Person } from 'schema-dts';
import type { ReviewInput, AggregateRatingInput } from '../types';
import { canonicalId } from '../id';

/**
 * MAP REVIEW
 * Transforms a single user review into Schema.org structure.
 */
export function mapReview(input: ReviewInput): Review {
  // AEO Signal: If verified, we can signal trust. 
  // While Schema doesn't have a strict "isVerified" boolean, 
  // naming the review "Verified Review" is a common signal pattern.
  const reviewTitle = input.isVerifiedBuyer ? 'Verified Purchase' : undefined;

  const author: Person = typeof input.author === 'string'
    ? {
        '@type': 'Person',
        name: input.author,
      }
    : {
        '@type': 'Person',
        '@id': input.author.id,
        name: input.author.name,
        url: input.author.url,
      };

  return {
    '@type': 'Review',
    '@id': input.schemaId || (input.url ? canonicalId.review(input.url) : undefined),
    url: input.url,
    datePublished: input.datePublished,
    reviewBody: input.reviewBody,
    name: input.title || reviewTitle, // The headline of the review

    author,

    reviewRating: {
      '@type': 'Rating',
      ratingValue: input.rating,
      bestRating: input.bestRating || 5,
      worstRating: input.worstRating || 1,
    },
  };
}

/**
 * MAP AGGREGATE RATING
 * The summary stats that generate the "Stars" in Google Search.
 */
export function mapAggregateRating(input: AggregateRatingInput): AggregateRating {
  return {
    '@type': 'AggregateRating',
    '@id': input.schemaId || (input.url ? canonicalId.aggregateRating(input.url) : undefined),
    ratingValue: input.ratingValue,
    reviewCount: input.reviewCount,
    ratingCount: input.ratingCount,
    bestRating: input.bestRating || 5,
    worstRating: input.worstRating || 1,
  };
}