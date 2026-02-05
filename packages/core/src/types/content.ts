import type { Article, BlogPosting, FAQPage } from 'schema-dts';
import type { ImageInput, VideoInput, EntityReference, PersonRef, OrganizationRef } from './common';

/**
 * ARTICLE INPUT
 * Used for Blog Posts, News, and Tutorials.
 * AEO Goal: Establish the brand as a "Topic Expert."
 */
export interface ArticleInput {
  headline: string;
  description: string; // The "Snippet" for search results
  url: string;
  schemaId?: string;
  language?: string;
  image?: ImageInput;
  video?: VideoInput;

  // METADATA
  datePublished: string; // ISO 8601
  dateModified: string;  // Critical for "Freshness" ranking
  
  // AUTHORSHIP (E-E-A-T)
  author: PersonRef | OrganizationRef; // Who wrote this?
  publisher?: PersonRef | OrganizationRef; // Usually the Brand Organization
  
  /**
   * SEMANTIC LINKS (The AEO Superweapon)
   * * 'about': What product/topic is this mostly about?
   * * 'mentions': What other things are discussed?
   * Connecting these allows AI to traverse from Blog -> Product.
   */
  about?: EntityReference[]; 
  mentions?: EntityReference[];

  // TYPE SELECTION
  type?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'TechArticle';
}

/**
 * FAQ INPUT
 * The #1 source for "Direct Answer" snippets in search.
 */
export interface FAQInput {
  title?: string; // Optional page title
  url?: string;
  schemaId?: string;
  questions: Array<{
    question: string;
    answer: string; // HTML allowed here by Google, but keep it clean
  }>;
}

/**
 * MAPPERS
 */
export type ArticleMapper = (input: ArticleInput) => Article | BlogPosting;
export type FAQMapper = (input: FAQInput) => FAQPage;