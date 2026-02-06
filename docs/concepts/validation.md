# Cleaning and validation

RankLabs Schema includes opt-in utilities for cleaning and validating JSON-LD.

## Cleaning: `cleanJsonLd()`

`cleanJsonLd(value, opts)` recursively removes values based on options:

- `removeNull`
- `removeEmptyStrings`
- `removeEmptyArrays`
- `removeEmptyObjects`

## Validation: `validateJsonLd()`

`validateJsonLd(value, opts)` returns a list of issues (it does not throw).

What it validates:

- root is an object
- root `@context` is allowed (defaults to `https://schema.org`)
- graph roots use an array `@graph`
- no nested `@context`
- optional checks for `@id` (absolute http/https URL) and `@type` (non-empty string or string[])

What it does NOT validate:

- full Schema.org completeness for specific entity types (e.g. Product rich-results requirements)

## `assertJsonLd()`

`assertJsonLd(value)` throws `JsonLdValidationError` when issues exist.

## `prepareJsonLd()`

`prepareJsonLd(value, { mode })` is the convenience helper:

- runs `cleanJsonLd()`
- runs `validateJsonLd()`
- returns cleaned output

Modes:

- `throw`: throws `JsonLdValidationError` when invalid
- `warn` (default): warns in non-production environments, returns cleaned output
- `silent`: returns cleaned output without warnings

## Strict rendering pipeline

In React adapters:

- build a graph with `createGraph()`
- validate with `prepareJsonLd()`
- render via `JsonLdSchema`

```tsx
import { JsonLdSchema, createGraph, prepareJsonLd, mapWebPage, mapProduct } from '@ranklabs/schema-next';

const graph = createGraph(mapWebPage(page), mapProduct(product));
const safe = prepareJsonLd(graph, { mode: 'throw' });
return <JsonLdSchema data={safe} />;
```
