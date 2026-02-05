import type { CollectionPage, ItemList, ListItem } from 'schema-dts';
import type { CollectionInput } from '../types';
import { canonicalId } from '../id';
import { mapProduct } from './product';
import { mapImage } from './media';

/**
 * MAP COLLECTION PAGE
 * Returns a full WebPage that contains the list as its main entity.
 * Best for: Category URLs (e.g. /collections/sneakers)
 */
export function mapCollectionPage(input: CollectionInput): CollectionPage {
  return {
    '@type': 'CollectionPage',
    '@id': input.schemaId || canonicalId.collectionPage(input.url),
    name: input.title,
    description: input.description,
    url: input.url,
    
    // VISUALS
    primaryImageOfPage: input.image ? mapImage(input.image) : undefined,

    // THE CORE: The "Main Entity" of a collection page is the list itself
    mainEntity: mapItemList(input), 
  };
}

/**
 * MAP ITEM LIST
 * Returns just the list structure.
 * Best for: Carousels, "Related Products" widgets, or embedding inside other pages.
 */
export function mapItemList(input: CollectionInput): ItemList {
  return {
    '@type': 'ItemList',
    '@id': input.itemListSchemaId || canonicalId.itemList(input.url),
    name: input.title, // Optional, but good for context
    description: input.description,
    
    // ORDERING LOGIC
    // If explicit ordering is requested, we use "ItemListOrderAscending"
    // Otherwise, it's just an Unordered list.
    itemListOrder: input.hasExplicitOrdering 
      ? 'https://schema.org/ItemListOrderAscending' 
      : 'https://schema.org/ItemListUnordered',
    
    numberOfItems: input.products.length,

    // MAP THE ITEMS
    itemListElement: input.products.map((product, index) => {
      // Create the ListItem wrapper required by Schema.org
      const listItem: ListItem = {
        '@type': 'ListItem',
        position: index + 1, // STRICT: Must be 1-based index
        
        // We nest the FULL product data. 
        // This gives AI the maximum context (Price, Image, Ratings) immediately.
        item: mapProduct(product), 
      };
      
      return listItem;
    }),
  };
}