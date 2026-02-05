import type { WebSite, WebPage, BreadcrumbList, SearchAction } from 'schema-dts';
import type { PersonRef, OrganizationRef } from './common';

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
  
  language?: string;     // e.g. "en-US"
  datePublished?: string;
  dateModified?: string;
  
  // Who "owns" this page?
  publisher?: PersonRef | OrganizationRef;
  
  // Navigation
  breadcrumb?: BreadcrumbInput;
  breadcrumbs?: BreadcrumbInput[];
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