import type { Product, ProductGroup, Brand, Country } from 'schema-dts';
import type { MappedProduct, MappedProductGroup, OfferInput, ProductInput, VariantInput } from '../types';
import { canonicalId } from '../id';
import { mapBrand } from './brand';
import { mapOffer } from './offer';
import { mapReview, mapAggregateRating } from './review';
import { mapImage, mapVideo } from './media';

/**
 * THE CORE PRODUCT MAPPER
 * Handles both simple products and complex variant groups. The return type
 * is an intersection of schema-dts's Product / ProductGroup with the
 * `MappedProductExtensions` shape, since several valid Schema.org fields
 * (countryOfOrigin, mentions, hasMeasurement, etc.) are not included in
 * schema-dts's narrower ProductLeaf.
 */
export function mapProduct(input: ProductInput): MappedProduct | MappedProductGroup {
  const isGroup = input.variants && input.variants.length > 0;

  const productNodeId = input.schemaId || canonicalId.product(input.url);
  const productGroupNodeId = input.productGroupSchemaId || input.schemaId || canonicalId.productGroup(input.url);

  // 1. Common Properties (Shared by both Single and Group)
  const base = {
    '@type': 'Product' as const,
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

    // Provenance (AEO: LLMs use this for origin-specific queries)
    countryOfOrigin: mapCountry(input.countryOfOrigin),
    countryOfAssembly: input.countryOfAssembly,

    // Demographic / editorial linkage (AEO)
    audience: input.audience
      ? { '@type': 'Audience' as const, audienceType: input.audience }
      : undefined,
    award: input.award,
    mentions: input.mentions?.map(mapEntityRef),
    isRelatedTo: input.isRelatedTo?.map(mapEntityRef),
    isSimilarTo: input.isSimilarTo?.map(mapEntityRef),

    // Freeform structured specs (for anything color/size/material doesn't cover)
    additionalProperty: input.additionalProperties?.map((p) => ({
      '@type': 'PropertyValue' as const,
      name: p.name,
      value: p.value,
      unitCode: p.unitCode,
      unitText: p.unitText,
    })),

    // Structured numeric measurements (width, length, weight, etc.)
    hasMeasurement: input.measurements?.map((m) => ({
      '@type': 'QuantitativeValue' as const,
      name: m.name,
      value: m.value,
      unitCode: m.unitCode,
      unitText: m.unitText,
    })),

    // Certifications (B Corp, Fair Trade, Oeko-Tex, ISO, etc.)
    hasCertification: input.certifications?.map((c) => ({
      '@type': 'Certification' as const,
      name: c.name,
      url: c.url,
      validFrom: c.validFrom,
      issuedBy: c.issuedBy
        ? { '@type': 'Organization' as const, name: c.issuedBy.name, url: c.issuedBy.url }
        : undefined,
    })),

    review: input.reviews?.map(mapReview),

    // Social Proof
    aggregateRating: input.rating ? mapAggregateRating(input.rating) : undefined,

    // Topical retrieval signal (LLMs)
    keywords: input.keywords && input.keywords.length > 0 ? input.keywords.join(',') : undefined,

    // Primary-subject signal for disambiguation
    mainEntityOfPage: mapMainEntityOfPage(input.mainEntityOfPage),
  };

  // 2. LOGIC BRANCH: PRODUCT GROUP (VARIANTS)
  if (isGroup) {
    const group: MappedProductGroup = {
      ...base,
      '@type': 'ProductGroup',
      '@id': productGroupNodeId,
      productGroupID: input.productGroupId || input.id,

      // Define what varies (e.g. "Color", "Size")
      variesBy: [
        input.color ? 'https://schema.org/color' : undefined,
        input.size ? 'https://schema.org/size' : undefined,
        input.material ? 'https://schema.org/material' : undefined,
      ].filter(Boolean) as string[],

      // Map the children
      hasVariant: input.variants!.map((v) => mapVariant(v, input)),
    };
    return group;
  }

  // 3. LOGIC BRANCH: SINGLE PRODUCT
  // Defensive: `offers` is typed required, but untyped adapter data (e.g. a
  // broken CMS payload) can send null/undefined. Omit the field instead of
  // crashing `mapOffer`; `validateRichResults` will flag the missing offer.
  const offers = input.offers
    ? Array.isArray(input.offers)
      ? input.offers.map((offer) => mapOffer(withDefaultOfferUrl(offer, input.url)))
      : mapOffer(withDefaultOfferUrl(input.offers, input.url))
    : undefined;

  const leaf: MappedProduct = {
    ...base,
    offers,

    // Videos usually live on the main product
    subjectOf: input.videos?.map(mapVideo),
  };
  return leaf;
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
 * HELPER: MAP COUNTRY
 * Returns a Schema.org Country node from an ISO 3166-1 alpha-2 code.
 * Returning a structured Country (not a plain string) gives LLMs a clear
 * entity to resolve against (e.g. "IN" → India → Wikipedia).
 */
function mapCountry(code?: string): Country | undefined {
  if (!code) return undefined;
  return { '@type': 'Country', name: code };
}

/**
 * HELPER: MAP ENTITY REFERENCE
 * Shared helper for mentions / isRelatedTo / isSimilarTo.
 */
function mapEntityRef(ref: import('../types').EntityReference) {
  return {
    '@type': ref.type,
    '@id': ref.id,
    name: ref.name,
    url: ref.url,
  };
}

function mapMainEntityOfPage(
  input?: string | { id?: string; url?: string },
): string | { '@type': 'WebPage'; '@id'?: string; url?: string } | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return input;
  return { '@type': 'WebPage', '@id': input.id, url: input.url };
}

/**
 * HELPER: MAP BRAND
 * Normalizes brand input into a Schema.org Brand object. Defensive against
 * null/undefined input from untyped data sources; returns `undefined` in
 * that case so the `brand` field is omitted instead of crashing.
 */
function normalizeBrand(brandInput: ProductInput['brand']): Brand | undefined {
  if (brandInput === undefined || brandInput === null) {
    return undefined;
  }
  if (typeof brandInput === 'string') {
    if (brandInput.length === 0) return undefined;
    return {
      '@type': 'Brand',
      name: brandInput,
    };
  }

  return mapBrand(brandInput);
}