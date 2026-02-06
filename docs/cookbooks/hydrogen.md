# Shopify Hydrogen cookbook

This cookbook provides a scalable template for using `@ranklabs/schema-hydrogen` in Shopify Hydrogen.

## Goals

- Single JSON-LD graph per route.
- Modular schema code (nodes + builder).
- Safe to use with SSR + streaming.

## Recommended structure

```txt
app/
  schema/
    nodes/
      sitewide.ts
      product.ts
    buildGraph.ts
  routes/
    products.$handle.tsx
```

## 1) Nodes (pure mapping)

### `app/schema/nodes/sitewide.ts`

```ts
import { mapOrganization, mapWebSite, type OrganizationInput, type WebSiteInput } from '@ranklabs/schema-hydrogen';

export function buildSitewideNodes(params: { org: OrganizationInput; site: WebSiteInput }) {
  return [mapOrganization(params.org), mapWebSite(params.site)];
}
```

### `app/schema/nodes/product.ts`

```ts
import { mapWebPage, mapProduct, type WebPageInput, type ProductInput } from '@ranklabs/schema-hydrogen';

export function buildProductPageNodes(params: { page: WebPageInput; product: ProductInput }) {
  return [mapWebPage(params.page), mapProduct(params.product)];
}
```

## 2) Graph builder

### `app/schema/buildGraph.ts`

```ts
import { createGraph, prepareJsonLd, type JsonLdNode } from '@ranklabs/schema-hydrogen';

export function buildGraph(nodes: Array<JsonLdNode | null | undefined | JsonLdNode[]>) {
  const graph = createGraph(...nodes);
  return prepareJsonLd(graph, { mode: 'warn' });
}
```

## 3) Route usage

### `app/routes/products.$handle.tsx`

```tsx
import React from 'react';
import { JsonLdSchema } from '@ranklabs/schema-hydrogen';
import { buildGraph } from '~/schema/buildGraph';
import { buildSitewideNodes } from '~/schema/nodes/sitewide';
import { buildProductPageNodes } from '~/schema/nodes/product';

export default function ProductRoute() {
  // Load your data using Hydrogen/Remix loaders.
  // Build the input objects for the schema mappers.

  const nodes = [
    ...buildSitewideNodes({ org, site }),
    ...buildProductPageNodes({ page, product }),
  ];

  const graph = buildGraph(nodes);

  // Beginners: JsonLdSchema renders the JSON-LD you provide.
  // It does not infer or merge anything implicitly.
  return (
    <>
      {/* Your route UI */}
      <JsonLdSchema id="schema-graph" data={graph} />
    </>
  );
}
```

## Best practices

- Prefer one graph per route.
- Keep sitewide nodes as nodes (not a separate script) and compose into the route graph.
- Use `prepareJsonLd(..., { mode: 'throw' })` in CI/tests to fail fast.
