import { describe, expect, it } from 'vitest';

import {
  canonicalId,
  createGraph,
  mapArticle,
  mapBrand,
  mapOffer,
  mapProduct,
  mapSaaS,
  mapWebSite,
  withContext,
  type ArticleInput,
  type BrandInput,
  type OfferInput,
  type ProductInput,
  type SaaSInput,
  type WebSiteInput,
} from '@ranklabs/schema';

describe('ranklabs-schema core invariants', () => {
  it('mappers do not emit @context; createGraph emits a single @context', () => {
    const product: ProductInput = {
      id: 'p1',
      title: 'Test Product',
      description: 'Desc',
      handle: 'test-product',
      url: 'https://example.com/products/test-product',
      images: [{ url: 'https://example.com/img.jpg', altText: 'Alt' }],
      brand: 'Acme',
      offers: {
        price: 10,
        currency: 'USD',
        availability: 'InStock',
      },
    };

    const node = mapProduct(product);
    expect((node as any)['@context']).toBeUndefined();

    const graph = createGraph(node);
    expect(graph['@context']).toBe('https://schema.org');
    expect(Array.isArray(graph['@graph'])).toBe(true);
    expect((graph['@graph'][0] as any)['@context']).toBeUndefined();
  });

  it('schemaId overrides canonical @id generation (Brand/Product/Offer/Article)', () => {
    const brand: BrandInput = {
      name: 'Acme',
      url: 'https://example.com/brands/acme',
      schemaId: 'https://id.example.com/#brand-acme',
    };
    expect(mapBrand(brand)['@id']).toBe(brand.schemaId);

    const offer: OfferInput = {
      schemaId: 'https://id.example.com/#offer-primary',
      price: 10,
      currency: 'USD',
      availability: 'InStock',
    };
    expect(mapOffer(offer)['@id']).toBe(offer.schemaId);

    const article: ArticleInput = {
      headline: 'Hello',
      description: 'World',
      url: 'https://example.com/blog/hello',
      schemaId: 'https://id.example.com/#article-hello',
      datePublished: '2026-01-01',
      dateModified: '2026-01-02',
      author: { type: 'Person', id: 'https://example.com/#author', name: 'Alice' },
    };
    expect(mapArticle(article)['@id']).toBe(article.schemaId);
  });

  it('mapWebSite uses provided search.schemaId and url for SearchAction @id', () => {
    const input: WebSiteInput = {
      name: 'Example',
      url: 'https://example.com/',
      search: {
        url: 'https://example.com/',
        schemaId: 'https://id.example.com/#search-action',
        target: 'https://example.com/search?q={search_term_string}',
        queryInput: 'required name=search_term_string',
      },
    };

    const site = mapWebSite(input);
    const actions = site.potentialAction as any[];
    const search = input.search;
    expect(search).toBeDefined();
    expect(actions?.[0]?.['@id']).toBe(search!.schemaId);
  });

  it('mapOffer preserves quantity=0 as inventoryLevel value', () => {
    const offer: OfferInput = {
      price: 10,
      currency: 'USD',
      availability: 'InStock',
      quantity: 0,
    };

    const mapped = mapOffer(offer) as any;
    expect(mapped.inventoryLevel?.value).toBe(0);
  });

  it('createGraph dedupes by @id and strips embedded @context from nodes', () => {
    const url = 'https://example.com/x';
    const id = canonicalId.webpage(url);

    const n1 = withContext({ '@type': 'WebPage', '@id': id, url });
    const n2 = { '@type': 'WebPage', '@id': id, url };

    const graph = createGraph(n1 as any, n2 as any);
    expect(graph['@graph'].length).toBe(1);
    expect((graph['@graph'][0] as any)['@context']).toBeUndefined();
  });

  it('SaaS offer schemaId overrides Offer @id', () => {
    const saas: SaaSInput = {
      name: 'RankLabs',
      headline: 'AEO Tool',
      url: 'https://example.com/app',
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      offers: {
        schemaId: 'https://id.example.com/#saas-offer',
        price: 0,
        currency: 'USD',
      },
    };

    const mapped = mapSaaS(saas) as any;
    expect(mapped.offers?.['@id']).toBe(saas.offers.schemaId);
  });
});
