import type { Article, BlogPosting, FAQPage } from 'schema-dts';
import type { ImageInput, VideoInput, EntityReference, PersonRef, OrganizationRef } from './common';

/**
 * ARTICLE INPUT
 * Used for Blog Posts, News, and Tutorials.
 * AEO Goal: Establish the brand as a "Topic Expert."
 */
export interface ArticleInput {
  headline: string;
  description: string; // The "Snippet" for search results
  url: string;
  schemaId?: string;
  /**
   * BCP-47 language tag (e.g. "en-US", "fr-CA", "ja").
   * @see https://www.rfc-editor.org/rfc/rfc5646
   */
  language?: string;
  image?: ImageInput;
  video?: VideoInput;

  // METADATA
  datePublished: string; // ISO 8601
  dateModified: string;  // Critical for "Freshness" ranking

  // AUTHORSHIP (E-E-A-T)
  author: PersonRef | OrganizationRef; // Who wrote this?

  /**
   * The publisher of the article.
   *
   * Google's Article rich results require this to be an `Organization` (not a
   * Person) with a `logo` ImageObject (minimum 112px tall, max 600px wide,
   * on a transparent/white background. The mapper will warn in dev if the
   * publisher is a Person or is missing an image/logo.
   *
   * @see https://developers.google.com/search/docs/appearance/structured-data/article#logo-guidelines
   */
  publisher?: PersonRef | OrganizationRef;
  
  /**
   * SEMANTIC LINKS (The AEO Superweapon)
   * * 'about': What product/topic is this mostly about?
   * * 'mentions': What other things are discussed?
   * Connecting these allows AI to traverse from Blog -> Product.
   */
  about?: EntityReference[];
  mentions?: EntityReference[];

  /**
   * Topic keywords. LLMs (ChatGPT, Claude, Perplexity) use `keywords` for
   * topic clustering and retrieval. Pass as an array; the mapper joins it
   * comma-separated per Schema.org convention.
   * @see https://schema.org/keywords
   */
  keywords?: string[];

  /**
   * Passages voice assistants may read aloud, and which some answer engines
   * use to pull short-form quotes. Provide 1 to 3 CSS selectors (or XPath)
   * pointing at the summary-worthy sentences of the article.
   *
   * Note: as of 2026-Q1, formal ingestion of `speakable` by GPTBot,
   * ClaudeBot, and PerplexityBot is not publicly documented. The field is
   * valid Schema.org, costs almost nothing to emit, and helps voice
   * assistants, so it's still worth setting.
   * @see https://schema.org/speakable
   */
  speakable?: SpeakableSpecificationInput;

  /**
   * External works this article cites (research, authoritative URLs,
   * source material). Strengthens E-E-A-T; LLMs traverse citations to
   * assess authority.
   * @see https://schema.org/citation
   */
  citations?: EntityReference[];

  /**
   * Editorial category (e.g. "Home Decor", "Care Guides", "Style"). Used
   * by crawlers for taxonomy; used by LLMs to cluster your content by
   * topic.
   * @see https://schema.org/articleSection
   */
  articleSection?: string;

  /**
   * Approximate word count. Signals article depth to LLMs.
   * @see https://schema.org/wordCount
   */
  wordCount?: number;

  /**
   * Whether the article is free to read without a paywall. Default true;
   * set `false` if behind a subscription.
   * @see https://schema.org/isAccessibleForFree
   */
  isAccessibleForFree?: boolean;

  /**
   * The container this article belongs to, typically the blog itself or a
   * series. Use this to link many articles to one editorial property so
   * LLMs and search engines can cluster your content.
   *
   * Pass `{ type: 'Blog', id: 'https://example.com/blog#blog', name: 'The
   * Blog', url: 'https://example.com/blog' }` or similar. `type` defaults
   * to `'Blog'`.
   * @see https://schema.org/isPartOf
   */
  isPartOf?: {
    /**
     * Schema.org CreativeWork subtype for the container. Defaults to
     * `'Blog'`. Common alternates: `'CreativeWorkSeries'` for a series of
     * related articles, `'Periodical'` for magazines, `'WebSite'` if the
     * article is not under a blog at all.
     */
    type?: 'Blog' | 'CreativeWorkSeries' | 'Periodical' | 'WebSite';
    id?: string;
    name?: string;
    url?: string;
  };

  /**
   * Signals that this Article is the primary subject of the page at the
   * given URL. Accepts a plain URL (simplest) or a full WebPage ref.
   * Helps disambiguation when a page describes multiple entities.
   * @see https://schema.org/mainEntityOfPage
   */
  mainEntityOfPage?: string | { id?: string; url?: string };

  // TYPE SELECTION
  type?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'TechArticle';
}

/**
 * Schema.org SpeakableSpecification input. Provide `cssSelector`, `xpath`,
 * or both. Empty arrays are omitted by the mapper.
 */
export interface SpeakableSpecificationInput {
  cssSelector?: string[];
  xpath?: string[];
}

/**
 * FAQ INPUT
 * The #1 source for "Direct Answer" snippets in search.
 */
export interface FAQInput {
  title?: string; // Optional page title
  url?: string;
  schemaId?: string;
  /**
   * BCP-47 language tag (e.g. "en-US"). Emitted as `inLanguage`. Useful
   * for multi-locale sites where the same FAQ ships in several languages.
   */
  language?: string;
  questions: Array<{
    question: string;
    /**
     * The answer text. Google's FAQPage spec allows a limited subset of HTML
     * (`<h1>-<h6>`, `<br>`, `<ol>`, `<ul>`, `<li>`, `<a>`, `<p>`, `<div>`,
     * `<b>`, `<strong>`, `<i>`, `<em>`). Plain text is safer.
     *
     * If the answer comes from a CMS or user-generated source, sanitize before
     * passing. The mapper does not strip scripts or styles. Markdown is not
     * parsed; convert to allowed HTML or plain text first.
     */
    answer: string;
  }>;
}

/**
 * MAPPERS
 */
export type ArticleMapper = (input: ArticleInput) => Article | BlogPosting;
export type FAQMapper = (input: FAQInput) => FAQPage;