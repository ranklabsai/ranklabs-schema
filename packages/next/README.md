# @ranklabs/schema-next

Next.js adapter for `@ranklabs/schema` (AEO/LLM-friendly JSON-LD).

This package renders JSON-LD as a `<script type="application/ld+json">` tag, using the same core mappers and types from `@ranklabs/schema`.

## Why “LLM-friendly”?

This adapter is a thin renderer over the core package. The “LLM-friendly” aspects come from the underlying design:

- **Graph-first composition** (`GraphSchema` + `createGraph`) for pages with multiple entities and shared identity.
- **Stable entity identity** via canonical `@id`s.
- **Opt-in runtime hardening** via `prepareJsonLd` (clean + validate before render).

## Install

```bash
pnpm add @ranklabs/schema @ranklabs/schema-next
```

```bash
npm i @ranklabs/schema @ranklabs/schema-next
```

## Requirements

- Next.js: `>=14`
- React: `>=18`

## Usage

### Recommended: render a graph (most pages)

```tsx
import { GraphSchema, mapWebPage, mapProduct, type ProductInput, type WebPageInput } from '@ranklabs/schema-next';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}
```

### Optional: validate/clean before rendering (strict mode)

```tsx
import { JsonLdSchema, createGraph, prepareJsonLd, mapWebPage, mapProduct } from '@ranklabs/schema-next';
import type { ProductInput, WebPageInput } from '@ranklabs/schema-next';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  const graph = createGraph(mapWebPage(page), mapProduct(product));
  const safeGraph = prepareJsonLd(graph, { mode: 'throw' });
  return <JsonLdSchema data={safeGraph} />;
}
```

### Render a single node (when you don’t need a graph)

```tsx
import { ProductSchema } from '@ranklabs/schema-next';
import type { ProductInput } from '@ranklabs/schema-next';

export function MyProductJsonLd({ product }: { product: ProductInput }) {
  return <ProductSchema data={product} />;
}
```

## Components

- `GraphSchema`
  - Use when you have multiple nodes (`WebPage` + `Product`, `Organization` + `WebSite`, etc.)
- `JsonLdSchema`
  - Raw renderer for any JSON-LD object (already includes `@context` if you pass a graph)
- Typed convenience components (each wraps the core mapper + `withContext`)
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

## Notes

- This adapter re-exports the full public API of `@ranklabs/schema` (mappers, types, utilities) so you can use single-imports.
- If you need strict validation/cleaning, do it in `@ranklabs/schema` before passing nodes to `GraphSchema`.
- All components render deterministic, escaped JSON-LD suitable for server rendering and streaming.

## Guides

- Next.js cookbook: https://github.com/ranklabsai/ranklabs-schema/blob/main/docs/cookbooks/nextjs.md
- Docs index: https://github.com/ranklabsai/ranklabs-schema/tree/main/docs
