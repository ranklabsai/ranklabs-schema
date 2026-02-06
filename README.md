# RankLabs Schema

Authority-grade Schema.org JSON-LD for e-commerce + SaaS—designed for machine consumption (search engines and LLMs), not just traditional SEO.

## Why “LLM-friendly”?

- **Deterministic output**: pure mappers that produce stable JSON-LD objects from typed inputs.
- **Stable identity**: canonical `@id` helpers to consistently reference entities across pages.
- **Graph-first composition**: build a single `@graph` for complex pages and dedupe nodes by `@id`.
- **Opt-in runtime hardening**: `cleanJsonLd`, `validateJsonLd`, and `prepareJsonLd` for cleaning + validation.
- **Safe rendering**: HTML-escaped JSON output to avoid breaking out of `<script>` tags.

## Packages

- `@ranklabs/schema`
- `@ranklabs/schema-next`
- `@ranklabs/schema-hydrogen`

### When to use which package

- **`@ranklabs/schema`**: core mappers + graph utilities (framework-agnostic)
- **`@ranklabs/schema-next`**: React components for Next.js (App Router and Pages Router)
- **`@ranklabs/schema-hydrogen`**: Hydrogen-compatible React components

### Docs

- Docs index: https://github.com/ranklabsai/ranklabs-schema/tree/main/docs
- React cookbook: https://github.com/ranklabsai/ranklabs-schema/blob/main/docs/cookbooks/react.md
- Next.js cookbook: https://github.com/ranklabsai/ranklabs-schema/blob/main/docs/cookbooks/nextjs.md
- Hydrogen cookbook: https://github.com/ranklabsai/ranklabs-schema/blob/main/docs/cookbooks/hydrogen.md

## Install

Pick one:

```bash
pnpm add @ranklabs/schema
```

Alternative:

```bash
npm i @ranklabs/schema
```

## Core usage

```ts
import {
  createGraph,
  mapWebPage,
  mapProduct,
  prepareJsonLd,
  toJsonLdScriptTag,
  type ProductInput,
  type WebPageInput,
} from '@ranklabs/schema';

const page: WebPageInput = {
  title: 'Test Product',
  description: 'Desc',
  url: 'https://example.com/products/test-product',
};

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

const graph = createGraph(mapWebPage(page), mapProduct(product));
const safeGraph = prepareJsonLd(graph, { mode: 'throw' });

const scriptTag = toJsonLdScriptTag(safeGraph, { id: 'schema-graph' });
```

## 10-second: what do I get?

You’ll get a single JSON-LD graph that looks like this (truncated):

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": "https://example.com/products/test-product#webpage", "url": "..." },
    { "@type": "Product", "@id": "https://example.com/products/test-product#product", "name": "Test Product" }
  ]
}
```

### `prepareJsonLd` modes (quick)

- **`throw`**: fail fast (throws a `JsonLdValidationError`) — best for CI and strict production builds
- **`warn`**: logs warnings in non-production environments, returns cleaned output
- **`silent`**: best-effort cleanup only (no warnings), returns cleaned output

### Product inputs (quick guide)

TypeScript-required by `ProductInput`:

- **`id`**
- **`title`**
- **`description`**
- **`handle`**
- **`url`**
- **`images`**
- **`brand`**
- **`offers`**

Common minimums for rich results:

- **`title`, `description`, `url`**
- **`images[0].url`**
- **`offers.price`, `offers.currency`, `offers.availability`**

Note: `prepareJsonLd` validates JSON-LD structure (context/type/id/graph shape). It does not enforce full Schema.org product completeness.

### Canonical `@id` strategy (stable identity)

```ts
// @id becomes: https://example.com/products/test-product#product
const productNode = mapProduct(product);
```

## Common patterns

### Product detail page

- `WebPage` + `Product`

### Collection page

- `WebPage` + `ItemList`
- Optional: `CollectionPage`

### Organization sitewide

- `Organization` + `WebSite`
- Optional: `SearchAction` (sitelinks search box)

## Next.js

```tsx
import { GraphSchema } from '@ranklabs/schema-next';
import { mapWebPage, mapProduct, type ProductInput, type WebPageInput } from '@ranklabs/schema';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}
```

## Contributing / Dev

Requirements:

- Node.js: `>=20` (recommended: latest LTS)
- pnpm: `10`

Commands:

```bash
pnpm i
pnpm build
pnpm test
pnpm lint
```

## Hydrogen

```tsx
import { GraphSchema } from '@ranklabs/schema-hydrogen';
import { mapWebPage, mapProduct, type ProductInput, type WebPageInput } from '@ranklabs/schema';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}