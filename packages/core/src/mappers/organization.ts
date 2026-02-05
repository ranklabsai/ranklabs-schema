import type { Organization, LocalBusiness, ContactPoint, PostalAddress, ContactPointOption } from 'schema-dts';
import type { OrganizationInput, ContactPointInput, AddressInput } from '../types';
import { canonicalId } from '../id';
import { mapImage } from './media';
import { CONTACT_OPTION } from '../constants';

/**
 * MAP ORGANIZATION
 * Handles both online-only brands and physical local businesses.
 */
export function mapOrganization(input: OrganizationInput): Organization | LocalBusiness {
  const base: Organization = {
    '@type': 'Organization',
    '@id': input.schemaId || canonicalId.organization(input.url),
    name: input.name,
    legalName: input.legalName,
    alternateName: input.alternateName,
    description: input.description,
    url: input.url,
    
    // VISUAL IDENTITY
    logo: mapImage(input.logo), // Uses our strict media mapper
    
    // REPUTATION & KNOWLEDGE GRAPH
    // The "sameAs" array connects your site to LinkedIn, Twitter, Wikipedia, etc.
    sameAs: input.sameAs, 

    // CONTACT & SUPPORT
    contactPoint: input.contactPoints?.map(mapContactPoint),

    founder: input.founders?.map((f) => ({
      '@type': 'Person',
      name: f.name,
      jobTitle: f.jobTitle,
    })),
    
    // ADDRESS (Headquarters)
    address: input.address ? mapAddress(input.address) : undefined,
  };

  // LOGIC BRANCH: LOCAL BUSINESS
  // If this is a physical store, we upgrade the schema to 'LocalBusiness'.
  if (input.isLocalBusiness) {
    return {
      ...base,
      '@type': 'LocalBusiness', // or 'Store'
      priceRange: input.priceRange || '$$', // Required for LocalBusiness
      
      // MAP COORDINATES
      geo: input.geo ? {
        '@type': 'GeoCoordinates',
        latitude: input.geo.latitude,
        longitude: input.geo.longitude,
      } : undefined,

      // OPENING HOURS
      openingHoursSpecification: input.openingHours?.map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.dayOfWeek,
        opens: h.opens,
        closes: h.closes,
      })),
    } as LocalBusiness;
  }

  return base;
}

/**
 * HELPER: CONTACT POINT
 * Critical for "Customer Service" rich snippets in search.
 */
function mapContactPoint(input: ContactPointInput): ContactPoint {
  const options: ContactPointOption[] = [];

  if (input.tollFree) {
    options.push(CONTACT_OPTION.TOLL_FREE);
  }
  
  if (input.hearingImpaired) {
    options.push(CONTACT_OPTION.HEARING_IMPAIRED);
  }

  return {
    '@type': 'ContactPoint',
    telephone: input.telephone,
    contactType: input.contactType,
    email: input.email,
    areaServed: input.areaServed,
    availableLanguage: input.availableLanguage,
    
    // Schema allows a single string OR an array. 
    // We prefer array if multiple exist, or undefined if empty.
    contactOption: options.length > 0 ? options : undefined
  };
}

/**
 * HELPER: ADDRESS
 * Standard PostalAddress mapping.
 */
function mapAddress(input: AddressInput): PostalAddress {
  return {
    '@type': 'PostalAddress',
    streetAddress: input.streetAddress,
    addressLocality: input.addressLocality,
    addressRegion: input.addressRegion,
    postalCode: input.postalCode,
    addressCountry: input.addressCountry,
  };
}