# Next.js cookbook (App Router + Pages Router)

This cookbook provides a scalable template for using `@ranklabs/schema-next` in a Next.js app.

## Goals

- Single JSON-LD graph per route.
- Modular schema code (nodes + builders).
- Works well with **RSC** and **streaming**.

## Recommended structure

```txt
app/
  (routes)/
    products/[handle]/
      page.tsx
      schema.tsx
src/
  schema/
    nodes/
      sitewide.ts
      product.ts
    buildGraph.ts
```

## 1) Schema nodes (pure and testable)

### `src/schema/nodes/sitewide.ts`

```ts
import { mapOrganization, mapWebSite, type OrganizationInput, type WebSiteInput } from '@ranklabs/schema-next';

export function buildSitewideNodes(params: { org: OrganizationInput; site: WebSiteInput }) {
  return [mapOrganization(params.org), mapWebSite(params.site)];
}
```

### `src/schema/nodes/product.ts`

```ts
import { mapWebPage, mapProduct, type WebPageInput, type ProductInput } from '@ranklabs/schema-next';

export function buildProductPageNodes(params: { page: WebPageInput; product: ProductInput }) {
  return [mapWebPage(params.page), mapProduct(params.product)];
}
```

## 2) Graph builder (one graph per page)

### `src/schema/buildGraph.ts`

```ts
import { createGraph, prepareJsonLd, type JsonLdNode } from '@ranklabs/schema-next';

export function buildGraph(nodes: Array<JsonLdNode | null | undefined | JsonLdNode[]>) {
  // Beginners: one graph per route avoids duplicate identity across scripts.
  const graph = createGraph(...nodes);

  // Use mode 'warn' in dev, 'throw' in CI/strict production.
  return prepareJsonLd(graph, { mode: 'warn' });
}
```

## 3) App Router: render schema in a dedicated component

### `app/(routes)/products/[handle]/schema.tsx`

```tsx
import React from 'react';
import { JsonLdSchema } from '@ranklabs/schema-next';
import { buildGraph } from '@/schema/buildGraph';
import { buildSitewideNodes } from '@/schema/nodes/sitewide';
import { buildProductPageNodes } from '@/schema/nodes/product';

export function ProductSchemaGraph(props: {
  page: WebPageInput;
  product: ProductInput;
  org: OrganizationInput;
  site: WebSiteInput;
}) {
  const nodes = [
    ...buildSitewideNodes({ org: props.org, site: props.site }),
    ...buildProductPageNodes({ page: props.page, product: props.product }),
  ];

  const graph = buildGraph(nodes);

  // Beginners: JsonLdSchema renders pre-built JSON-LD.
  // This avoids accidentally nesting graphs.
  return <JsonLdSchema id="schema-graph" data={graph} />;
}
```

### `app/(routes)/products/[handle]/page.tsx`

```tsx
import React from 'react';
import { ProductSchemaGraph } from './schema';

export default async function ProductPage() {
  // Fetch your data here (server-side).
  // Build WebPageInput/ProductInput/OrganizationInput/WebSiteInput.

  return (
    <>
      {/* Your page UI */}
      <ProductSchemaGraph page={page} product={product} org={org} site={site} />
    </>
  );
}
```

## Pages Router notes

- You can render `<JsonLdSchema data={graph} />` inside a page component.
- Keep the same separation:
  - `nodes/*` (pure mappers)
  - `buildGraph` (composition + validation)
  - `schema.tsx` (render)

## Best practices

- Prefer `JsonLdSchema` when you prebuild graphs (strict pipeline).
- Prefer `GraphSchema` when you want the adapter to build graphs from nodes.
- Keep “sitewide nodes” as nodes, then compose into page graphs to avoid fragmentation.
