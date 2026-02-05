import type { Brand } from 'schema-dts';
import type { BrandInput } from '../types/brand';
import { canonicalId } from '../id';
import { mapImage } from './media';

/**
 * MAP BRAND
 */
export function mapBrand(input: BrandInput): Brand {
  return {
    '@type': 'Brand',
    '@id': input.schemaId || (input.url ? canonicalId.brand(input.url) : undefined),
    name: input.name,
    url: input.url,
    logo: input.logo ? mapImage(input.logo) : undefined,
    description: input.description,
    slogan: input.slogan,
    alternateName: input.alternateName,
    sameAs: input.sameAs,
  };
}