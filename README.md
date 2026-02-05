# RankLabs Schema

Authority-grade Schema.org JSON-LD helpers for e-commerce + SaaS.

## Packages

- `@ranklabs/schema`
- `@ranklabs/schema-next`
- `@ranklabs/schema-hydrogen`

## Install

```bash
pnpm add @ranklabs/schema
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

## Next.js

```tsx
import { GraphSchema } from '@ranklabs/schema-next';
import { mapWebPage, mapProduct, type ProductInput, type WebPageInput } from '@ranklabs/schema';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}
```

## Hydrogen

```tsx
import { GraphSchema } from '@ranklabs/schema-hydrogen';
import { mapWebPage, mapProduct, type ProductInput, type WebPageInput } from '@ranklabs/schema';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}