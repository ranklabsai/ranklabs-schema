import type { Review, AggregateRating } from 'schema-dts';
import type { EntityReference, PersonRef } from './common';

/**
 * REVIEW INPUT
 * Represents a single customer opinion.
 * AEO Importance: High. Used for sentiment analysis snippets.
 */
export interface ReviewInput {
  url?: string;
  schemaId?: string;
  title?: string;
  author: string | PersonRef;        // The customer's name
  datePublished: string; // ISO 8601

  reviewBody: string;    // The actual text content

  // The Star Rating (1-5)
  rating: number;
  bestRating?: number;   // Defaults to 5 if omitted
  worstRating?: number;  // Defaults to 1 if omitted

  // Verification (Did they actually buy it?)
  isVerifiedBuyer?: boolean;

  /**
   * The thing being reviewed. Schema.org treats this as required on Review.
   * For a Product review, pass a reference that resolves to the product's
   * canonical `@id` (via `canonicalId.product(productUrl)`), so LLMs and
   * crawlers can tie the review back to the product without reparsing the
   * page structure.
   * @see https://schema.org/itemReviewed
   */
  itemReviewed?: EntityReference;

  /**
   * BCP-47 language tag of the review body. Useful on multi-locale sites
   * so LLMs know which language the review is in without heuristics.
   * @see https://schema.org/inLanguage
   */
  language?: string;
}

/**
 * AGGREGATE RATING INPUT
 * The summary of all reviews.
 * AEO Importance: Critical. Generates the "Star Snippet" in search results.
 */
export interface AggregateRatingInput {
  url?: string;
  schemaId?: string;
  ratingValue: number;   // e.g. 4.8
  reviewCount: number;   // Total number of reviews
  ratingCount?: number;
  bestRating?: number;
  worstRating?: number;

  /**
   * The thing being rated. Schema.org treats this as required. When the
   * aggregate lives inside a Product node, it's implicit, but LLMs can't
   * always infer the association from context. Pass an `@id`-bearing
   * reference for safest resolution.
   * @see https://schema.org/itemReviewed
   */
  itemReviewed?: EntityReference;
}