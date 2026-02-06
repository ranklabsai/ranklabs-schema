# @ranklabs/schema-next

`@ranklabs/schema-next` is a Next.js React adapter that renders JSON-LD as a `<script type="application/ld+json">` tag.

This package re-exports the full public API of `@ranklabs/schema`, so you can do single-imports from `@ranklabs/schema-next`.

## Install

Pick one:

```bash
pnpm add @ranklabs/schema @ranklabs/schema-next
```

```bash
npm i @ranklabs/schema @ranklabs/schema-next
```

## Requirements

- Next.js: `>=14`
- React: `>=18`

## Components

- `GraphSchema`
  - Input: `nodes: Array<JsonLdNode | JsonLdNode[] | null | undefined>`
  - Behavior: builds a single `@graph` internally via `createGraph(...nodes)`
  - Recommended for most pages
- `JsonLdSchema`
  - Input: `data: unknown`
  - Behavior: renders whatever JSON-LD you provide (advanced / strict pipelines)
- Typed convenience components (each wraps a core mapper + `withContext`)
  - `ProductSchema`, `OfferSchema`, `AggregateRatingSchema`, `ReviewSchema`
  - `CollectionPageSchema`, `ItemListSchema`
  - `ArticleSchema`, `FAQPageSchema`
  - `OrganizationSchema`, `WebSiteSchema`, `WebPageSchema`, `BreadcrumbListSchema`
  - `BrandSchema`, `ImageSchema`, `VideoSchema`
  - `SoftwareApplicationSchema`

## Recommended: render a graph

```tsx
import { GraphSchema, mapWebPage, mapProduct } from '@ranklabs/schema-next';
import type { WebPageInput, ProductInput } from '@ranklabs/schema-next';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}
```

## Optional: strict pipeline (validate before render)

```tsx
import { JsonLdSchema, createGraph, prepareJsonLd, mapWebPage, mapProduct } from '@ranklabs/schema-next';
import type { WebPageInput, ProductInput } from '@ranklabs/schema-next';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  const graph = createGraph(mapWebPage(page), mapProduct(product));
  const safe = prepareJsonLd(graph, { mode: 'throw' });
  return <JsonLdSchema data={safe} />;
}
```

## Notes

- `GraphSchema` builds a graph; `JsonLdSchema` renders pre-built JSON-LD.
- All components render deterministic, escaped JSON-LD suitable for server rendering and streaming.
