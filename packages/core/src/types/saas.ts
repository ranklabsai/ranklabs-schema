import type { SoftwareApplication, WebApplication } from 'schema-dts';
import type { ImageInput, VideoInput, AggregateRatingInput, ReviewInput } from './index';

/**
 * SAAS INPUT
 * Tailored for Web Apps, Mobile Apps, and Desktop Software.
 */
export interface SaaSInput {
  name: string;
  headline: string; // "The #1 AEO Tool for E-commerce"
  url: string;
  schemaId?: string;
  description?: string;
  
  // VISUALS
  screenshot?: ImageInput; // Use screenshot instead of generic 'image' for apps
  logo?: ImageInput;
  video?: VideoInput;

  // APP METADATA
  operatingSystem: string; // e.g. "Web", "iOS", "Windows 10"
  applicationCategory: string; // e.g. "BusinessApplication", "FinanceApplication"
  softwareVersion?: string;

  // PRICING (Subscription Logic)
  offers: {
    schemaId?: string;
    price: string | number; // "0" for free tier
    currency: string;
    priceValidUntil?: string;
    
    // SaaS Specifics
    billingDuration?: number; // e.g. 1
    billingUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'; // e.g. 'MONTH'
  };

  // SOCIAL PROOF
  rating?: AggregateRatingInput;
  reviews?: ReviewInput[];
}

export type SaaSMapper = (input: SaaSInput) => SoftwareApplication | WebApplication;