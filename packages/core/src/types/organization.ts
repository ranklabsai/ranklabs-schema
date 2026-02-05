import type { Organization, LocalBusiness } from 'schema-dts';
import type { ImageInput, AddressInput, GeoInput } from './common';

/**
 * ORGANIZATION INPUT
 * Represents the Brand, the Publisher, or the Physical Store.
 */
export interface OrganizationInput {
  // Identity
  name: string;
  schemaId?: string;
  url: string;
  logo: ImageInput;     // Required for Google Brand Signals
  legalName?: string;   // e.g. "RankLabs, Inc."
  alternateName?: string; // Acronyms or doing-business-as names
  description?: string;
  
  /**
   * KNOWLEDGE GRAPH LINKS (Critical for AEO)
   * List every social profile, Wikipedia page, or Wikidata entry here.
   * This helps the AI "reconcile" your entity across the web.
   */
  sameAs?: string[]; 

  // Authority Signals
  founders?: Array<{
    name: string;
    jobTitle?: string;
  }>;

  // Trust & Support (Customer Service)
  contactPoints?: ContactPointInput[];

  // Location (Headquarters or Physical Store)
  address?: AddressInput;

  /**
   * LOCAL BUSINESS TOGGLE
   * If true, this switches the output from a generic 'Organization'
   * to a 'LocalBusiness' (or 'Store'), enabling Map features.
   */
  isLocalBusiness?: boolean; 
  geo?: GeoInput;          // Latitude/Longitude
  priceRange?: string;     // e.g. "$$" or "$$$"
  
  openingHours?: Array<{
    dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | string[];
    opens: string;  // '09:00' (24h format)
    closes: string; // '17:00'
  }>;
}

/**
 * CONTACT POINT INPUT
 * Used to display the "Call Customer Service" button in search results.
 */
export interface ContactPointInput {
  telephone: string; // Must include country code (e.g. "+1-555-0100")
  contactType: 'customer service' | 'sales' | 'technical support' | 'billing support';
  email?: string;
  areaServed?: string | string[]; // e.g. "US", ["US", "CA", "GB"]
  availableLanguage?: string | string[]; // e.g. "English", "es"
  tollFree?: boolean;
  hearingImpaired?: boolean;
}

/**
 * MAPPER
 * Can return Organization or the more specific LocalBusiness/Store
 */
export type OrganizationMapper = (input: OrganizationInput) => Organization | LocalBusiness;