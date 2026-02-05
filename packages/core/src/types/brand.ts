import type { Brand } from 'schema-dts';
import type { ImageInput } from './common';

export interface BrandInput {
  name: string;
  schemaId?: string;
  url?: string; // Optional: Link to brand page
  logo?: ImageInput;
  description?: string;
  slogan?: string;
  alternateName?: string;
  sameAs?: string[]; // Social profiles for the brand
}

export type BrandMapper = (input: BrandInput) => Brand;