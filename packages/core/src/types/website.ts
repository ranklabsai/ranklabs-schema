import type { WebSite, WebPage, BreadcrumbList, SearchAction } from 'schema-dts';
import type { PersonRef, OrganizationRef } from './common';
import type { SpeakableSpecificationInput } from './content';

/**
 * WEBSITE INPUT
 * This is usually only used ONCE on the Homepage.
 * AEO Goal: Triggers the "Sitelinks Search Box" in Google.
 */
export interface WebSiteInput {
  name: string;
  url: string;
  schemaId?: string;
  alternateName?: string; // e.g. "Nike" vs "Nike Inc."
  
  // The Search Box Logic
  search?: {
    url?: string;
    schemaId?: string;
    target: string;      // e.g. "https://site.com/search?q={search_term_string}"
    queryInput: string;  // e.g. "required name=search_term_string"
  };
}

/**
 * WEBPAGE INPUT
 * The generic wrapper for every URL.
 * Even if a page is a "Product", it is wrapped in this to provide context.
 */
export interface WebPageInput {
  title: string;
  description: string;
  url: string;
  schemaId?: string;
  
  /**
   * BCP-47 language tag (e.g. "en-US", "fr-CA", "ja"). Defaults to "en-US"
   * if omitted. For multi-locale stores, set this per route from your locale
   * param. Alternate-language URLs for the same page belong in HTML `<link
   * rel="alternate" hreflang>` headers, not JSON-LD.
   * @see https://www.rfc-editor.org/rfc/rfc5646
   */
  language?: string;
  datePublished?: string;
  dateModified?: string;

  /**
   * ISO 8601 date the page was last editorially reviewed. Freshness signal
   * distinct from `dateModified`: a page can be republished without being
   * factually re-verified. Set this on evergreen content you periodically
   * re-check.
   * @see https://schema.org/lastReviewed
   */
  lastReviewed?: string;

  /**
   * Speakable summary selectors, same shape as on `ArticleInput`. Useful
   * for non-Article page types like landing pages with quotable intros.
   * @see https://schema.org/speakable
   */
  speakable?: SpeakableSpecificationInput;

  // Who "owns" this page?
  publisher?: PersonRef | OrganizationRef;

  // Navigation
  breadcrumb?: BreadcrumbInput;
  breadcrumbs?: BreadcrumbInput[];

  /**
   * Signals the primary subject of this page. Accepts a plain URL or a
   * full entity ref. Typically set to the canonical `@id` of the Product,
   * Article, or other main entity the page represents.
   * @see https://schema.org/mainEntityOfPage
   */
  mainEntityOfPage?: string | { id?: string; url?: string };
}

/**
 * BREADCRUMB INPUT
 * AEO Importance: High. Helps AI understand site structure.
 */
export interface BreadcrumbInput {
  url?: string;
  // Ordered list of links
  items: Array<{
    name: string;
    item: string; // The URL
  }>;
}

export interface SearchActionInput {
  url?: string;
  schemaId?: string;
  target: string; // e.g. "https://example.com/search?q={search_term_string}"
  queryInput?: string; // Default: "required name=search_term_string"
}

/**
 * MAPPERS
 */
export type WebSiteMapper = (input: WebSiteInput) => WebSite;
export type WebPageMapper = (input: WebPageInput) => WebPage;
export type BreadcrumbMapper = (input: BreadcrumbInput) => BreadcrumbList;
export type SearchActionMapper = (input: SearchActionInput) => SearchAction;