import type { CollectionPage, ItemList } from 'schema-dts';
import type { ProductInput } from './product';
import type { ImageInput } from './common';

/**
 * COLLECTION INPUT
 * Used for both full Category Pages and smaller "List Widgets" (like carousels).
 */
export interface CollectionInput {
  title: string;
  description?: string; // Optional for lists, required for pages
  url: string;
  schemaId?: string;
  itemListSchemaId?: string;
  image?: ImageInput;
  
  products: ProductInput[];

  // Ordering Signal
  hasExplicitOrdering?: boolean;

  /**
   * Pagination context. If the collection page is one page of a paginated
   * set, set these so crawlers understand the structure.
   *
   * `totalItems` is the size of the full collection (not this page).
   * `currentPage` / `totalPages` describe position.
   * `previousUrl` / `nextUrl` emit on the `CollectionPage` as Schema.org
   * `previousItem` / `nextItem` style hints (Google accepts rel links,
   * but structured-data hints help LLMs build site graphs).
   */
  pagination?: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    previousUrl?: string;
    nextUrl?: string;
  };
}

/**
 * THE SPLIT OUTPUT
 * We now strictly define two different output types.
 */

// 1. The Full Page (Good for /collections/sneakers)
// This wraps the ItemList inside a CollectionPage entity.
export type CollectionPageMapper = (input: CollectionInput) => CollectionPage;

// 2. The Standalone List (Good for "Related Products" or Carousels)
// This returns a raw ItemList that you can nest inside other schemas (like Article).
export type ItemListMapper = (input: CollectionInput) => ItemList;