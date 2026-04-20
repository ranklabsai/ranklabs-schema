/**
 * Tests for the second batch of v1.1.0 additions:
 *  - Article: keywords, speakable, citations
 *  - Product: audience, mentions, isRelatedTo, isSimilarTo, award
 *  - Organization: publishingPrinciples, award
 *  - WebPage: lastReviewed, speakable
 *  - ImageObject: creditText
 *  - HowTo mapper + rich-result rule
 *  - Utilities: stripHtmlForSchema, stripLocalePrefix, detectLocale
 */

import { describe, expect, it, vi } from 'vitest';

import {
  canonicalId,
  createGraph,
  detectLocale,
  mapArticle,
  mapHowTo,
  mapImage,
  mapOffer,
  mapOrganization,
  mapProduct,
  mapWebPage,
  stripHtmlForSchema,
  stripLocalePrefix,
  validateRichResults,
  type ArticleInput,
  type HowToInput,
} from '@ranklabs/schema';

/* ─────────────────────────────────────────────────────────────────────────
 * Article LLM fields
 * ──────────────────────────────────────────────────────────────────────── */

function baseArticleInput(overrides: Partial<ArticleInput> = {}): ArticleInput {
  return {
    headline: 'How to clean a wool rug',
    description: 'Step-by-step care guide',
    url: 'https://example.com/blog/wool-rug-care',
    datePublished: '2026-01-01',
    dateModified: '2026-01-01',
    author: { type: 'Person', id: 'https://example.com/#author', name: 'Author' },
    ...overrides,
  };
}

describe('v1.1: Article.keywords', () => {
  it('emits keywords as a comma-joined string', () => {
    const a: any = mapArticle(
      baseArticleInput({ keywords: ['wool', 'rug care', 'cleaning'] }),
    );
    expect(a.keywords).toBe('wool,rug care,cleaning');
  });

  it('omits keywords when empty or missing', () => {
    expect((mapArticle(baseArticleInput()) as any).keywords).toBeUndefined();
    expect((mapArticle(baseArticleInput({ keywords: [] })) as any).keywords).toBeUndefined();
  });
});

describe('v1.1: Article.speakable', () => {
  it('emits a SpeakableSpecification node with cssSelector', () => {
    const a: any = mapArticle(
      baseArticleInput({ speakable: { cssSelector: ['h1', '.tldr'] } }),
    );
    expect(a.speakable).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.tldr'],
      xpath: undefined,
    });
  });

  it('supports xpath-only', () => {
    const a: any = mapArticle(
      baseArticleInput({ speakable: { xpath: ['//h1'] } }),
    );
    expect(a.speakable.xpath).toEqual(['//h1']);
    expect(a.speakable.cssSelector).toBeUndefined();
  });

  it('omits speakable when both arrays are empty', () => {
    expect(
      (mapArticle(baseArticleInput({ speakable: { cssSelector: [], xpath: [] } })) as any)
        .speakable,
    ).toBeUndefined();
    expect((mapArticle(baseArticleInput({ speakable: undefined })) as any).speakable).toBeUndefined();
  });
});

describe('v1.1: Article.citations', () => {
  it('emits citation as an array of Thing references', () => {
    const a: any = mapArticle(
      baseArticleInput({
        citations: [
          { type: 'Thing', id: 'https://w.wiki/abc', name: 'Wool fiber', url: 'https://w.wiki/abc' },
        ],
      }),
    );
    expect(a.citation).toEqual([
      { '@type': 'Thing', '@id': 'https://w.wiki/abc', name: 'Wool fiber', url: 'https://w.wiki/abc' },
    ]);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Product AEO fields
 * ──────────────────────────────────────────────────────────────────────── */

function baseProductInput(overrides: any = {}) {
  return {
    id: 'p1',
    title: 'Rug',
    description: 'Nice rug',
    handle: 'rug',
    url: 'https://example.com/products/rug',
    images: [{ url: 'https://example.com/img.jpg', altText: 'Rug' }],
    brand: 'Acme',
    offers: { price: 100, currency: 'USD', availability: 'InStock' as const },
    ...overrides,
  };
}

describe('v1.1: Product audience / award / mentions / isRelatedTo / isSimilarTo', () => {
  it('emits audience as an Audience node', () => {
    const p: any = mapProduct(baseProductInput({ audience: 'Interior designers' }));
    expect(p.audience).toEqual({ '@type': 'Audience', audienceType: 'Interior designers' });
  });

  it('emits award as-is (string or array)', () => {
    expect((mapProduct(baseProductInput({ award: 'Red Dot 2024' })) as any).award).toBe('Red Dot 2024');
    expect((mapProduct(baseProductInput({ award: ['A', 'B'] })) as any).award).toEqual(['A', 'B']);
  });

  it('emits mentions / isRelatedTo / isSimilarTo as Thing arrays', () => {
    const p: any = mapProduct(
      baseProductInput({
        mentions: [{ type: 'Thing', id: 'https://example.com/blog/post-1', name: 'Care guide', url: 'https://example.com/blog/post-1' }],
        isRelatedTo: [{ type: 'Thing', id: 'https://example.com/products/rug-pad', name: 'Rug Pad', url: 'https://example.com/products/rug-pad' }],
        isSimilarTo: [{ type: 'Thing', id: 'https://example.com/products/similar-rug', name: 'Similar Rug', url: 'https://example.com/products/similar-rug' }],
      }),
    );
    expect(p.mentions[0]).toMatchObject({ '@type': 'Thing', name: 'Care guide' });
    expect(p.isRelatedTo[0]).toMatchObject({ '@type': 'Thing', name: 'Rug Pad' });
    expect(p.isSimilarTo[0]).toMatchObject({ '@type': 'Thing', name: 'Similar Rug' });
  });

  it('omits all AEO fields when undefined', () => {
    const p: any = mapProduct(baseProductInput());
    expect(p.audience).toBeUndefined();
    expect(p.award).toBeUndefined();
    expect(p.mentions).toBeUndefined();
    expect(p.isRelatedTo).toBeUndefined();
    expect(p.isSimilarTo).toBeUndefined();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Organization E-E-A-T fields
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: Organization publishingPrinciples / award', () => {
  it('emits publishingPrinciples URL as-is', () => {
    const o: any = mapOrganization({
      name: 'Shop',
      url: 'https://example.com',
      logo: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
      publishingPrinciples: 'https://example.com/editorial-standards',
    });
    expect(o.publishingPrinciples).toBe('https://example.com/editorial-standards');
  });

  it('emits award string or array', () => {
    const o: any = mapOrganization({
      name: 'Shop',
      url: 'https://example.com',
      logo: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
      award: ['B Corp certified', 'Red Dot 2024'],
    });
    expect(o.award).toEqual(['B Corp certified', 'Red Dot 2024']);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * WebPage + ImageObject enrichments
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: WebPage.lastReviewed + speakable', () => {
  it('emits lastReviewed when provided', () => {
    const p: any = mapWebPage({
      title: 'Home',
      description: '...',
      url: 'https://example.com/',
      lastReviewed: '2026-03-15',
    });
    expect(p.lastReviewed).toBe('2026-03-15');
  });

  it('emits speakable on WebPage', () => {
    const p: any = mapWebPage({
      title: 'Home',
      description: '...',
      url: 'https://example.com/',
      speakable: { cssSelector: ['.hero h1'] },
    });
    expect(p.speakable).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['.hero h1'],
      xpath: undefined,
    });
  });

  it('omits speakable when both arrays are empty', () => {
    const p: any = mapWebPage({
      title: 'Home',
      description: '...',
      url: 'https://example.com/',
      speakable: { cssSelector: [], xpath: [] },
    });
    expect(p.speakable).toBeUndefined();
  });
});

describe('v1.1: ImageObject.creditText', () => {
  it('emits creditText when provided', () => {
    const img: any = mapImage({
      url: 'https://example.com/x.jpg',
      altText: 'Rug',
      creditText: 'Photo: Jane Doe',
    });
    expect(img.creditText).toBe('Photo: Jane Doe');
  });

  it('omits creditText when absent', () => {
    const img: any = mapImage({ url: 'https://example.com/x.jpg', altText: 'Rug' });
    expect(img.creditText).toBeUndefined();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * HowTo mapper + rich-result rule
 * ──────────────────────────────────────────────────────────────────────── */

function baseHowToInput(overrides: Partial<HowToInput> = {}): HowToInput {
  return {
    name: 'How to clean a wool rug',
    description: 'Gentle cleaning for handwoven wool.',
    url: 'https://example.com/guides/clean-wool-rug',
    steps: [
      { name: 'Vacuum', text: 'Vacuum both sides weekly.' },
      { name: 'Spot clean', text: 'Blot spills with a clean cloth.' },
    ],
    ...overrides,
  };
}

describe('v1.1: mapHowTo', () => {
  it('produces a HowTo with @id, name, and step list', () => {
    const h: any = mapHowTo(baseHowToInput());
    expect(h['@type']).toBe('HowTo');
    expect(h['@id']).toBe(canonicalId.howTo(baseHowToInput().url));
    expect(h.name).toBe('How to clean a wool rug');
    expect(h.step).toHaveLength(2);
    expect(h.step[0]).toMatchObject({ '@type': 'HowToStep', name: 'Vacuum' });
  });

  it('maps supplies and tools from strings and objects', () => {
    const h: any = mapHowTo(
      baseHowToInput({
        supplies: ['Mild detergent', { name: 'Soft cloth' }],
        tools: ['Vacuum cleaner'],
      }),
    );
    expect(h.supply).toHaveLength(2);
    expect(h.supply[0]).toEqual({ '@type': 'HowToSupply', name: 'Mild detergent' });
    expect(h.tool[0]).toEqual({ '@type': 'HowToTool', name: 'Vacuum cleaner' });
  });

  it('emits estimatedCost as MonetaryAmount', () => {
    const h: any = mapHowTo(
      baseHowToInput({ estimatedCost: { amount: 25, currency: 'USD' } }),
    );
    expect(h.estimatedCost).toEqual({ '@type': 'MonetaryAmount', value: 25, currency: 'USD' });
  });

  it('passes totalTime through', () => {
    const h: any = mapHowTo(baseHowToInput({ totalTime: 'PT30M' }));
    expect(h.totalTime).toBe('PT30M');
  });
});

describe('v1.1: validateRichResults: HowTo rule', () => {
  it('flags HowTo missing name + step', () => {
    const issues = validateRichResults({ '@type': 'HowTo' });
    expect(issues.some((i) => i.path.endsWith('.name') && i.severity === 'required')).toBe(true);
    expect(issues.some((i) => i.path.endsWith('.step') && i.severity === 'required')).toBe(true);
  });

  it('flags HowToStep missing both name and text', () => {
    const issues = validateRichResults({
      '@type': 'HowTo',
      name: 'Do the thing',
      step: [{ '@type': 'HowToStep' }],
    });
    expect(issues.some((i) => i.path.includes('step[0]') && i.severity === 'required')).toBe(true);
  });

  it('recommends image and totalTime', () => {
    const issues = validateRichResults({
      '@type': 'HowTo',
      name: 'Do the thing',
      step: [{ '@type': 'HowToStep', name: 'Step', text: 'Do it' }],
    });
    const recs = issues.filter((i) => i.severity === 'recommended').map((i) => i.path);
    expect(recs.some((p) => p.endsWith('.image'))).toBe(true);
    expect(recs.some((p) => p.endsWith('.totalTime'))).toBe(true);
  });

  it('well-formed HowTo has no required issues', () => {
    const h = mapHowTo(
      baseHowToInput({
        image: { url: 'https://example.com/guide.jpg', altText: 'Clean rug' },
        totalTime: 'PT30M',
      }),
    );
    const required = validateRichResults(h).filter((i) => i.severity === 'required');
    expect(required).toEqual([]);
  });
});

describe('v1.1: validateRichResults: Article.keywords recommended', () => {
  it('flags Article missing keywords as recommended', () => {
    const article = mapArticle(baseArticleInput());
    const issues = validateRichResults(article);
    const kwIssue = issues.find((i) => i.path.endsWith('.keywords'));
    expect(kwIssue?.severity).toBe('recommended');
  });

  it('Article with keywords has no keywords issue', () => {
    const article = mapArticle(baseArticleInput({ keywords: ['rug', 'care'] }));
    const issues = validateRichResults(article);
    expect(issues.some((i) => i.path.endsWith('.keywords'))).toBe(false);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Utilities
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: stripHtmlForSchema', () => {
  it('strips all tags by default', () => {
    expect(stripHtmlForSchema('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('removes script and style elements including contents', () => {
    expect(
      stripHtmlForSchema('<p>ok</p><script>alert(1)</script><style>body{}</style>more'),
    ).toBe('ok more');
  });

  it('keeps Google-FAQ allowlist tags in google-faq mode', () => {
    const input = '<p>Hi</p><iframe src="x"></iframe><strong>bold</strong>';
    const out = stripHtmlForSchema(input, { mode: 'google-faq' });
    expect(out).toContain('<p>');
    expect(out).toContain('<strong>');
    expect(out).not.toContain('<iframe');
  });

  it('decodes basic HTML entities', () => {
    expect(stripHtmlForSchema('&amp; &lt; &gt; &quot; &#39;')).toBe(`& < > " '`);
  });

  it('collapses whitespace and trims', () => {
    expect(stripHtmlForSchema('  <p>a</p>\n\n<p>b</p>  ')).toBe('a b');
  });

  it('handles empty / falsy input', () => {
    expect(stripHtmlForSchema('')).toBe('');
  });

  it('warns in dev when input contains injection patterns', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stripHtmlForSchema('<img onerror="alert(1)">safe text');
    expect(
      spy.mock.calls.some((c) => String(c[0]).includes('stripHtmlForSchema')),
    ).toBe(true);
    spy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('does not warn on clean input', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stripHtmlForSchema('<p>clean text</p>');
    expect(
      spy.mock.calls.some((c) => String(c[0]).includes('stripHtmlForSchema')),
    ).toBe(false);
    spy.mockRestore();
    vi.unstubAllEnvs();
  });
});

describe('v1.1: stripLocalePrefix / detectLocale', () => {
  it('strips /locale from pathname', () => {
    expect(stripLocalePrefix('/us/products/austin', 'us')).toBe('/products/austin');
    expect(stripLocalePrefix('/au/collections/x', '/au')).toBe('/collections/x');
  });

  it('strips /locale from fully-qualified URL', () => {
    expect(stripLocalePrefix('https://example.com/au/products/x', 'au')).toBe(
      'https://example.com/products/x',
    );
  });

  it('collapses bare /locale to /', () => {
    expect(stripLocalePrefix('/us', 'us')).toBe('/');
  });

  it('leaves pathname alone when locale not present', () => {
    expect(stripLocalePrefix('/products/x', 'us')).toBe('/products/x');
  });

  it('is case-insensitive on the locale', () => {
    expect(stripLocalePrefix('/US/x', 'us')).toBe('/x');
  });

  it('detectLocale finds matching locale', () => {
    expect(detectLocale('/au/products/x', ['us', 'au'])).toBe('au');
    expect(detectLocale('https://example.com/ca/x', ['us', 'ca'])).toBe('ca');
    expect(detectLocale('/products/x', ['us', 'au'])).toBeNull();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * New multi-locale + commerce-richness fields
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: Organization knowsLanguage + areaServed', () => {
  it('passes through both fields when provided', () => {
    const o: any = mapOrganization({
      name: 'Shop',
      url: 'https://example.com',
      logo: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
      knowsLanguage: ['en-US', 'en-CA', 'fr-CA'],
      areaServed: ['US', 'CA', 'AU'],
    });
    expect(o.knowsLanguage).toEqual(['en-US', 'en-CA', 'fr-CA']);
    expect(o.areaServed).toEqual(['US', 'CA', 'AU']);
  });

  it('accepts areaServed as a single string', () => {
    const o: any = mapOrganization({
      name: 'Shop',
      url: 'https://example.com',
      logo: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
      areaServed: 'Worldwide',
    });
    expect(o.areaServed).toBe('Worldwide');
  });
});

describe('v1.1: Offer.eligibleRegion', () => {
  it('passes through as a string', () => {
    const o: any = mapOffer({
      price: 10,
      currency: 'USD',
      availability: 'InStock',
      eligibleRegion: 'US',
    });
    expect(o.eligibleRegion).toBe('US');
  });

  it('passes through as an array of region codes', () => {
    const o: any = mapOffer({
      price: 10,
      currency: 'USD',
      availability: 'InStock',
      eligibleRegion: ['US', 'CA'],
    });
    expect(o.eligibleRegion).toEqual(['US', 'CA']);
  });
});

describe('v1.1: Product.measurements (hasMeasurement)', () => {
  it('emits QuantitativeValue array under hasMeasurement', () => {
    const p: any = mapProduct(
      baseProductInput({
        measurements: [
          { name: 'Width', value: 8, unitCode: 'FTI' },
          { name: 'Length', value: 10, unitCode: 'FTI' },
        ],
      }),
    );
    expect(p.hasMeasurement).toEqual([
      { '@type': 'QuantitativeValue', name: 'Width', value: 8, unitCode: 'FTI', unitText: undefined },
      { '@type': 'QuantitativeValue', name: 'Length', value: 10, unitCode: 'FTI', unitText: undefined },
    ]);
  });

  it('omits hasMeasurement when not provided', () => {
    const p: any = mapProduct(baseProductInput());
    expect(p.hasMeasurement).toBeUndefined();
  });
});

describe('v1.1: Product.certifications (hasCertification)', () => {
  it('emits Certification nodes with issuedBy Organization', () => {
    const p: any = mapProduct(
      baseProductInput({
        certifications: [
          {
            name: 'Fair Trade Certified',
            url: 'https://www.fairtradecertified.org/',
            validFrom: '2024-01-01',
            issuedBy: { name: 'Fair Trade USA', url: 'https://www.fairtradecertified.org/' },
          },
          { name: 'B Corp' },
        ],
      }),
    );
    expect(p.hasCertification).toHaveLength(2);
    expect(p.hasCertification[0]).toMatchObject({
      '@type': 'Certification',
      name: 'Fair Trade Certified',
      validFrom: '2024-01-01',
      issuedBy: { '@type': 'Organization', name: 'Fair Trade USA' },
    });
    expect(p.hasCertification[1]).toEqual({
      '@type': 'Certification',
      name: 'B Corp',
      url: undefined,
      validFrom: undefined,
      issuedBy: undefined,
    });
  });
});

describe('v1.1: Article.isPartOf', () => {
  it('emits an isPartOf node with type Blog by default', () => {
    const a: any = mapArticle(
      baseArticleInput({
        isPartOf: {
          id: 'https://example.com/blog#blog',
          name: 'The Blog',
          url: 'https://example.com/blog',
        },
      }),
    );
    expect(a.isPartOf).toEqual({
      '@type': 'Blog',
      '@id': 'https://example.com/blog#blog',
      name: 'The Blog',
      url: 'https://example.com/blog',
    });
  });

  it('accepts a custom type', () => {
    const a: any = mapArticle(
      baseArticleInput({
        isPartOf: { type: 'CreativeWorkSeries', name: 'Care Series', url: 'https://example.com/series' },
      }),
    );
    expect(a.isPartOf['@type']).toBe('CreativeWorkSeries');
  });

  it('omits isPartOf when absent', () => {
    const a: any = mapArticle(baseArticleInput());
    expect(a.isPartOf).toBeUndefined();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Locale utility edge cases
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: stripLocalePrefix edge cases', () => {
  it('returns input unchanged on empty locale', () => {
    expect(stripLocalePrefix('/us/x', '')).toBe('/us/x');
  });

  it('preserves query and fragment on URLs', () => {
    expect(stripLocalePrefix('https://example.com/us/x?a=1#f', 'us')).toBe(
      'https://example.com/x?a=1#f',
    );
  });

  it('leaves unrelated path segments alone', () => {
    expect(stripLocalePrefix('/blog/us-market', 'us')).toBe('/blog/us-market');
  });
});

describe('v1.1: detectLocale edge cases', () => {
  it('matches the first supported locale by prefix', () => {
    expect(detectLocale('/en/products/x', ['en', 'en-us'])).toBe('en');
  });

  it('ignores trailing-slash bare locale as a match', () => {
    expect(detectLocale('/au', ['us', 'au'])).toBe('au');
  });

  it('returns null on unknown input', () => {
    expect(detectLocale('', ['us'])).toBeNull();
    expect(detectLocale('https://not a url/x' as any, ['us'])).toBeNull();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
 * Integration: realistic PDP graph with all v1.1 fields
 * ──────────────────────────────────────────────────────────────────────── */

describe('v1.1: integration: fully-loaded realistic PDP', () => {
  it('graph with countryOfOrigin, audience, mentions, publishingPrinciples validates clean', () => {
    const pageUrl = 'https://www.example.com/products/austin';
    const graph = createGraph(
      mapOrganization({
        name: 'Shop',
        url: 'https://www.example.com',
        logo: { url: 'https://www.example.com/logo.png', altText: 'Shop logo' },
        sameAs: ['https://www.wikidata.org/wiki/Q1'],
        publishingPrinciples: 'https://www.example.com/about/editorial-standards',
        award: ['B Corp certified'],
      }),
      mapWebPage({
        title: 'Austin Rug',
        description: 'Hand-knotted wool',
        url: pageUrl,
        language: 'en-US',
        lastReviewed: '2026-03-01',
        speakable: { cssSelector: ['h1', '.summary'] },
      }),
      mapProduct({
        id: 'austin',
        title: 'Austin Rug',
        description: 'Hand-knotted wool rug, vegetable-dyed',
        handle: 'austin',
        url: pageUrl,
        images: [{ url: 'https://www.example.com/austin.jpg', altText: 'Austin rug', creditText: 'Photo: J. Smith' }],
        brand: 'Shop',
        gtin13: '1234567890123',
        countryOfOrigin: 'TR',
        audience: 'Interior designers',
        award: 'Best Rug 2025',
        mentions: [
          { type: 'Thing', id: 'https://www.example.com/blog/wool-care', name: 'Wool Care Guide', url: 'https://www.example.com/blog/wool-care' },
        ],
        offers: { price: 2499, currency: 'USD', availability: 'InStock', url: pageUrl },
      }),
    );
    const required = validateRichResults(graph).filter((i) => i.severity === 'required');
    expect(required).toEqual([]);
  });
});
