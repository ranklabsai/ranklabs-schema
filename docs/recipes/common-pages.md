# Common page patterns

This page contains copy-paste oriented recipes for the most common routes.

## Avoid fragmented JSON-LD

Best practice is to render **one JSON-LD graph per page**.

If you have “sitewide” entities (like `Organization` and `WebSite`) and “page-specific” entities (like `Product`), compose them into a **single `@graph`** rather than emitting multiple independent JSON-LD blocks.

## Product detail page

Graph nodes:

- `WebPage`
- `Product`

```ts
import { createGraph, mapWebPage, mapProduct } from '@ranklabs/schema';

export function buildProductPageJsonLd(params: { page: WebPageInput; product: ProductInput }) {
  return createGraph(mapWebPage(params.page), mapProduct(params.product));
}
```

### Product detail page (with sitewide nodes)

```ts
import { createGraph, mapWebPage, mapProduct, mapOrganization, mapWebSite } from '@ranklabs/schema';

export function buildProductPageJsonLd(params: {
  page: WebPageInput;
  product: ProductInput;
  org: OrganizationInput;
  site: WebSiteInput;
}) {
  const sitewide = [mapOrganization(params.org), mapWebSite(params.site)];
  return createGraph(sitewide, mapWebPage(params.page), mapProduct(params.product));
}
```

## Collection page

Graph nodes:

- `WebPage`
- `ItemList`
- optional: `CollectionPage`

```ts
import { createGraph, mapWebPage, mapItemList, mapCollectionPage } from '@ranklabs/schema';

export function buildCollectionPageJsonLd(params: { page: WebPageInput; collection: CollectionInput }) {
  return createGraph(
    mapWebPage(params.page),
    mapItemList(params.collection),
    mapCollectionPage(params.collection),
  );
}
```

## Organization + WebSite (sitewide nodes)

Graph nodes:

- `Organization`
- `WebSite`
- optional: SearchAction (via `WebSiteInput.search`)

Use this when you want `Organization` + `WebSite` included on every route.

Return nodes (not a standalone graph) so they can be composed into the page graph:

```ts
import { mapOrganization, mapWebSite } from '@ranklabs/schema';

export function buildSitewideNodes(params: { org: OrganizationInput; site: WebSiteInput }) {
  return [mapOrganization(params.org), mapWebSite(params.site)];
}
```
