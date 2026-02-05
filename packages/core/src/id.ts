 import { canonicalizeUrlStringWithDevWarnings } from './canonicalize';

export function originOfUrl(url: string): string {
  return new URL(canonicalizeUrlStringWithDevWarnings(url)).origin;
}

export function canonicalUrl(url: string): string {
  return canonicalizeUrlStringWithDevWarnings(url);
}

function fragmentId(baseUrl: string, fragment: string): string {
  return `${originOfUrl(baseUrl)}/#${fragment}`;
}

export const canonicalId = {
  url: (url: string) => canonicalUrl(url),
  webpage: (pageUrl: string) => `${canonicalUrl(pageUrl)}#webpage`,
  product: (productUrl: string) => `${canonicalUrl(productUrl)}#product`,
  productGroup: (productUrl: string) => `${canonicalUrl(productUrl)}#product-group`,
  collectionPage: (pageUrl: string) => `${canonicalUrl(pageUrl)}#collection-page`,
  article: (pageUrl: string) => `${canonicalUrl(pageUrl)}#article`,
  faqPage: (pageUrl: string) => `${canonicalUrl(pageUrl)}#faq`,
  softwareApplication: (pageUrl: string) => `${canonicalUrl(pageUrl)}#software-application`,
  brand: (brandUrl: string) => `${canonicalUrl(brandUrl)}#brand`,
  review: (pageUrl: string, key?: string) => `${canonicalUrl(pageUrl)}#review${key ? `-${key}` : ''}`,
  aggregateRating: (pageUrl: string, key?: string) => `${canonicalUrl(pageUrl)}#aggregate-rating${key ? `-${key}` : ''}`,
  website: (siteUrl: string) => fragmentId(siteUrl, 'website'),
  organization: (siteUrl: string) => fragmentId(siteUrl, 'org'),
  breadcrumb: (pageUrl: string, key?: string) => `${canonicalUrl(pageUrl)}#breadcrumb${key ? `-${key}` : ''}`,
  itemList: (pageUrl: string, key?: string) => `${canonicalUrl(pageUrl)}#itemlist${key ? `-${key}` : ''}`,
  offer: (pageUrl: string, key?: string) => `${canonicalUrl(pageUrl)}#offer${key ? `-${key}` : ''}`,
  searchAction: (siteUrl: string) => fragmentId(siteUrl, 'search-action'),
} as const;
