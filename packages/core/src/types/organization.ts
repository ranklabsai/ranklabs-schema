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
   *
   * High-leverage entries (LLM entity grounding): Wikipedia article URL,
   * Wikidata Q-ID URL, LinkedIn company page, Crunchbase profile.
   * Social profiles alone are weaker signals. Pair them with knowledge-graph
   * sources when available.
   */
  sameAs?: string[];

  /**
   * URL to a page describing the Organization's editorial / content
   * policy, sourcing standards, or code of ethics. Google cites
   * publishingPrinciples as an E-E-A-T signal for content authority.
   * @see https://schema.org/publishingPrinciples
   */
  publishingPrinciples?: string;

  /**
   * Awards, certifications, or recognitions received by the organization
   * (e.g. "B Corp certified", "Red Dot Design Award 2024").
   * @see https://schema.org/award
   */
  award?: string | string[];

  /**
   * BCP-47 language tags the organization operates in (e.g. `["en-US",
   * "fr-CA"]`). Useful signal for multi-locale brands so LLMs and Google
   * understand which languages your content is authored in.
   * @see https://schema.org/knowsLanguage
   * @see https://www.rfc-editor.org/rfc/rfc5646
   */
  knowsLanguage?: string[];

  /**
   * Geographic areas the organization serves. Accepts ISO 3166-1 alpha-2
   * country codes as strings (e.g. `["US", "CA", "AU", "GB"]`) or free-form
   * region names.
   * @see https://schema.org/areaServed
   */
  areaServed?: string | string[];

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