# Graphs and composition

Most real pages have multiple entities: `WebPage`, `Product`, `Organization`, breadcrumbs, etc.

RankLabs Schema is graph-first.

## Core rules

- Mappers return JSON-LD nodes without `@context`.
- Use `createGraph()` to build a single graph for a page.
- Use `withContext()` only when embedding a single node.

## `createGraph()`

`createGraph(...nodes)` returns:

- `{ "@context": "https://schema.org", "@graph": [...] }`

It also:

- Flattens nested arrays of nodes
- Strips nested `@context` from nodes
- Dedupes nodes by `@id` (first occurrence wins)

## Why graphs instead of separate JSON-LD blocks?

Schema.org allows multiple JSON-LD scripts per page, but multiple independent blocks often lead to:

- implicit or duplicated identity
- ambiguous relationships
- duplicated entities across routes or plugins

A single `@graph` makes identity explicit and relationships resolvable.

As a best practice, render **one JSON-LD graph per page** and compose:

- sitewide entities (`Organization`, `WebSite`)
- page-specific entities (`WebPage`, `Product`, `ItemList`, etc.)

into a single `@graph`, rather than emitting separate JSON-LD blocks.

## Adapter usage

Both adapters expose the same composition pattern:

- `GraphSchema` builds a graph internally (recommended)
- `JsonLdSchema` renders pre-built JSON-LD (advanced)

## Example

```ts
import { createGraph, mapWebPage, mapProduct } from '@ranklabs/schema';

const graph = createGraph(mapWebPage(page), mapProduct(product));
```
