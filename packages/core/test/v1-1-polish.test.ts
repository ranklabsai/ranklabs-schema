/**
 * Tests for the final v1.1.0 polish round:
 *  - ProductWithExtensions return-type precision (no `as Product` cast)
 *  - Review.itemReviewed and AggregateRating.itemReviewed
 *  - Review.language and FAQInput.language
 *  - mainEntityOfPage on Article, Product, WebPage
 *  - Product.keywords
 *  - CollectionPage pagination
 *  - Module-state reset hooks for dev warnings
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetCanonicalizationWarningsForTests,
  __resetFaqWarningForTests,
  canonicalId,
  mapAggregateRating,
  mapArticle,
  mapCollectionPage,
  mapFAQPage,
  mapProduct,
  mapReview,
  mapWebPage,
  type MappedProduct,
  type MappedProductGroup,
} from '@ranklabs/schema';

/* ─────────────────────────────────────────────────────────────────────────
 * MappedProduct type exports compile
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1 polish: MappedProduct / MappedProductGroup types', () => {
  it('mapProduct single return is MappedProduct-compatible (without cast)', () => {
    // If mapProduct's return type is inferred as `MappedProduct |
    // MappedProductGroup`, this assignment compiles without any `as` cast.
    const p: MappedProduct | MappedProductGroup = mapProduct({
      id: 'p1',
      title: 'Widget',
      description: 'A widget',
      handle: 'widget',
      url: 'https://example.com/products/widget',
      images: [{ url: 'https://example.com/w.jpg', altText: 'Widget' }],
      brand: 'Acme',
      offers: { price: 10, currency: 'USD', availability: 'InStock' },
    });
    expect(p['@type']).toBe('Product');
  });

  it('mapProduct with variants return is MappedProductGroup-compatible (without cast)', () => {
    const g: MappedProduct | MappedProductGroup = mapProduct({
      id: 'pg1',
      title: 'Widget',
      description: 'A widget family',
      handle: 'widget',
      url: 'https://example.com/products/widget',
      images: [{ url: 'https://example.com/w.jpg', altText: 'Widget' }],
      brand: 'Acme',
      offers: { price: 10, currency: 'USD', availability: 'InStock' },
      variants: [
        {
          id: 'v1',
          sku: 'W-V1',
          title: 'Small',
          url: 'https://example.com/products/widget?variant=v1',
          image: { url: 'https://example.com/w1.jpg', altText: 'Small' },
          offers: { price: 10, currency: 'USD', availability: 'InStock' },
        },
      ],
    });
    expect(g['@type']).toBe('ProductGroup');
    if (g['@type'] === 'ProductGroup') {
      expect(g.hasVariant).toBeDefined();
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Review.itemReviewed and AggregateRating.itemReviewed
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1 polish: Review.itemReviewed', () => {
  it('emits itemReviewed ref on Review when provided', () => {
    const r: any = mapReview({
      author: 'Jane',
      datePublished: '2026-01-01',
      reviewBody: 'Great.',
      rating: 5,
      itemReviewed: {
        type: 'Thing',
        id: canonicalId.product('https://example.com/products/x'),
        name: 'Product X',
        url: 'https://example.com/products/x',
      },
    });
    expect(r.itemReviewed).toEqual({
      '@type': 'Thing',
      '@id': 'https://example.com/products/x#product',
      name: 'Product X',
      url: 'https://example.com/products/x',
    });
  });

  it('emits inLanguage when review language is set', () => {
    const r: any = mapReview({
      author: 'Jane',
      datePublished: '2026-01-01',
      reviewBody: 'Great.',
      rating: 5,
      language: 'en-US',
    });
    expect(r.inLanguage).toBe('en-US');
  });

  it('omits itemReviewed and inLanguage when absent', () => {
    const r: any = mapReview({
      author: 'Jane',
      datePublished: '2026-01-01',
      reviewBody: 'Great.',
      rating: 5,
    });
    expect(r.itemReviewed).toBeUndefined();
    expect(r.inLanguage).toBeUndefined();
  });
});

describe('v1.1 polish: AggregateRating.itemReviewed', () => {
  it('emits itemReviewed ref on AggregateRating when provided', () => {
    const ar: any = mapAggregateRating({
      ratingValue: 4.7,
      reviewCount: 12,
      itemReviewed: {
        type: 'Thing',
        id: 'https://example.com/products/x#product',
        name: 'Product X',
        url: 'https://example.com/products/x',
      },
    });
    expect(ar.itemReviewed).toEqual({
      '@type': 'Thing',
      '@id': 'https://example.com/products/x#product',
      name: 'Product X',
      url: 'https://example.com/products/x',
    });
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * FAQInput.language
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1 polish: FAQInput.language', () => {
  it('emits inLanguage on FAQPage when language is set', () => {
    const f: any = mapFAQPage({
      title: 'FAQ',
      url: 'https://example.com/faq',
      language: 'fr-CA',
      questions: [{ question: 'Bonjour?', answer: 'Oui.' }],
    });
    expect(f.inLanguage).toBe('fr-CA');
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * mainEntityOfPage
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1 polish: mainEntityOfPage on Article', () => {
  it('accepts a URL string', () => {
    const a: any = mapArticle({
      headline: 'Hi',
      description: 'body',
      url: 'https://example.com/blog/hi',
      datePublished: '2026-01-01',
      dateModified: '2026-01-01',
      author: { type: 'Person', id: 'https://example.com/#me', name: 'Me' },
      mainEntityOfPage: 'https://example.com/blog/hi',
    });
    expect(a.mainEntityOfPage).toBe('https://example.com/blog/hi');
  });

  it('accepts a WebPage ref and emits the full node', () => {
    const a: any = mapArticle({
      headline: 'Hi',
      description: 'body',
      url: 'https://example.com/blog/hi',
      datePublished: '2026-01-01',
      dateModified: '2026-01-01',
      author: { type: 'Person', id: 'https://example.com/#me', name: 'Me' },
      mainEntityOfPage: {
        id: 'https://example.com/blog/hi#webpage',
        url: 'https://example.com/blog/hi',
      },
    });
    expect(a.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://example.com/blog/hi#webpage',
      url: 'https://example.com/blog/hi',
    });
  });
});

describe('v1.1 polish: mainEntityOfPage on Product', () => {
  it('emits on the Product when provided', () => {
    const p: any = mapProduct({
      id: 'p1',
      title: 'Widget',
      description: 'A widget',
      handle: 'widget',
      url: 'https://example.com/products/widget',
      images: [{ url: 'https://example.com/w.jpg', altText: 'Widget' }],
      brand: 'Acme',
      offers: { price: 10, currency: 'USD', availability: 'InStock' },
      mainEntityOfPage: 'https://example.com/products/widget',
    });
    expect(p.mainEntityOfPage).toBe('https://example.com/products/widget');
  });
});

describe('v1.1 polish: mainEntityOfPage on WebPage', () => {
  it('emits on WebPage with object form', () => {
    const w: any = mapWebPage({
      title: 'Page',
      description: '...',
      url: 'https://example.com/page',
      mainEntityOfPage: { id: 'https://example.com/page#webpage' },
    });
    expect(w.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://example.com/page#webpage',
      url: undefined,
    });
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Product.keywords
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1 polish: Product.keywords', () => {
  it('joins keywords comma-separated, like Article', () => {
    const p: any = mapProduct({
      id: 'p1',
      title: 'Widget',
      description: 'A widget',
      handle: 'widget',
      url: 'https://example.com/products/widget',
      images: [{ url: 'https://example.com/w.jpg', altText: 'Widget' }],
      brand: 'Acme',
      offers: { price: 10, currency: 'USD', availability: 'InStock' },
      keywords: ['widget', 'gadget', 'thing'],
    });
    expect(p.keywords).toBe('widget,gadget,thing');
  });

  it('omits keywords when empty or missing', () => {
    const p: any = mapProduct({
      id: 'p1',
      title: 'Widget',
      description: 'A widget',
      handle: 'widget',
      url: 'https://example.com/products/widget',
      images: [{ url: 'https://example.com/w.jpg', altText: 'Widget' }],
      brand: 'Acme',
      offers: { price: 10, currency: 'USD', availability: 'InStock' },
    });
    expect(p.keywords).toBeUndefined();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * CollectionPage pagination
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1 polish: CollectionPage pagination', () => {
  it('emits previousItem and nextItem when previousUrl/nextUrl are set', () => {
    const page: any = mapCollectionPage({
      title: 'Rugs',
      description: 'All rugs',
      url: 'https://example.com/collections/rugs?page=2',
      products: [],
      pagination: {
        totalItems: 240,
        previousUrl: 'https://example.com/collections/rugs?page=1',
        nextUrl: 'https://example.com/collections/rugs?page=3',
      },
    });
    expect(page.previousItem).toEqual({
      '@type': 'WebPage',
      url: 'https://example.com/collections/rugs?page=1',
    });
    expect(page.nextItem).toEqual({
      '@type': 'WebPage',
      url: 'https://example.com/collections/rugs?page=3',
    });
  });

  it('ItemList.numberOfItems reflects totalItems when paginated', () => {
    const page: any = mapCollectionPage({
      title: 'Rugs',
      description: 'All rugs',
      url: 'https://example.com/collections/rugs?page=2',
      products: [
        {
          id: 'p1',
          title: 'Rug',
          description: '...',
          handle: 'rug',
          url: 'https://example.com/products/rug',
          images: [{ url: 'https://example.com/r.jpg', altText: 'Rug' }],
          brand: 'Acme',
          offers: { price: 100, currency: 'USD', availability: 'InStock' },
        },
      ],
      pagination: { totalItems: 240 },
    });
    expect(page.mainEntity.numberOfItems).toBe(240);
  });

  it('ItemList.numberOfItems falls back to products.length without pagination', () => {
    const page: any = mapCollectionPage({
      title: 'Rugs',
      description: 'All rugs',
      url: 'https://example.com/collections/rugs',
      products: [
        {
          id: 'p1',
          title: 'Rug',
          description: '...',
          handle: 'rug',
          url: 'https://example.com/products/rug',
          images: [{ url: 'https://example.com/r.jpg', altText: 'Rug' }],
          brand: 'Acme',
          offers: { price: 100, currency: 'USD', availability: 'InStock' },
        },
      ],
    });
    expect(page.mainEntity.numberOfItems).toBe(1);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Module-state reset hooks (for deterministic dev-warning tests)
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1 polish: module-state reset hooks', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('__resetFaqWarningForTests re-arms the FAQ dev warning', () => {
    __resetFaqWarningForTests();
    mapFAQPage({ questions: [{ question: 'Q?', answer: 'A.' }] });
    const firstCall = warnSpy.mock.calls.filter((c) =>
      String(c[0]).toLowerCase().includes('faqpage'),
    ).length;
    expect(firstCall).toBeGreaterThanOrEqual(1);

    // Second call within the same session should not re-fire
    mapFAQPage({ questions: [{ question: 'Q2?', answer: 'A2.' }] });
    const secondCall = warnSpy.mock.calls.filter((c) =>
      String(c[0]).toLowerCase().includes('faqpage'),
    ).length;
    expect(secondCall).toBe(firstCall);

    // After reset, the next call re-fires
    __resetFaqWarningForTests();
    mapFAQPage({ questions: [{ question: 'Q3?', answer: 'A3.' }] });
    const afterReset = warnSpy.mock.calls.filter((c) =>
      String(c[0]).toLowerCase().includes('faqpage'),
    ).length;
    expect(afterReset).toBeGreaterThan(firstCall);
  });

  it('__resetCanonicalizationWarningsForTests is exported and callable', () => {
    // Smoke test: the function exists and does not throw.
    expect(() => __resetCanonicalizationWarningsForTests()).not.toThrow();
  });
});
