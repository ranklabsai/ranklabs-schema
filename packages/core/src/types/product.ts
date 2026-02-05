import type { Product, ProductGroup } from 'schema-dts';
import type { ImageInput, VideoInput, AddressInput } from './common';
import type { ReviewInput, AggregateRatingInput } from './review';
import type { BrandInput } from './brand';

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