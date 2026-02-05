# @ranklabs/schema-next

Next.js adapter for `@ranklabs/schema`.

This package renders JSON-LD as a `<script type="application/ld+json">` tag, using the same core mappers and types from `@ranklabs/schema`.

## Install

```bash
pnpm add @ranklabs/schema @ranklabs/schema-next
```

## Requirements

- Next.js: `>=14`
- React: `>=18`

## Usage

### Recommended: render a graph (most pages)

```tsx
import { GraphSchema } from '@ranklabs/schema-next';
import { mapWebPage, mapProduct, type ProductInput, type WebPageInput } from '@ranklabs/schema';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
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
  - `ProductSchema`
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

## Notes

- This adapter is intentionally thin. The source of truth is always `@ranklabs/schema` mappers/types.
- If you need strict validation/cleaning, do it in `@ranklabs/schema` before passing nodes to `GraphSchema`.
