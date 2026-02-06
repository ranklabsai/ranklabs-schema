# @ranklabs/schema-hydrogen

`@ranklabs/schema-hydrogen` is a Shopify Hydrogen-compatible React adapter that renders JSON-LD as a `<script type="application/ld+json">` tag.

This package re-exports the full public API of `@ranklabs/schema`, so you can do single-imports from `@ranklabs/schema-hydrogen`.

## Install

Pick one:

```bash
pnpm add @ranklabs/schema @ranklabs/schema-hydrogen
```

```bash
npm i @ranklabs/schema @ranklabs/schema-hydrogen
```

## Requirements

- React: `>=18`
- Hydrogen: `>=2025.x` (optional peer)

## Components

- `GraphSchema`
  - Builds a single `@graph` internally via `createGraph(...nodes)`
- `JsonLdSchema`
  - Renders pre-built JSON-LD data (advanced / strict pipelines)
- Typed convenience components
  - `ProductSchema`, `OfferSchema`, `AggregateRatingSchema`, `ReviewSchema`
  - `CollectionPageSchema`, `ItemListSchema`
  - `ArticleSchema`, `FAQPageSchema`
  - `OrganizationSchema`, `WebSiteSchema`, `WebPageSchema`, `BreadcrumbListSchema`
  - `BrandSchema`, `ImageSchema`, `VideoSchema`
  - `SoftwareApplicationSchema`

## Recommended: render a graph

```tsx
import { GraphSchema, mapWebPage, mapProduct } from '@ranklabs/schema-hydrogen';
import type { WebPageInput, ProductInput } from '@ranklabs/schema-hydrogen';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}
```

## Optional: strict pipeline (validate before render)

```tsx
import { JsonLdSchema, createGraph, prepareJsonLd, mapWebPage, mapProduct } from '@ranklabs/schema-hydrogen';
import type { WebPageInput, ProductInput } from '@ranklabs/schema-hydrogen';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  const graph = createGraph(mapWebPage(page), mapProduct(product));
  const safe = prepareJsonLd(graph, { mode: 'throw' });
  return <JsonLdSchema data={safe} />;
}
```

## What this package does NOT do

- It does not infer or guess schema fields
- It does not mutate input data
- It does not inject or merge entities implicitly

All schema semantics are controlled by `@ranklabs/schema`.

## Notes

- `GraphSchema`: accepts mapped nodes and builds a full `@graph` internally (recommended)
- `JsonLdSchema`: renders pre-built JSON-LD data (advanced / strict pipelines)
- All components render deterministic, escaped JSON-LD suitable for server rendering and streaming responses.
