# @ranklabs/schema-hydrogen

Hydrogen adapter for `@ranklabs/schema` (AEO/LLM-friendly JSON-LD).

This package renders JSON-LD as a `<script type="application/ld+json">` tag, using the same core mappers and types from `@ranklabs/schema`.

## Why “LLM-friendly”?

This adapter focuses on rendering; the “LLM-friendly” characteristics come from the core package:

- **Graph-first composition** (`GraphSchema` + `createGraph`) for multi-entity pages.
- **Stable entity identity** via canonical `@id`s.
- **Opt-in runtime hardening** via `prepareJsonLd` (clean + validate before render).

## Install

```bash
pnpm add @ranklabs/schema @ranklabs/schema-hydrogen
```

```bash
npm i @ranklabs/schema @ranklabs/schema-hydrogen
```

## Requirements

- React: `>=18`
- Hydrogen: `>=2025.x` (optional peer)

## Usage

### Recommended: render a graph (most routes)

```tsx
import { GraphSchema, mapWebPage, mapProduct, type ProductInput, type WebPageInput } from '@ranklabs/schema-hydrogen';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}
```

### Optional: validate/clean before rendering (strict mode)

```tsx
import { JsonLdSchema, createGraph, prepareJsonLd, mapWebPage, mapProduct } from '@ranklabs/schema-hydrogen';
import type { ProductInput, WebPageInput } from '@ranklabs/schema-hydrogen';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  const graph = createGraph(mapWebPage(page), mapProduct(product));
  const safeGraph = prepareJsonLd(graph, { mode: 'throw' });
  return <JsonLdSchema data={safeGraph} />;
}
```

### Render a single node

```tsx
import { OrganizationSchema } from '@ranklabs/schema-hydrogen';
import type { OrganizationInput } from '@ranklabs/schema-hydrogen';

export function MyOrgJsonLd({ org }: { org: OrganizationInput }) {
  return <OrganizationSchema data={org} />;
}
```

## Components

- `GraphSchema`
- `JsonLdSchema`
- Typed convenience components
  - `BrandSchema`
  - `ProductSchema`
  - `CollectionPageSchema`
  - `ItemListSchema`
  - `SoftwareApplicationSchema`
  - `OfferSchema`
  - `AggregateRatingSchema`
  - `ReviewSchema`
  - `ArticleSchema`
  - `FAQPageSchema`
  - `WebSiteSchema`
  - `OrganizationSchema`
  - `WebPageSchema`
  - `BreadcrumbListSchema`
  - `ImageSchema`
  - `VideoSchema`

## What this package does NOT do

- It does not infer or guess schema fields
- It does not mutate input data
- It does not inject or merge entities implicitly

All schema semantics are controlled by `@ranklabs/schema`.

## Notes

- `GraphSchema`: accepts mapped nodes and builds a full `@graph` internally (recommended)
- `JsonLdSchema`: renders pre-built JSON-LD data (advanced / strict pipelines)
- This adapter re-exports the full public API of `@ranklabs/schema` (mappers, types, utilities) so you can use single-imports.
- Hydrogen is an optional peer dependency so this package can be used in non-Hydrogen React environments too.
- All components render deterministic, escaped JSON-LD suitable for server rendering and streaming responses.

## Guides

- Hydrogen cookbook: https://github.com/ranklabsai/ranklabs-schema/blob/main/docs/cookbooks/hydrogen.md
- Docs index: https://github.com/ranklabsai/ranklabs-schema/tree/main/docs
