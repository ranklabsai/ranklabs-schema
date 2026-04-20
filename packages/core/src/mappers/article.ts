import type { Article, BlogPosting } from 'schema-dts';
import type { ArticleInput } from '../types'; // Ensure types/content.ts is exported in index
import { canonicalId } from '../id';
import { mapImage, mapVideo } from './media';
import { devWarn } from '../utils/warn';

/**
 * MAP ARTICLE
 * Handles Blog Posts, News, and general Articles.
 */
export function mapArticle(input: ArticleInput): Article | BlogPosting {
  const type = input.type || 'Article';

  if (input.publisher) {
    if (input.publisher.type !== 'Organization') {
      devWarn(
        `Article.publisher should be an Organization (got '${input.publisher.type}'). Google Article rich results require Organization as publisher.`,
      );
    }
    if (!input.publisher.image) {
      devWarn(
        `Article.publisher has no image/logo. Google requires publisher.logo as an ImageObject (min 112px tall) for Article rich results.`,
      );
    }
  }

  return {
    '@type': type,
    '@id': input.schemaId || canonicalId.article(input.url),
    headline: input.headline,
    description: input.description,
    url: input.url,
    inLanguage: input.language,
    
    // VISUALS
    image: input.image ? mapImage(input.image) : undefined,
    video: input.video ? mapVideo(input.video) : undefined,

    // DATES (Critical for Freshness)
    datePublished: input.datePublished,
    dateModified: input.dateModified,

    // AUTHORSHIP (E-E-A-T)
    author: {
      '@type': input.author.type, // 'Person' or 'Organization'
      '@id': input.author.id,
      name: input.author.name,
      url: input.author.url,
    },
    publisher: input.publisher ? {
      '@type': input.publisher.type,
      '@id': input.publisher.id,
      name: input.publisher.name,
      url: input.publisher.url,
      logo: input.publisher.image ? mapImage(input.publisher.image) : undefined
    } : undefined,

    // SEMANTIC LINKS (AEO Superweapon)
    about: input.about?.map(ref => ({
      '@type': 'Thing',
      name: ref.name,
      '@id': ref.id,
      url: ref.url
    })),

    mentions: input.mentions?.map(ref => ({
      '@type': 'Thing',
      name: ref.name,
      '@id': ref.id,
      url: ref.url
    })),

    citation: input.citations?.map(ref => ({
      '@type': 'Thing',
      name: ref.name,
      '@id': ref.id,
      url: ref.url,
    })),

    keywords: input.keywords && input.keywords.length > 0 ? input.keywords.join(',') : undefined,

    speakable: mapSpeakable(input.speakable),

    articleSection: input.articleSection,
    wordCount: input.wordCount,
    isAccessibleForFree: input.isAccessibleForFree,

    isPartOf: input.isPartOf
      ? {
          '@type': input.isPartOf.type ?? 'Blog',
          '@id': input.isPartOf.id,
          name: input.isPartOf.name,
          url: input.isPartOf.url,
        }
      : undefined,

    mainEntityOfPage: mapMainEntityOfPage(input.mainEntityOfPage),
  };
}

function mapMainEntityOfPage(
  input?: string | { id?: string; url?: string },
): string | { '@type': 'WebPage'; '@id'?: string; url?: string } | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return input;
  return { '@type': 'WebPage', '@id': input.id, url: input.url };
}

/**
 * HELPER: SPEAKABLE SPECIFICATION
 * Emits undefined if both selector arrays are empty/missing so the field
 * is cleanly omitted rather than rendered as an empty node.
 */
function mapSpeakable(
  input?: { cssSelector?: string[]; xpath?: string[] },
): { '@type': 'SpeakableSpecification'; cssSelector?: string[]; xpath?: string[] } | undefined {
  if (!input) return undefined;
  const cssSelector = input.cssSelector && input.cssSelector.length > 0 ? input.cssSelector : undefined;
  const xpath = input.xpath && input.xpath.length > 0 ? input.xpath : undefined;
  if (!cssSelector && !xpath) return undefined;
  return { '@type': 'SpeakableSpecification', cssSelector, xpath };
}