# @ranklabs/schema

Authority-grade Schema.org JSON-LD for e-commerce and SaaS.

This package is the core “source of truth”: strongly-typed inputs, pure mappers that generate Schema.org nodes, and JSON-LD utilities for graph composition.

## Install

```bash
pnpm add @ranklabs/schema
```

## Quick start (recommended: graphs)

```ts
import {
  createGraph,
  withContext,
  mapWebPage,
  mapOrganization,
  mapWebSite,
  mapProduct,
  type WebPageInput,
  type OrganizationInput,
  type WebSiteInput,
  type ProductInput,
} from '@ranklabs/schema';

export function buildJsonLd(params: {
  page: WebPageInput;
  org: OrganizationInput;
  site: WebSiteInput;
  product?: ProductInput;
}) {
  const nodes = [
    mapWebPage(params.page),
    mapOrganization(params.org),
    mapWebSite(params.site),
    ...(params.product ? [mapProduct(params.product)] : []),
  ];

  return withContext(createGraph(nodes));
}
```

## What you get

- Types
  - `ProductInput`, `OfferInput`, `ReviewInput`, `AggregateRatingInput`
  - `WebPageInput`, `WebSiteInput`, `OrganizationInput`, `BreadcrumbInput`
  - `CollectionInput`, `FAQInput`, `ArticleInput`, `SaaSInput`
  - `BrandInput`, `ImageInput`, `VideoInput`
- Mappers
  - `mapProduct`, `mapOffer`, `mapReview`, `mapAggregateRating`
  - `mapWebPage`, `mapWebSite`, `mapOrganization`, `mapBreadcrumbList`
  - `mapCollectionPage`, `mapItemList`
  - `mapArticle`, `mapFAQPage`
  - `mapBrand`, `mapImage`, `mapVideo`, `mapSaaS`
- JSON-LD utilities
  - `createGraph`, `withContext`, `toJsonScriptTag`, `escapeJsonForHtml`
- IDs & canonicalization
  - `canonicalizeUrl`, `canonicalId.*`
- Runtime utilities (opt-in)
  - `cleanJsonLd`, `validateJsonLd`

## React adapters

If you want React components for rendering JSON-LD, use:

- `@ranklabs/schema-next` (Next.js)
- `@ranklabs/schema-hydrogen` (Shopify Hydrogen)
