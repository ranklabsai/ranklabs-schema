import type { Product, ProductGroup, Brand } from 'schema-dts';
import type { OfferInput, ProductInput, VariantInput } from '../types';
import { canonicalId } from '../id';
import { mapBrand } from './brand';
import { mapOffer } from './offer';
import { mapReview, mapAggregateRating } from './review';
import { mapImage, mapVideo } from './media';

/**
 * THE CORE PRODUCT MAPPER
 * Handles both simple products and complex variant groups.
 */
export function mapProduct(input: ProductInput): Product | ProductGroup {
  const isGroup = input.variants && input.variants.length > 0;

  const productNodeId = input.schemaId || canonicalId.product(input.url);
  const productGroupNodeId = input.productGroupSchemaId || input.schemaId || canonicalId.productGroup(input.url);

  // 1. Common Properties (Shared by both Single and Group)
  const base: Product = {
    '@type': 'Product',
    '@id': productNodeId,
    name: input.title,
    description: input.description,
    url: input.url,
    color: input.color,
    material: input.material,
    pattern: input.pattern,
    size: input.size,
    sku: input.sku,
    mpn: input.mpn,
    image: input.images?.map(mapImage), // Maps to clean ImageObject
    
    // Brand Logic: Handle string or object input
    brand: normalizeBrand(input.brand),

    // GTIN Handling (Critical for Google)
    gtin: input.gtin,
    gtin8: input.gtin8,
    gtin12: input.gtin12,
    gtin13: input.gtin13,
    gtin14: input.gtin14,

    review: input.reviews?.map(mapReview),

    // Social Proof
    aggregateRating: input.rating ? mapAggregateRating(input.rating) : undefined,
    
    // Pass the context (Organization) if needed, but usually Brand covers it
  };

  // 2. LOGIC BRANCH: PRODUCT GROUP (VARIANTS)
  if (isGroup) {
    return {
      ...base,
      '@type': 'ProductGroup',
      '@id': productGroupNodeId,
      productGroupID: input.productGroupId || input.id,
      
      // Define what varies (e.g. "Color", "Size")
      variesBy: [
        input.color ? 'https://schema.org/color' : undefined,
        input.size ? 'https://schema.org/size' : undefined,
        input.material ? 'https://schema.org/material' : undefined
      ].filter(Boolean) as string[],

      // Map the children
      hasVariant: input.variants!.map((v) => mapVariant(v, input)),
    } as ProductGroup;
  }

  // 3. LOGIC BRANCH: SINGLE PRODUCT
  return {
    ...base,
    // Offers (Price) only live on the Leaf node
    offers: Array.isArray(input.offers)
      ? input.offers.map((offer) => mapOffer(withDefaultOfferUrl(offer, input.url)))
      : mapOffer(withDefaultOfferUrl(input.offers, input.url)),
      
    // Videos usually live on the main product
    subjectOf: input.videos?.map(mapVideo),
  };
}

function withDefaultOfferUrl(offer: OfferInput, defaultUrl: string): OfferInput {
  return {
    ...offer,
    url: offer.url ?? defaultUrl,
  };
}

/**
 * HELPER: MAP VARIANT
 * Transforms a VariantInput into a "Leaf" Product node.
 */
function mapVariant(variant: VariantInput, parent: ProductInput): Product {
  const variantUrl = variant.url || `${parent.url}?variant=${variant.id}`;
  return {
    '@type': 'Product',
    '@id': variant.schemaId || canonicalId.product(variantUrl),
    url: variantUrl,
    name: variant.title, // e.g. "Nike Air Max - Red"
    description: parent.description, // Inherit parent description
    
    image: variant.image ? mapImage(variant.image) : undefined,
    
    sku: variant.sku,
    gtin: variant.gtin,
    gtin8: variant.gtin8,
    gtin12: variant.gtin12,
    gtin13: variant.gtin13,
    gtin14: variant.gtin14,
    
    offers: mapOffer(withDefaultOfferUrl(variant.offers, variantUrl)),
    
    // Variant Attributes
    color: variant.color || parent.color,
    size: variant.size || parent.size,
    material: variant.material || parent.material,
  };
}

/**
 * HELPER: MAP BRAND
 * Normalizes brand input into a Schema.org Brand object.
 */
function normalizeBrand(brandInput: ProductInput['brand']): Brand {
  if (typeof brandInput === 'string') {
    return {
      '@type': 'Brand',
      name: brandInput,
    };
  }

  return mapBrand(brandInput);
}