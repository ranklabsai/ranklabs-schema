/**
 *  CORE - COMMON TYPES
 * * These are the atomic building blocks used across the entire Knowledge Graph.
 * We enforce strict typing here to ensure AEO best practices (like Alt Text)
 * are never skipped.
 */

// 1. MEDIA TYPES
// AI engines rely heavily on media metadata to index visual content.

export interface ImageInput {
  url: string;
  /** * AEO CRITICAL: AI uses alt text to "see" the image. 
   * Missing alt text leads to lower confidence scores in Answer Engines.
   */
  altText: string; 
  width?: number;
  height?: number;
  caption?: string;
}

export interface VideoInput {
  url: string;        // The actual content (mp4, m3u8)
  thumbnailUrl: string; // Required for Google Video Rich Results
  title: string;
  description: string;
  uploadDate: string; // ISO 8601
  duration?: string;  // ISO 8601 Duration (e.g., PT1M30S)
  embedUrl?: string;  // If hosted on YouTube/Vimeo
}

// 2. LOCATION & ADDRESS TYPES
// Critical for "Near Me" queries and establishing Local Authority.

export interface AddressInput {
  streetAddress: string;
  addressLocality: string; // City
  addressRegion: string;   // State/Province (ISO code preferred, e.g., "NJ")
  postalCode: string;
  addressCountry: string;  // ISO 3166-1 alpha-2 (e.g., "US")
}

export interface GeoInput {
  latitude: number;
  longitude: number;
}

// 3. ACTION TYPES
// These define what a user can DO (Buy, Read, Watch). 
// Used in "PotentialAction" schema.

export interface ActionInput {
  target: string; // The URL to perform the action
  name?: string;  // e.g., "Buy Now"
  type?: 'BuyAction' | 'ReadAction' | 'SearchAction' | 'ViewAction';
}

// 4. LINK & HIERARCHY
// Simple references to other entities.

export interface Link {
  text: string;
  url: string;
}

/**
 * A generic reference to a Person or Organization.
 * Used for "Author", "Brand", "Manufacturer", etc.
 */

// 1. The Base (Shared props)
interface BaseEntityRef {
  id: string; // Required for Graph linking
  name: string;
  url?: string;
  image?: ImageInput;
}

// 2. Specific Subtypes
export interface PersonRef extends BaseEntityRef {
  type: 'Person';
}

export interface OrganizationRef extends BaseEntityRef {
  type: 'Organization';
}

export interface ThingRef extends BaseEntityRef {
  type: 'Thing';
}

// 3. The Union (For when it can be anything, like a "mention")
export type EntityReference = PersonRef | OrganizationRef | ThingRef;