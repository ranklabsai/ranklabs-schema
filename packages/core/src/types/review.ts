import type { Review, AggregateRating } from 'schema-dts';
import type { PersonRef } from './common';

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
}