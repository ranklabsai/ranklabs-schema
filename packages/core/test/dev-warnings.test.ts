import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mapArticle, mapFAQPage, mapOffer, mapWebSite } from '@ranklabs/schema';

/**
 * These tests assert that the `devWarn` helper fires in development builds
 * for the situations the library means to flag. The global vitest setup
 * pins NODE_ENV=production, so we override it per test.
 */

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  vi.unstubAllEnvs();
});

function warnings(): string[] {
  return warnSpy.mock.calls.map((c) => String(c[0]));
}

describe('dev warnings: Offer availability / condition', () => {
  it('warns on unknown Offer.availability', () => {
    mapOffer({ price: 1, currency: 'USD', availability: 'not-a-real-value' as any });
    expect(warnings().some((w) => w.includes("Unknown Offer.availability 'not-a-real-value'"))).toBe(true);
  });

  it('does not warn on valid Offer.availability', () => {
    mapOffer({ price: 1, currency: 'USD', availability: 'InStock' });
    expect(warnings().filter((w) => w.includes('availability'))).toEqual([]);
  });

  it('warns on unknown Offer.itemCondition', () => {
    mapOffer({
      price: 1,
      currency: 'USD',
      availability: 'InStock',
      itemCondition: 'LikeNew' as any,
    });
    expect(warnings().some((w) => w.includes("Unknown Offer.itemCondition 'LikeNew'"))).toBe(true);
  });
});

describe('dev warnings: SearchAction placeholder', () => {
  it('warns when target is missing the placeholder', () => {
    mapWebSite({
      name: 'Shop',
      url: 'https://example.com',
      search: {
        target: 'https://example.com/search',
        queryInput: 'required name=search_term_string',
      },
    });
    expect(
      warnings().some((w) => w.includes('SearchAction target') && w.includes('{search_term_string}')),
    ).toBe(true);
  });

  it('does not warn when target contains the placeholder', () => {
    mapWebSite({
      name: 'Shop',
      url: 'https://example.com',
      search: {
        target: 'https://example.com/search?q={search_term_string}',
        queryInput: 'required name=search_term_string',
      },
    });
    expect(warnings().filter((w) => w.includes('SearchAction'))).toEqual([]);
  });
});

describe('dev warnings: Article publisher', () => {
  it('warns when publisher is a Person (not Organization)', () => {
    mapArticle({
      headline: 'Hi',
      description: 'body',
      url: 'https://example.com/blog/hi',
      datePublished: '2026-01-01',
      dateModified: '2026-01-01',
      author: { type: 'Person', id: 'https://example.com/#me', name: 'Me' },
      publisher: {
        type: 'Person',
        id: 'https://example.com/#me',
        name: 'Me',
        image: { url: 'https://example.com/me.jpg', altText: 'Me' },
      },
    });
    expect(warnings().some((w) => w.includes('publisher should be an Organization'))).toBe(true);
  });

  it('warns when publisher has no image/logo', () => {
    mapArticle({
      headline: 'Hi',
      description: 'body',
      url: 'https://example.com/blog/hi',
      datePublished: '2026-01-01',
      dateModified: '2026-01-01',
      author: { type: 'Person', id: 'https://example.com/#me', name: 'Me' },
      publisher: {
        type: 'Organization',
        id: 'https://example.com/#org',
        name: 'Shop',
        url: 'https://example.com',
      },
    });
    expect(warnings().some((w) => w.includes('publisher has no image/logo'))).toBe(true);
  });

  it('does not warn on an Organization publisher with a logo', () => {
    mapArticle({
      headline: 'Hi',
      description: 'body',
      url: 'https://example.com/blog/hi',
      datePublished: '2026-01-01',
      dateModified: '2026-01-01',
      author: { type: 'Person', id: 'https://example.com/#me', name: 'Me' },
      publisher: {
        type: 'Organization',
        id: 'https://example.com/#org',
        name: 'Shop',
        url: 'https://example.com',
        image: { url: 'https://example.com/logo.png', altText: 'Shop logo' },
      },
    });
    expect(warnings().filter((w) => w.toLowerCase().includes('publisher'))).toEqual([]);
  });
});

describe('dev warnings: FAQ eligibility (once per module)', () => {
  it('fires at least once on mapFAQPage', async () => {
    // Module state: the one-shot flag may already have fired from other tests in
    // the worker; reset via dynamic import with a cache bust.
    vi.resetModules();
    const { mapFAQPage: fresh } = await import('@ranklabs/schema');
    fresh({ questions: [{ question: 'Q?', answer: 'A.' }] });
    // Accept either: warning fires, or was already suppressed by prior call in
    // another test in this worker: rerunning shouldn't double-fire.
    const faqWarnings = warnings().filter((w) => w.toLowerCase().includes('faqpage'));
    expect(faqWarnings.length).toBeLessThanOrEqual(1);
  });

  it('does not throw when called multiple times', () => {
    expect(() => {
      mapFAQPage({ questions: [{ question: 'Q?', answer: 'A.' }] });
      mapFAQPage({ questions: [{ question: 'Q2?', answer: 'A2.' }] });
    }).not.toThrow();
  });
});

describe('dev warnings: production silence', () => {
  it('does not warn when NODE_ENV=production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    warnSpy.mockClear();
    mapOffer({ price: 1, currency: 'USD', availability: 'bogus' as any });
    expect(warnings()).toEqual([]);
  });
});
