# @ranklabs/schema (core)

`@ranklabs/schema` is the core package: strongly-typed inputs, pure mappers that output Schema.org JSON-LD nodes, and utilities for composing and rendering JSON-LD.

## Install

Pick one:

```bash
pnpm add @ranklabs/schema
```

```bash
npm i @ranklabs/schema
```

## What you get

## Types (inputs)

Key input types you’ll use most often:

- `WebPageInput`, `WebSiteInput`, `OrganizationInput`, `BreadcrumbInput`
- `ProductInput`, `OfferInput`, `ReviewInput`, `AggregateRatingInput`
- `CollectionInput`, `ArticleInput`, `FAQInput`, `SaaSInput`
- `BrandInput`, `ImageInput`, `VideoInput`

## Mappers

All mappers are pure functions. They return JSON-LD nodes without `@context`.

- Commerce
  - `mapProduct`
  - `mapOffer`
  - `mapReview`, `mapAggregateRating`
  - `mapCollectionPage`, `mapItemList`
- Content
  - `mapArticle`
  - `mapFAQPage`
- Core + identity
  - `mapWebPage`, `mapWebSite`, `mapOrganization`, `mapBreadcrumbList`
  - `mapBrand`, `mapImage`, `mapVideo`
- Software
  - `mapSaaS`

## JSON-LD utilities

- `createGraph(...nodes)`
  - Composes a single JSON-LD graph: `{ "@context": "https://schema.org", "@graph": [...] }`
  - Flattens arrays, strips nested `@context`, dedupes by `@id`
- `withContext(node)`
  - Injects the schema.org context into a single node
- `toJsonLdString(value, { escapeForHtml })`
  - HTML-safe JSON serialization for embedding in `<script type="application/ld+json">`
- `toJsonLdScriptTag(value, { id, nonce })`
  - Convenience for string-building a script tag

## Canonicalization + IDs

- `canonicalizeUrl(url)` / `canonicalizeUrlString(url)`
- `canonicalId.*` helpers for stable fragment-based IDs

See: [Canonical URLs and stable @id](../concepts/identity.md)

## Cleaning + validation (opt-in)

- `cleanJsonLd(value, opts)`
- `validateJsonLd(value, opts)`
- `assertJsonLd(value, opts)`
- `prepareJsonLd(value, { mode })`

See: [Cleaning and validation](../concepts/validation.md)

## Recommended: build graphs

```ts
import {
  createGraph,
  mapWebPage,
  mapOrganization,
  mapWebSite,
  mapProduct,
  prepareJsonLd,
  withContext,
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
  const graph = createGraph(
    mapWebPage(params.page),
    mapOrganization(params.org),
    mapWebSite(params.site),
    ...(params.product ? [mapProduct(params.product)] : []),
  );

  const safe = prepareJsonLd(graph, { mode: 'warn' });
  return withContext(safe);
}
```
