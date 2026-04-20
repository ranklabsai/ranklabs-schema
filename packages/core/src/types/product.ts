import type { Product, ProductGroup, Country } from 'schema-dts';
import type { ImageInput, VideoInput, AddressInput, EntityReference } from './common';
import type { ReviewInput, AggregateRatingInput } from './review';
import type { BrandInput } from './brand';

/**
 * Fields this library emits on Product / ProductGroup that aren't in
 * `schema-dts`'s stricter `ProductLeaf` type. Most of them are inherited
 * from `Thing` or are valid Schema.org properties that schema-dts typed
 * narrowly. Using an intersection keeps the return type precise without
 * needing `as Product` casts at emit time.
 */
export interface MappedProductExtensions {
  countryOfOrigin?: Country;
  countryOfAssembly?: string;
  audience?: { '@type': 'Audience'; audienceType?: string };
  award?: string | string[];
  mentions?: Array<{ '@type': string; '@id'?: string; name?: string; url?: string }>;
  isRelatedTo?: Array<{ '@type': string; '@id'?: string; name?: string; url?: string }>;
  isSimilarTo?: Array<{ '@type': string; '@id'?: string; name?: string; url?: string }>;
  additionalProperty?: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string | number;
    unitCode?: string;
    unitText?: string;
  }>;
  hasMeasurement?: Array<{
    '@type': 'QuantitativeValue';
    name?: string;
    value: number;
    unitCode?: string;
    unitText?: string;
  }>;
  hasCertification?: Array<{
    '@type': 'Certification';
    name: string;
    url?: string;
    validFrom?: string;
    issuedBy?: { '@type': 'Organization'; name: string; url?: string };
  }>;
  keywords?: string;
  mainEntityOfPage?: string | { '@type': 'WebPage'; '@id'?: string; url?: string };
}

/** Product shape actually emitted by `mapProduct` when there are no variants. */
export type MappedProduct = Product & MappedProductExtensions;

/** ProductGroup shape actually emitted by `mapProduct` when `variants` is non-empty. */
export type MappedProductGroup = ProductGroup & MappedProductExtensions;

/**
 * CORE PRODUCT INPUT
 * The foundational entity for any e-commerce store.
 */
export interface ProductInput {
  // Basics
  id: string;
  /**
   * Optional override for the Schema.org node @id.
   * If omitted, mappers should derive a canonical URL-based @id.
   */
  schemaId?: string;
  productGroupSchemaId?: string;
  title: string;
  description: string; 
  handle: string;      
  url: string;         
  
  // Visuals (Uses the Clean Types from common.ts)
  images: ImageInput[];
  videos?: VideoInput[];

  // Identity & AEO (The "Who made this?")
  brand: string | BrandInput;

  /** * GLOBAL TRADE ITEM NUMBERS (GTIN)
   * * Critical for Price Comparison and Google Shopping.
   * * We now support specific formats to match the exact barcode type.
   */
  gtin?: string;       
  gtin8?: string;      
  gtin12?: string;     
  gtin13?: string;     
  gtin14?: string;     
  
  mpn?: string;        
  sku?: string;        
  
  // Pricing & Inventory
  offers: OfferInput | OfferInput[];
  
  reviews?: ReviewInput[];
  // Social Proof (Aggregate Rating)
  rating?: AggregateRatingInput;

  /**
   * VARIANTS (The "Product Group" Logic)
   * If this product has multiple colors/materials, we define them here.
   * This transforms the output from a simple `Product` to a `ProductGroup`.
   */
  variants?: VariantInput[];

  /**
   * Google Product variants: identifier for the group (aka parent SKU).
   * If omitted, mappers may fall back to `id`.
   */
  productGroupId?: string;
  
  // Specific properties for the variant logic
  color?: string;
  material?: string;
  pattern?: string;
  size?: string;

  /**
   * Country of origin (where the product was produced / sourced).
   * ISO 3166-1 alpha-2 code (e.g. "US", "IN", "TR", "MA").
   *
   * Emitted as a `Country` node. Useful for Google Shopping / Merchant
   * Center and for region-specific queries. Formal LLM ingestion of
   * `countryOfOrigin` varies by crawler; test with your specific
   * retrieval targets rather than assuming uniform support.
   * @see https://schema.org/countryOfOrigin
   */
  countryOfOrigin?: string;

  /**
   * Country where the product was assembled, if different from origin.
   * ISO 3166-1 alpha-2 code.
   * @see https://schema.org/countryOfAssembly
   */
  countryOfAssembly?: string;

  /**
   * Target audience. Pass as a plain string (e.g. "Interior designers",
   * "Home decorators"). LLMs use this for demographic-targeted retrieval.
   * Emitted as an `Audience` node with `audienceType`.
   * @see https://schema.org/audience
   */
  audience?: string;

  /**
   * Awards won by this product. Schema.org expects plain text.
   * @see https://schema.org/award
   */
  award?: string | string[];

  /**
   * Articles, press, or other editorial content that mentions this product.
   * This is the back-link that closes bidirectional entity graphs. An
   * Article's `about: Product` tells the LLM "this post discusses that
   * product"; `Product.mentions: Article` tells it "this product is
   * featured in that post." LLMs can traverse either direction.
   * @see https://schema.org/mentions
   */
  mentions?: EntityReference[];

  /**
   * Other products related to this one but not interchangeable, such as
   * complements or accessories (e.g. a case for a device, a matching item
   * in the same range).
   * @see https://schema.org/isRelatedTo
   */
  isRelatedTo?: EntityReference[];

  /**
   * Products similar to this one, i.e. plausible substitutes (e.g. alternate
   * colors, a different size, a close equivalent from the same line).
   * @see https://schema.org/isSimilarTo
   */
  isSimilarTo?: EntityReference[];

  /**
   * Freeform structured attributes for specs that don't fit the built-in
   * Product properties (thread count, material weight, screen size,
   * certifications, and so on). Each entry becomes a `PropertyValue`
   * under `additionalProperty` on the emitted Product.
   *
   * `unitCode` takes a UN/CEFACT unit code (e.g. `"CMT"` for centimetres,
   * `"KGM"` for kilograms). `unitText` is a human-readable fallback.
   * @see https://schema.org/additionalProperty
   * @see https://schema.org/PropertyValue
   */
  additionalProperties?: Array<{
    name: string;
    value: string | number;
    unitCode?: string;
    unitText?: string;
  }>;

  /**
   * Structured physical or technical measurements (width, length, weight,
   * screen size, pile height, and so on). Each entry becomes a
   * `QuantitativeValue` under `hasMeasurement` on the emitted Product.
   *
   * Use this instead of `additionalProperties` when the attribute is a
   * numeric quantity with a unit. Callers that need a free-text spec
   * should keep using `additionalProperties`.
   * @see https://schema.org/hasMeasurement
   * @see https://schema.org/QuantitativeValue
   */
  measurements?: Array<{
    name?: string;
    value: number;
    unitCode?: string;
    unitText?: string;
  }>;

  /**
   * Certifications held by the product (B Corp, Fair Trade, Oeko-Tex,
   * ISO series, etc.). Each entry becomes a `Certification` node under
   * `hasCertification`. Set `issuedBy` to the certifying body as a minimal
   * Organization reference.
   * @see https://schema.org/hasCertification
   * @see https://schema.org/Certification
   */
  certifications?: Array<{
    name: string;
    url?: string;
    validFrom?: string;
    issuedBy?: { name: string; url?: string };
  }>;

  /**
   * Product keywords. Mirrors `ArticleInput.keywords`: an array of tags
   * the mapper joins comma-separated. LLMs use this for topical retrieval;
   * complements the longer `description` text.
   * @see https://schema.org/keywords
   */
  keywords?: string[];

  /**
   * Signals that this Product is the primary subject of the page at the
   * given URL. Accepts a plain URL or a full WebPage ref. When a single
   * page describes multiple entities, this tells crawlers which one is
   * the main one.
   * @see https://schema.org/mainEntityOfPage
   */
  mainEntityOfPage?: string | { id?: string; url?: string };
}

/**
 * VARIANT INPUT (ProductGroup Variant)
 * A stripped-down version of a product, specific to a color/size option.
 * This is the lastest standard over ProductCollection which is too generic for AI.
 * @see https://schema.org/ProductGroup
 */
export interface VariantInput {
  id: string;
  schemaId?: string;
  sku: string;
  gtin?: string; 
  gtin8?: string;      
  gtin12?: string;     
  gtin13?: string;     
  gtin14?: string;     
  
  title: string; 
  url: string;   
  
  image: ImageInput; 
  offers: OfferInput; 
  
  // Attributes
  color?: string;
  size?: string;
  material?: string;
}

/**
 * OFFER INPUT
 * Represents a price, distinct from the product itself.
 * Handles sales, currency, and availability.
 */
export interface OfferInput {
  schemaId?: string;
  price: string | number;
  currency: string;      
  
  // Inventory Signals
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder' | 'Discontinued';
  quantity?: number;

  /**
   * ISO 8601 date when a PreOrder / BackOrder becomes purchasable (available).
   * Pair with `availability: 'PreOrder'` or `'BackOrder'` to signal expected ship date.
   * @see https://schema.org/availabilityStarts
   */
  availabilityStarts?: string;

  /**
   * ISO 8601 date when this availability state ends (e.g. a limited drop).
   * @see https://schema.org/availabilityEnds
   */
  availabilityEnds?: string;

  /**
   * Regions where this offer is valid. ISO 3166-1 alpha-2 country code
   * (or an array of them), or a free-form region name. Use this on
   * multi-locale storefronts to scope an offer to specific markets.
   * @see https://schema.org/eligibleRegion
   */
  eligibleRegion?: string | string[];
  
  // Sales & Promotions
  priceValidUntil?: string; 
  strikethroughPrice?: string | number;
  salePrice?: string | number;

  url?: string;
  
  // Condition (Refurbished/Used markets)
  itemCondition?: 'New' | 'Used' | 'Refurbished' | 'Damaged';

  /* AEO SIGNAL: "Ships From" Location.
   * Tells Google if this is a domestic vs. international shipment.
   */
  shipsFrom?: AddressInput;
  
  // 2026 AEO Compliance
  shipping?: ShippingInput;
  returns?: ReturnPolicyInput;
}

/**
 * SHIPPING INPUT
 * Google now requires shipping details for Merchant Center integration.
 */
export interface ShippingInput {
  cost: string | number;
  currency?: string;     
  destinations: string[]; 
  handlingTime?: {
    minDays: number;
    maxDays: number;
  };
  deliveryTime?: {
    minDays: number;
    maxDays: number;
  };
}

/**
 * RETURN POLICY INPUT
 * A massive trust signal for AI agents recommending products.
 */
export interface ReturnPolicyInput {
  applicableCountry?: string | string[];

  returnPolicyCategory?: 'FiniteReturnWindow' | 'UnlimitedReturnWindow' | 'NotPermitted';
  merchantReturnDays?: number;
  merchantReturnLink?: string;

  returnWindowDays?: number;
  returnPolicyUrl?: string;

  returnFees?: 'FreeReturn' | 'ReturnFeesCustomerResponsibility' | 'ReturnShippingFees';

  returnShippingFeesAmount?: {
    amount: string | number;
    currency?: string;
  };

  returnMethod?: 'ReturnByMail' | 'ReturnInStore' | 'ReturnAtKiosk' | Array<'ReturnByMail' | 'ReturnInStore' | 'ReturnAtKiosk'>;

  days?: number;
  type?: 'FullRefund' | 'ExchangeOnly' | 'StoreCredit';
  refundType?: 'FullRefund' | 'ExchangeOnly' | 'StoreCredit';
}

/**
 * The Contract: This function takes your Input and returns standard Schema.
 */
export type ProductMapper = (input: ProductInput) => Product | ProductGroup;