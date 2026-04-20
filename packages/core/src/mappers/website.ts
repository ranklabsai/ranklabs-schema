import type { WebSite, SearchAction } from 'schema-dts';
import type { WebSiteInput, SearchActionInput } from '../types';
import { canonicalId } from '../id';
import { devWarn } from '../utils/warn';

/**
 * MAP WEBSITE
 * The Root Entity. This should only appear once (on the Homepage).
 */
export function mapWebSite(input: WebSiteInput): WebSite {
  return {
    '@type': 'WebSite',
    '@id': input.schemaId || canonicalId.website(input.url),
    name: input.name,
    alternateName: input.alternateName,
    url: input.url,
    
    // SITELINKS SEARCH BOX LOGIC
    potentialAction: input.search ? mapSearchActions(input) : undefined,
  };
}

/**
 * HELPER: SEARCH ACTION
 * Defines how Google can query your site's internal search.
 */
export function mapSearchAction(input: SearchActionInput): SearchAction {
  const queryInput = input.queryInput || 'required name=search_term_string';
  const placeholderMatch = /name=([A-Za-z_][A-Za-z0-9_]*)/.exec(queryInput);
  const placeholder = placeholderMatch ? placeholderMatch[1] : 'search_term_string';
  if (!input.target.includes(`{${placeholder}}`)) {
    devWarn(
      `SearchAction target '${input.target}' is missing the '{${placeholder}}' placeholder. Sitelinks Searchbox will not work without it.`,
    );
  }
  return {
    '@type': 'SearchAction',
    '@id': input.schemaId || (input.url ? canonicalId.searchAction(input.url) : undefined),
    target: {
      '@type': 'EntryPoint',
      urlTemplate: input.target,
    },
    // Google-specific property (not in standard Schema.org types)
    // We cast the object to allow this extra property
    'query-input': queryInput,
  } as SearchAction & { 'query-input': string };
}

function mapSearchActions(input: WebSiteInput): SearchAction[] {
  if (!input.search) return [];

  return [
    mapSearchAction({
      url: input.search.url || input.url,
      schemaId: input.search.schemaId,
      target: input.search.target,
      queryInput: input.search.queryInput,
    }),
  ];
}