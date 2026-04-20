import type { WebPage, BreadcrumbList, ListItem } from 'schema-dts';
import type { WebPageInput, BreadcrumbInput } from '../types';
import { canonicalId } from '../id';

/**
 * MAP WEB PAGE
 * The wrapper that contextualizes every URL on your site.
 */
export function mapWebPage(input: WebPageInput): WebPage {
  return {
    '@type': 'WebPage',
    '@id': input.schemaId || canonicalId.webpage(input.url),
    name: input.title,
    description: input.description,
    url: input.url,
    
    inLanguage: input.language || 'en-US',

    // CONTENT DATES (Critical for Freshness signals)
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    lastReviewed: input.lastReviewed,

    speakable: input.speakable && (input.speakable.cssSelector?.length || input.speakable.xpath?.length)
      ? {
          '@type': 'SpeakableSpecification',
          cssSelector: input.speakable.cssSelector?.length ? input.speakable.cssSelector : undefined,
          xpath: input.speakable.xpath?.length ? input.speakable.xpath : undefined,
        }
      : undefined,

    // BREADCRUMBS
    // Maps the navigation path (Home > Shoes > Nike)
    breadcrumb: input.breadcrumb
      ? mapBreadcrumbList(input.breadcrumb)
      : input.breadcrumbs
        ? mapBreadcrumbList(input.breadcrumbs[0])
        : undefined,

    // PUBLISHER
    // If the page has a specific publisher (like an author or brand context)
    publisher: input.publisher ? {
      '@type': input.publisher.type, // 'Organization' or 'Person'
      name: input.publisher.name,
      url: input.publisher.url,
      '@id': input.publisher.id,
    } : undefined,

    // Primary-subject signal
    mainEntityOfPage: input.mainEntityOfPage
      ? typeof input.mainEntityOfPage === 'string'
        ? input.mainEntityOfPage
        : {
            '@type': 'WebPage',
            '@id': input.mainEntityOfPage.id,
            url: input.mainEntityOfPage.url,
          }
      : undefined,
  };
}

/**
 * MAP BREADCRUMB LIST
 * AEO Importance: High. Tells AI the hierarchy of your site.
 */
export function mapBreadcrumbList(input: BreadcrumbInput): BreadcrumbList {
  const listUrl = input.url || input.items[input.items.length - 1]?.item || input.items[0]?.item;
  return {
    '@type': 'BreadcrumbList',
    '@id': listUrl ? canonicalId.breadcrumb(listUrl) : undefined,
    itemListElement: input.items.map((item, index): ListItem => {
      // Explicitly construct the ListItem to enforce Schema standards
      return {
        '@type': 'ListItem',
        position: index + 1, // Critical: 1-based index
        name: item.name,
        item: item.item, // The URL string serves as the ID
      };
    }),
  };
}