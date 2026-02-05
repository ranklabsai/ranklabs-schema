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