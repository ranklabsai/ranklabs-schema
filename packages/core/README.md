# @ranklabs/schema

Authority-grade Schema.org JSON-LD for e-commerce and SaaS—designed for machine consumption (search engines and LLMs), not just traditional SEO.

This package is the core “source of truth”: strongly-typed inputs, pure mappers that generate Schema.org nodes, and JSON-LD utilities for graph composition.

## Install

```bash
pnpm add @ranklabs/schema
```

```bash
npm i @ranklabs/schema
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

## Why “LLM-friendly”?

- **Graph-first by default**: compose multiple entities into a single `@graph` for clearer machine interpretation.
- **Stable identity**: canonical `@id` helpers (`canonicalId.*`) so entities can be referenced consistently across routes.
- **Deterministic output**: pure mappers (`mapProduct`, `mapWebPage`, etc.) that produce stable JSON-LD objects from typed inputs.
- **Opt-in runtime hardening**: `cleanJsonLd`, `validateJsonLd`, and `prepareJsonLd` to clean and validate output before rendering.

## Why graphs instead of separate JSON-LD blocks?

Schema.org allows multiple JSON-LD scripts per page, but this quickly breaks down at scale.

### Separate JSON-LD blocks
- Each script is parsed independently
- Entity identity is implicit or duplicated
- Relationships are inferred, not guaranteed

This works for simple pages, but becomes fragile when:
- multiple plugins inject schema
- brands, products, and organizations repeat
- pages share entities across routes

### Graph-based JSON-LD (recommended)

Using a single `@graph`:
- entities are defined once and referenced by stable `@id`
- relationships are explicit and machine-resolvable
- duplicate entities are automatically deduped
- the full page can be validated as a unit

This is especially important for LLMs, which reason over entity graphs rather than documents.

`@ranklabs/schema` is graph-first by default for this reason.

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
  - `createGraph`, `withContext`, `toJsonLdString`, `toJsonLdScriptTag`
- IDs & canonicalization
  - `canonicalizeUrl`, `canonicalId.*`
- Runtime utilities (opt-in)
  - `cleanJsonLd`, `validateJsonLd`

## React adapters

If you want React components for rendering JSON-LD, use:

- `@ranklabs/schema-next` (Next.js)
- `@ranklabs/schema-hydrogen` (Shopify Hydrogen)

## Guides

- Docs index: https://github.com/ranklabsai/ranklabs-schema/tree/main/docs
- React cookbook: https://github.com/ranklabsai/ranklabs-schema/blob/main/docs/cookbooks/react.md
- Next.js cookbook: https://github.com/ranklabsai/ranklabs-schema/blob/main/docs/cookbooks/nextjs.md
- Hydrogen cookbook: https://github.com/ranklabsai/ranklabs-schema/blob/main/docs/cookbooks/hydrogen.md
