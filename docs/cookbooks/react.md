# React cookbook (framework-agnostic)

This cookbook shows a scalable, maintainable way to integrate RankLabs Schema into a React app **without** fragmenting JSON-LD.

## Goals

- Render **one JSON-LD graph per route/page**.
- Keep schema code **modular** (easy to add entities, easy to test).
- Provide a **strict pipeline option** (clean + validate before render).

## Recommended folder structure

```txt
src/
  schema/
    nodes/
      sitewide.ts
      product.ts
      collection.ts
    buildGraph.ts
    renderJsonLd.tsx
```

## 1) Nodes: keep mapping separate from rendering

### `src/schema/nodes/sitewide.ts`

```ts
import { mapOrganization, mapWebSite, type OrganizationInput, type WebSiteInput } from '@ranklabs/schema';

/**
 * Build nodes that are shared across many routes.
 *
 * Beginners: returning nodes (not a full graph) lets you compose them into
 * a single graph per page later.
 */
export function buildSitewideNodes(params: { org: OrganizationInput; site: WebSiteInput }) {
  return [mapOrganization(params.org), mapWebSite(params.site)];
}
```

### `src/schema/nodes/product.ts`

```ts
import { mapWebPage, mapProduct, type WebPageInput, type ProductInput } from '@ranklabs/schema';

/** Build the nodes for a product detail route. */
export function buildProductPageNodes(params: { page: WebPageInput; product: ProductInput }) {
  return [mapWebPage(params.page), mapProduct(params.product)];
}
```

## 2) Build one graph per page

### `src/schema/buildGraph.ts`

```ts
import { createGraph, prepareJsonLd } from '@ranklabs/schema';
import type { JsonLdNode } from '@ranklabs/schema';

export type BuildGraphOptions = {
  /**
   * - throw: fail fast (CI, strict prod)
   * - warn: dev warnings, still returns cleaned output
   * - silent: best-effort cleanup only
   */
  mode?: 'throw' | 'warn' | 'silent';
};

/**
 * Compose nodes into a single graph, and optionally validate.
 *
 * Beginners: `createGraph` also dedupes by `@id`, which helps when a node
 * (like Organization) is included from multiple places.
 */
export function buildJsonLdGraph(nodes: Array<JsonLdNode | null | undefined | JsonLdNode[]>, opts?: BuildGraphOptions) {
  const graph = createGraph(...nodes);
  return prepareJsonLd(graph, { mode: opts?.mode ?? 'warn' });
}
```

## 3) Rendering

### `src/schema/renderJsonLd.tsx`

```tsx
import React from 'react';
import { toJsonLdString } from '@ranklabs/schema';

export function JsonLdScript({ data, id }: { data: unknown; id?: string }) {
  if (!data) return null;

  // Beginners: JSON-LD must be injected as raw text in a <script> tag.
  // `toJsonLdString(..., { escapeForHtml: true })` prevents breaking out of the script tag.
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLdString(data, { pretty: false, escapeForHtml: true }) }}
    />
  );
}
```

## Example usage (compose sitewide + page nodes)

```tsx
import React from 'react';
import { JsonLdScript } from './schema/renderJsonLd';
import { buildJsonLdGraph } from './schema/buildGraph';
import { buildSitewideNodes } from './schema/nodes/sitewide';
import { buildProductPageNodes } from './schema/nodes/product';

export function ProductRouteSchema(props: {
  page: WebPageInput;
  product: ProductInput;
  org: OrganizationInput;
  site: WebSiteInput;
}) {
  const nodes = [
    ...buildSitewideNodes({ org: props.org, site: props.site }),
    ...buildProductPageNodes({ page: props.page, product: props.product }),
  ];

  const graph = buildJsonLdGraph(nodes, { mode: 'warn' });
  return <JsonLdScript id="schema-graph" data={graph} />;
}
```

## Notes

- Prefer **one** graph per page (avoid fragmented JSON-LD).
- Use the adapters (`@ranklabs/schema-next`, `@ranklabs/schema-hydrogen`) if you want prebuilt React components.
