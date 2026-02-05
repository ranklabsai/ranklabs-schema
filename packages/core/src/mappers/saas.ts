import type { SoftwareApplication, Offer, UnitPriceSpecification } from 'schema-dts';
import type { SaaSInput } from '../types/saas';
import { canonicalId } from '../id';
import { mapAggregateRating, mapReview } from './review';
import { mapImage, mapVideo } from './media';
import { AVAILABILITY } from '../constants';

/**
 * MAP SAAS / SOFTWARE
 * Generates the "App" rich snippet logic.
 */
export function mapSaaS(input: SaaSInput): SoftwareApplication {
  return {
    '@type': 'SoftwareApplication',
    '@id': input.schemaId || canonicalId.softwareApplication(input.url),
    name: input.name,
    headline: input.headline,
    description: input.description || input.headline,
    url: input.url,
    
    // APP SPECIFICS
    operatingSystem: input.operatingSystem,
    applicationCategory: input.applicationCategory,
    softwareVersion: input.softwareVersion,

    // VISUALS
    screenshot: input.screenshot ? mapImage(input.screenshot) : undefined,
    image: input.logo ? mapImage(input.logo) : undefined,
    video: input.video ? mapVideo(input.video) : undefined,

    // REPUTATION
    aggregateRating: input.rating ? mapAggregateRating(input.rating) : undefined,
    review: input.reviews?.map(mapReview),

    // PRICING (Fixed: Uses helper to strictly return 'Offer')
    offers: mapSaaSOffer(input.offers, input.url),
  };
}

/**
 * HELPER: SAAS OFFER
 * Handles the subscription pricing logic.
 */
function mapSaaSOffer(offerInput: SaaSInput['offers'], appUrl?: string): Offer {
  return {
    '@type': 'Offer',
    '@id': offerInput.schemaId || (appUrl ? canonicalId.offer(appUrl, 'primary') : undefined),
    url: appUrl,
    price: offerInput.price,
    priceCurrency: offerInput.currency,
    availability: AVAILABILITY.IN_STOCK, 
    priceValidUntil: offerInput.priceValidUntil,
    
    // The Critical Piece for SaaS SEO:
    priceSpecification: mapSubscriptionPricing(offerInput),
  };
}

/**
 * HELPER: SUBSCRIPTION PRICING
 * Defines "per Month" or "per Year" logic using UnitPriceSpecification.
 */
function mapSubscriptionPricing(offerInput: SaaSInput['offers']): UnitPriceSpecification | undefined {
  if (!offerInput.billingUnit) return undefined;

  return {
    '@type': 'UnitPriceSpecification',
    price: offerInput.price,
    priceCurrency: offerInput.currency,
    referenceQuantity: {
      '@type': 'QuantitativeValue',
      value: offerInput.billingDuration || 1,
      unitCode: mapUnitCode(offerInput.billingUnit),
    }
  };
}

/**
 * HELPER: UNIT CODES
 */
function mapUnitCode(unit: string): string {
  const map: Record<string, string> = {
    'DAY': 'DAY',
    'WEEK': 'WEE',
    'MONTH': 'MON',
    'YEAR': 'ANN',
  };
  return map[unit] || 'MON';
}