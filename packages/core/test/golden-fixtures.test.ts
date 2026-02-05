import { describe, expect, it } from 'vitest';

import { readFile } from 'node:fs/promises';

import {
  createGraph,
  mapArticle,
  mapCollectionPage,
  mapFAQPage,
  mapProduct,
  mapSaaS,
  mapWebPage,
  mapWebSite,
  toJsonLdString,
  type ArticleInput,
  type CollectionInput,
  type FAQInput,
  type ProductInput,
  type SaaSInput,
  type WebPageInput,
  type WebSiteInput,
} from '@ranklabs/schema';

function normalizeJson(value: unknown): unknown {
  return JSON.parse(toJsonLdString(value, { pretty: false, escapeForHtml: false }));
}

async function loadFixture(name: string): Promise<unknown> {
  const buf = await readFile(new URL(`./fixtures/${name}`, import.meta.url));
  return JSON.parse(buf.toString('utf8'));
}

describe('ranklabs-schema golden fixtures', () => {
  it('website graph', async () => {
    const input: WebSiteInput = {
      name: 'Example',
      url: 'https://example.com/',
      search: {
        url: 'https://example.com/',
        target: 'https://example.com/search?q={search_term_string}',
        queryInput: 'required name=search_term_string',
      },
    };

    const actual = normalizeJson(createGraph(mapWebSite(input)));
    const expected = await loadFixture('website-graph.json');
    expect(actual).toEqual(expected);
  });

  it('product graph', async () => {
    const input: ProductInput = {
      id: 'p1',
      title: 'Test Product',
      description: 'Desc',
      handle: 'test-product',
      url: 'https://Example.com/products/test-product?utm_source=x&b=2&a=1#frag',
      images: [{ url: 'https://example.com/img.jpg', altText: 'Alt' }],
      brand: 'Acme',
      offers: {
        price: 10,
        currency: 'USD',
        availability: 'InStock',
        quantity: 0,
      },
    };

    const actual = normalizeJson(createGraph(mapProduct(input)));
    const expected = await loadFixture('product-graph.json');
    expect(actual).toEqual(expected);
  });

  it('product page graph (webpage + product)', async () => {
    const url = 'https://Example.com/products/test-product?utm_source=x&b=2&a=1#frag';

    const product: ProductInput = {
      id: 'p1',
      title: 'Test Product',
      description: 'Desc',
      handle: 'test-product',
      url,
      images: [{ url: 'https://example.com/img.jpg', altText: 'Alt' }],
      brand: 'Acme',
      offers: {
        price: 10,
        currency: 'USD',
        availability: 'InStock',
      },
    };

    const page: WebPageInput = {
      title: 'Test Product',
      description: 'Desc',
      url,
      language: 'en-US',
      breadcrumb: {
        url,
        items: [
          { name: 'Home', item: 'https://example.com/' },
          { name: 'Products', item: 'https://example.com/products' },
          { name: 'Test Product', item: 'https://example.com/products/test-product' },
        ],
      },
    };

    const actual = normalizeJson(createGraph(mapWebPage(page), mapProduct(product)));
    const expected = await loadFixture('product-page-graph.json');
    expect(actual).toEqual(expected);
  });

  it('product rich graph (shipping + returns + rating + reviews)', async () => {
    const url = 'https://Example.com/products/rich?utm_source=x&b=2&a=1#frag';

    const product: ProductInput = {
      id: 'p-rich',
      title: 'Rich Product',
      description: 'Desc',
      handle: 'rich',
      url,
      images: [{ url: 'https://example.com/img.jpg', altText: 'Alt' }],
      brand: 'Acme',
      rating: {
        url,
        ratingValue: 4.8,
        reviewCount: 12,
      },
      reviews: [
        {
          url: 'https://example.com/reviews/1?product=rich',
          author: 'Alice',
          datePublished: '2026-01-01',
          reviewBody: 'Great',
          rating: 5,
        },
      ],
      offers: {
        price: 10,
        currency: 'USD',
        availability: 'InStock',
        shipping: {
          cost: 5,
          currency: 'USD',
          destinations: ['US'],
          handlingTime: { minDays: 0, maxDays: 1 },
          deliveryTime: { minDays: 2, maxDays: 5 },
        },
        shipsFrom: {
          streetAddress: '1 Main St',
          addressLocality: 'New York',
          addressRegion: 'NY',
          postalCode: '10001',
          addressCountry: 'US',
        },
        returns: {
          applicableCountry: 'US',
          merchantReturnDays: 30,
          merchantReturnLink: 'https://example.com/returns',
          returnFees: 'FreeReturn',
          returnMethod: ['ReturnByMail', 'ReturnInStore'],
          refundType: 'FullRefund',
        },
      },
    };

    const actual = normalizeJson(createGraph(mapProduct(product)));
    const expected = await loadFixture('product-rich-graph.json');
    expect(actual).toEqual(expected);
  });

  it('collection page graph', async () => {
    const product: ProductInput = {
      id: 'p1',
      title: 'Test Product',
      description: 'Desc',
      handle: 'test-product',
      url: 'https://example.com/products/test-product',
      images: [{ url: 'https://example.com/img.jpg', altText: 'Alt' }],
      brand: 'Acme',
      offers: { price: 10, currency: 'USD', availability: 'InStock' },
    };

    const collection: CollectionInput = {
      title: 'Sneakers',
      description: 'All sneakers',
      url: 'https://example.com/collections/sneakers',
      products: [product],
    };

    const actual = normalizeJson(createGraph(mapCollectionPage(collection)));
    const expected = await loadFixture('collection-page-graph.json');
    expect(actual).toEqual(expected);
  });

  it('faq page graph', async () => {
    const faq: FAQInput = {
      title: 'FAQ',
      url: 'https://example.com/faq',
      questions: [
        { question: 'What is RankLabs?', answer: 'An AEO toolkit.' },
        { question: 'Do you support JSON-LD?', answer: 'Yes.' },
      ],
    };

    const actual = normalizeJson(createGraph(mapFAQPage(faq)));
    const expected = await loadFixture('faq-page-graph.json');
    expect(actual).toEqual(expected);
  });

  it('article graph', async () => {
    const article: ArticleInput = {
      headline: 'Hello',
      description: 'World',
      url: 'https://example.com/blog/hello',
      datePublished: '2026-01-01',
      dateModified: '2026-01-02',
      author: {
        type: 'Person',
        id: 'https://example.com/#author',
        name: 'Alice',
        url: 'https://example.com/about',
      },
    };

    const actual = normalizeJson(createGraph(mapArticle(article)));
    const expected = await loadFixture('article-graph.json');
    expect(actual).toEqual(expected);
  });

  it('saas graph', async () => {
    const saas: SaaSInput = {
      name: 'RankLabs',
      headline: 'AEO Tool',
      url: 'https://example.com/app',
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      offers: {
        price: 0,
        currency: 'USD',
        billingUnit: 'MONTH',
        billingDuration: 1,
      },
    };

    const actual = normalizeJson(createGraph(mapSaaS(saas)));
    const expected = await loadFixture('saas-graph.json');
    expect(actual).toEqual(expected);
  });
});
