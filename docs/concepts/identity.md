# Canonical URLs and stable `@id`

RankLabs Schema treats stable identity as a first-class concern.

## Canonical URLs

Use canonical URLs to avoid duplicate IDs caused by:

- tracking parameters (`utm_*`, `gclid`, etc.)
- query ordering differences
- inconsistent host casing

Core exports:

- `canonicalizeUrl(url)`
- `canonicalizeUrlString(url)`

## Stable IDs via `canonicalId.*`

Core exports `canonicalId.*` helpers that generate fragment-based IDs from canonical URLs.

Examples:

- `canonicalId.webpage(url)` -> `https://example.com/products/x#webpage`
- `canonicalId.product(url)` -> `https://example.com/products/x#product`

## Mapper behavior

Most mappers follow this rule:

- if `schemaId` is provided on an input, it is used as `@id`
- otherwise, a canonical URL-derived `@id` is generated

## Example

```ts
import { mapProduct } from '@ranklabs/schema';

// @id becomes: https://example.com/products/test-product#product
const node = mapProduct(product);
```
