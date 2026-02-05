import type { Article, BlogPosting } from 'schema-dts';
import type { ArticleInput } from '../types'; // Ensure types/content.ts is exported in index
import { canonicalId } from '../id';
import { mapImage, mapVideo } from './media';

/**
 * MAP ARTICLE
 * Handles Blog Posts, News, and general Articles.
 */
export function mapArticle(input: ArticleInput): Article | BlogPosting {
  const type = input.type || 'Article';

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
  };
}