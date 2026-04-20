import { describe, expect, it } from 'vitest';

import {
  canonicalId,
  createGraph,
  formatRichResultIssues,
  mapAggregateRating,
  mapArticle,
  mapBreadcrumbList,
  mapCollectionPage,
  mapFAQPage,
  mapImage,
  mapOffer,
  mapOrganization,
  mapProduct,
  mapReview,
  mapWebPage,
  mapWebSite,
  validateRichResults,
  type RichResultIssue,
} from '@ranklabs/schema';

/* ─────────────────────────────────────────────────────────────────────────
 * Image: alt text semantics
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: image alt text', () => {
  it('emits altText as ImageObject.name (not caption)', () => {
    const img = mapImage({ url: 'https://example.com/x.jpg', altText: 'A red rug' });
    expect(img.name).toBe('A red rug');
    expect(img.caption).toBeUndefined();
  });

  it('preserves explicit caption alongside name', () => {
    const img = mapImage({
      url: 'https://example.com/x.jpg',
      altText: 'A red rug',
      caption: 'Hand-knotted wool, shot in natural light',
    });
    expect(img.name).toBe('A red rug');
    expect(img.caption).toBe('Hand-knotted wool, shot in natural light');
  });

  it('round-trips dimensions as QuantitativeValue', () => {
    const img: any = mapImage({
      url: 'https://example.com/x.jpg',
      altText: 'Rug',
      width: 1200,
      height: 800,
    });
    expect(img.width).toEqual({ '@type': 'QuantitativeValue', value: 1200 });
    expect(img.height).toEqual({ '@type': 'QuantitativeValue', value: 800 });
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Offer: availability window
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: Offer availabilityStarts / availabilityEnds', () => {
  it('passes through ISO dates for PreOrder', () => {
    const offer = mapOffer({
      price: 100,
      currency: 'USD',
      availability: 'PreOrder',
      availabilityStarts: '2026-05-01T00:00:00Z',
      availabilityEnds: '2026-06-01T00:00:00Z',
    });
    expect(offer.availabilityStarts).toBe('2026-05-01T00:00:00Z');
    expect(offer.availabilityEnds).toBe('2026-06-01T00:00:00Z');
    expect(offer.availability).toBe('https://schema.org/PreOrder');
  });

  it('omits date fields when not provided', () => {
    const offer = mapOffer({ price: 100, currency: 'USD', availability: 'InStock' });
    expect(offer.availabilityStarts).toBeUndefined();
    expect(offer.availabilityEnds).toBeUndefined();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Product: provenance
 * ──────────────────────────────────────────────────────────────────────── */

function baseProductInput(overrides: Partial<Parameters<typeof mapProduct>[0]> = {}) {
  return {
    id: 'p1',
    title: 'Rug',
    description: 'Nice rug',
    handle: 'rug',
    url: 'https://example.com/products/rug',
    images: [{ url: 'https://example.com/img.jpg', altText: 'Rug' }],
    brand: 'Acme',
    offers: { price: 100, currency: 'USD', availability: 'InStock' } as const,
    ...overrides,
  };
}

describe('v1.1: Product countryOfOrigin / countryOfAssembly', () => {
  it('emits countryOfOrigin as a Country node', () => {
    const product: any = mapProduct(
      baseProductInput({ countryOfOrigin: 'TR', countryOfAssembly: 'MA' }),
    );
    expect(product.countryOfOrigin).toEqual({ '@type': 'Country', name: 'TR' });
    expect(product.countryOfAssembly).toBe('MA');
  });

  it('omits country fields when not provided', () => {
    const product: any = mapProduct(baseProductInput());
    expect(product.countryOfOrigin).toBeUndefined();
    expect(product.countryOfAssembly).toBeUndefined();
  });

  it('ProductGroup retains countryOfOrigin at the group level', () => {
    const group: any = mapProduct(
      baseProductInput({
        countryOfOrigin: 'IN',
        variants: [
          {
            id: 'v1',
            sku: 'SKU1',
            title: 'Rug: small',
            url: 'https://example.com/products/rug?variant=v1',
            image: { url: 'https://example.com/v1.jpg', altText: 'Small' },
            offers: { price: 100, currency: 'USD', availability: 'InStock' },
          },
        ],
      }),
    );
    expect(group['@type']).toBe('ProductGroup');
    expect(group.countryOfOrigin).toEqual({ '@type': 'Country', name: 'IN' });
    expect(group.hasVariant).toHaveLength(1);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * validateRichResults: per-type rule coverage
 * ──────────────────────────────────────────────────────────────────────── */

function byPath(issues: RichResultIssue[], needle: string): RichResultIssue | undefined {
  return issues.find((i) => i.path.endsWith(needle));
}

describe('v1.1: validateRichResults: Product / Offer / ProductGroup', () => {
  it('flags a Product missing name and offers', () => {
    const issues = validateRichResults({ '@type': 'Product', description: 'no name' });
    expect(byPath(issues, '.name')?.severity).toBe('required');
    expect(byPath(issues, '.offers')?.severity).toBe('required');
  });

  it('flags Product with no image (required)', () => {
    const issues = validateRichResults({
      '@type': 'Product',
      name: 'Rug',
      offers: { '@type': 'Offer', price: 1, priceCurrency: 'USD', availability: 'x' },
    });
    expect(byPath(issues, '.image')?.severity).toBe('required');
  });

  it('passes a fully-formed Product+Offer graph', () => {
    const graph = createGraph(mapProduct(baseProductInput({ gtin13: '1234567890123' })));
    const required = validateRichResults(graph).filter((i) => i.severity === 'required');
    expect(required).toEqual([]);
  });

  it('recurses into nested Offer inside a Product and flags it', () => {
    const issues = validateRichResults({
      '@type': 'Product',
      name: 'Rug',
      image: 'https://example.com/x.jpg',
      offers: {
        '@type': 'Offer',
        // missing price, priceCurrency, availability
      },
    });
    const offerIssues = issues.filter((i) => i.type === 'Offer');
    const fields = offerIssues.map((i) => i.path.split('.').pop());
    expect(fields).toEqual(expect.arrayContaining(['price', 'priceCurrency', 'availability']));
  });

  it('ProductGroup needs hasVariant (not offers)', () => {
    const issues = validateRichResults({
      '@type': 'ProductGroup',
      name: 'Rug',
      image: 'https://example.com/x.jpg',
    });
    expect(byPath(issues, '.hasVariant')?.severity).toBe('required');
    expect(byPath(issues, '.offers')).toBeUndefined();
  });

  it('recommends gtin/sku/mpn when absent', () => {
    const issues = validateRichResults({
      '@type': 'Product',
      name: 'Rug',
      image: 'https://example.com/x.jpg',
      offers: { '@type': 'Offer', price: 1, priceCurrency: 'USD', availability: 'x' },
    });
    expect(byPath(issues, 'gtin|sku|mpn')?.severity).toBe('recommended');
  });
});

describe('v1.1: validateRichResults: Article', () => {
  it('flags Article with Person as publisher and missing logo', () => {
    const issues = validateRichResults({
      '@type': 'Article',
      headline: 'Hi',
      datePublished: '2026-01-01',
      author: { '@type': 'Person', name: 'Me' },
      publisher: { '@type': 'Person', name: 'Me' },
    });
    expect(issues.some((i) => i.code === 'invalid_value')).toBe(true);
    expect(byPath(issues, '.publisher.logo')?.severity).toBe('required');
  });

  it('flags Article missing datePublished', () => {
    const issues = validateRichResults({ '@type': 'Article', headline: 'Hi' });
    expect(byPath(issues, '.datePublished')?.severity).toBe('required');
  });

  it('flags Article with object author lacking name', () => {
    const issues = validateRichResults({
      '@type': 'Article',
      headline: 'Hi',
      datePublished: '2026-01-01',
      author: { '@type': 'Person' },
    });
    expect(byPath(issues, '.author.name')?.severity).toBe('required');
  });

  it('valid Article with Organization publisher + logo has no required issues', () => {
    const article = mapArticle({
      headline: 'Hello',
      description: 'A post',
      url: 'https://example.com/blog/hello',
      datePublished: '2026-01-01',
      dateModified: '2026-01-01',
      author: { type: 'Person', id: 'https://example.com/#author', name: 'Author' },
      publisher: {
        type: 'Organization',
        id: 'https://example.com/#org',
        name: 'Shop',
        url: 'https://example.com',
        image: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
      },
      image: { url: 'https://example.com/hero.jpg', altText: 'Hero' },
    });
    const required = validateRichResults(article).filter((i) => i.severity === 'required');
    expect(required).toEqual([]);
  });
});

describe('v1.1: validateRichResults: Organization / WebSite', () => {
  it('flags Organization missing logo', () => {
    const issues = validateRichResults({
      '@type': 'Organization',
      name: 'Shop',
      url: 'https://example.com',
    });
    expect(byPath(issues, '.logo')?.severity).toBe('required');
  });

  it('recommends sameAs on Organization', () => {
    const issues = validateRichResults({
      '@type': 'Organization',
      name: 'Shop',
      url: 'https://example.com',
      logo: 'https://example.com/logo.png',
    });
    expect(byPath(issues, '.sameAs')?.severity).toBe('recommended');
  });

  it('LocalBusiness inherits Organization rules', () => {
    const issues = validateRichResults({ '@type': 'LocalBusiness' });
    expect(byPath(issues, '.name')?.severity).toBe('required');
    expect(byPath(issues, '.logo')?.severity).toBe('required');
  });

  it('flags SearchAction without placeholder token', () => {
    const issues = validateRichResults(
      mapWebSite({
        name: 'Shop',
        url: 'https://example.com',
        search: { target: 'https://example.com/search', queryInput: 'required name=q' },
      }),
    );
    expect(issues.some((i) => i.code === 'invalid_value' && i.type === 'SearchAction')).toBe(true);
  });

  it('SearchAction with valid {placeholder} passes', () => {
    const issues = validateRichResults(
      mapWebSite({
        name: 'Shop',
        url: 'https://example.com',
        search: {
          target: 'https://example.com/search?q={search_term_string}',
          queryInput: 'required name=search_term_string',
        },
      }),
    );
    expect(issues.filter((i) => i.type === 'SearchAction')).toEqual([]);
  });
});

describe('v1.1: validateRichResults: AggregateRating', () => {
  it('requires ratingValue', () => {
    const issues = validateRichResults({ '@type': 'AggregateRating', reviewCount: 10 });
    expect(byPath(issues, '.ratingValue')?.severity).toBe('required');
  });

  it('requires at least one of reviewCount or ratingCount', () => {
    const issues = validateRichResults({ '@type': 'AggregateRating', ratingValue: 4.5 });
    expect(issues.some((i) => i.path.includes('reviewCount|ratingCount'))).toBe(true);
  });

  it('passes with ratingValue + ratingCount', () => {
    const ar = mapAggregateRating({ ratingValue: 4.5, ratingCount: 42 } as any);
    expect(validateRichResults(ar).filter((i) => i.severity === 'required')).toEqual([]);
  });

  it('recurses into Product.aggregateRating', () => {
    const issues = validateRichResults({
      '@type': 'Product',
      name: 'Rug',
      image: 'https://example.com/x.jpg',
      offers: { '@type': 'Offer', price: 1, priceCurrency: 'USD', availability: 'x' },
      aggregateRating: { '@type': 'AggregateRating' },
    });
    expect(issues.some((i) => i.type === 'AggregateRating')).toBe(true);
  });
});

describe('v1.1: validateRichResults: BreadcrumbList', () => {
  it('flags empty itemListElement', () => {
    const issues = validateRichResults({ '@type': 'BreadcrumbList', itemListElement: [] });
    expect(byPath(issues, '.itemListElement')?.severity).toBe('required');
  });

  it('flags each ListItem missing position / name / item', () => {
    const issues = validateRichResults({
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem' }],
    });
    expect(issues.some((i) => i.path.endsWith('.position'))).toBe(true);
    expect(issues.some((i) => i.path.endsWith('.name'))).toBe(true);
    expect(issues.some((i) => i.path.endsWith('.item'))).toBe(true);
  });

  it('passes a well-formed mapBreadcrumbList output', () => {
    const bc = mapBreadcrumbList({
      url: 'https://example.com/a/b',
      items: [
        { name: 'Home', item: 'https://example.com/' },
        { name: 'Shop', item: 'https://example.com/a' },
        { name: 'Thing', item: 'https://example.com/a/b' },
      ],
    });
    expect(validateRichResults(bc).filter((i) => i.severity === 'required')).toEqual([]);
  });
});

describe('v1.1: validateRichResults: FAQPage', () => {
  it('flags empty mainEntity', () => {
    const issues = validateRichResults({ '@type': 'FAQPage' });
    expect(byPath(issues, '.mainEntity')?.severity).toBe('required');
  });

  it('flags Question missing name or answer text', () => {
    const issues = validateRichResults({
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question' }],
    });
    expect(issues.some((i) => i.path.endsWith('.name'))).toBe(true);
    expect(issues.some((i) => i.path.endsWith('.acceptedAnswer.text'))).toBe(true);
  });

  it('passes a well-formed FAQPage', () => {
    const faq = mapFAQPage({
      title: 'FAQ',
      url: 'https://example.com/faq',
      questions: [
        { question: 'What?', answer: 'Something.' },
        { question: 'Why?', answer: 'Because.' },
      ],
    });
    expect(validateRichResults(faq).filter((i) => i.severity === 'required')).toEqual([]);
  });
});

describe('v1.1: validateRichResults: Review / WebPage / CollectionPage / ItemList', () => {
  it('flags Review missing author and reviewRating', () => {
    const issues = validateRichResults({ '@type': 'Review', url: 'https://example.com/r/1' });
    expect(byPath(issues, '.author')?.severity).toBe('required');
    expect(byPath(issues, '.reviewRating')?.severity).toBe('required');
  });

  it('flags WebPage missing name / url', () => {
    const issues = validateRichResults({ '@type': 'WebPage' });
    expect(byPath(issues, '.name')?.severity).toBe('required');
    expect(byPath(issues, '.url')?.severity).toBe('required');
  });

  it('CollectionPage uses WebPage rules (name, url required)', () => {
    const issues = validateRichResults({ '@type': 'CollectionPage' });
    expect(byPath(issues, '.name')?.severity).toBe('required');
    expect(byPath(issues, '.url')?.severity).toBe('required');
  });

  it('CollectionPage with mainEntity: ItemList walks into Products', () => {
    const collection = mapCollectionPage({
      title: 'Rugs',
      description: 'All rugs',
      url: 'https://example.com/collections/rugs',
      products: [baseProductInput()],
    });
    const issues = validateRichResults(collection);
    const byType = new Set(issues.map((i) => i.type));
    // Walks into Product; fully-formed baseProductInput produces no required issues
    expect(issues.filter((i) => i.severity === 'required')).toEqual([]);
    // recommended 'gtin|sku|mpn' will appear on the walked Product
    expect(byType.has('Product')).toBe(true);
  });

  it('ItemList flags empty itemListElement', () => {
    const issues = validateRichResults({ '@type': 'ItemList', itemListElement: [] });
    expect(byPath(issues, '.itemListElement')?.severity).toBe('required');
  });

  it('mapReview output passes required checks', () => {
    const r = mapReview({
      url: 'https://example.com/r/1',
      author: 'Alice',
      rating: 5,
      datePublished: '2026-01-01',
      reviewBody: 'Great rug.',
    } as any);
    const required = validateRichResults(r).filter((i) => i.severity === 'required');
    expect(required).toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Graph-level walking
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: validateRichResults: @graph walking', () => {
  it('walks every node in a @graph', () => {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Product', image: 'https://example.com/x.jpg' /* missing name, offers */ },
        { '@type': 'Organization' /* missing name, url, logo */ },
      ],
    };
    const issues = validateRichResults(graph);
    const types = new Set(issues.map((i) => i.type));
    expect(types.has('Product')).toBe(true);
    expect(types.has('Organization')).toBe(true);
  });

  it('handles arrays at the root', () => {
    const issues = validateRichResults([
      { '@type': 'WebPage', name: 'Home', url: 'https://example.com' },
      { '@type': 'WebPage' /* missing name and url */ },
    ]);
    const webpageIssues = issues.filter((i) => i.type === 'WebPage');
    expect(webpageIssues.length).toBeGreaterThanOrEqual(2);
  });

  it('returns [] for null / undefined / primitives', () => {
    expect(validateRichResults(null)).toEqual([]);
    expect(validateRichResults(undefined)).toEqual([]);
    expect(validateRichResults(42)).toEqual([]);
    expect(validateRichResults('foo')).toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Formatting
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: formatRichResultIssues', () => {
  it('formats issues with severity and path', () => {
    const issues = validateRichResults({ '@type': 'Product' });
    const out = formatRichResultIssues(issues);
    expect(out).toContain('REQUIRED');
    expect(out).toContain('.name');
  });

  it('empty -> friendly message', () => {
    expect(formatRichResultIssues([])).toBe('No rich-result issues.');
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Integration: a realistic Revival-like PDP graph validates clean
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: integration: realistic PDP graph', () => {
  it('Organization + WebPage + Breadcrumb + Product passes all required checks', () => {
    const pageUrl = 'https://www.example.com/products/austin';
    const graph = createGraph(
      mapOrganization({
        name: 'Shop',
        url: 'https://www.example.com',
        logo: { url: 'https://www.example.com/logo.png', altText: 'Shop logo' },
        sameAs: ['https://www.wikidata.org/wiki/Q1'],
      }),
      mapWebPage({
        title: 'Austin Rug',
        description: 'Hand-knotted wool',
        url: pageUrl,
        language: 'en-US',
        publisher: {
          type: 'Organization',
          id: canonicalId.organization('https://www.example.com'),
          name: 'Shop',
          url: 'https://www.example.com',
        },
      }),
      mapBreadcrumbList({
        url: pageUrl,
        items: [
          { name: 'Home', item: 'https://www.example.com/' },
          { name: 'Rugs', item: 'https://www.example.com/collections/rugs' },
          { name: 'Austin', item: pageUrl },
        ],
      }),
      mapProduct(
        baseProductInput({
          id: 'austin',
          title: 'Austin Rug',
          description: 'Hand-knotted wool, vegetable-dyed, made in Turkey',
          handle: 'austin',
          url: pageUrl,
          brand: 'Shop',
          gtin13: '1234567890123',
          countryOfOrigin: 'TR',
          offers: {
            price: 2499,
            currency: 'USD',
            availability: 'PreOrder',
            availabilityStarts: '2026-05-01T00:00:00Z',
            url: pageUrl,
          },
        }),
      ),
    );
    const required = validateRichResults(graph).filter((i) => i.severity === 'required');
    expect(required).toEqual([]);
  });
});
