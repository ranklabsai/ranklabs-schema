# RankLabs Schema v1 Checklist

See also:

- [Docs index](./index.md)
- [Core package: @ranklabs/schema](./packages/schema.md)
- [Graphs and composition](./concepts/graphs.md)
- [Canonical URLs and stable @id](./concepts/identity.md)
- [Cleaning and validation](./concepts/validation.md)

## Output invariants
- Mappers must return plain JSON-LD nodes without `@context`.
- Graph composition must be centralized in `createGraph()`.
- Single-node context injection must be centralized in `withContext()`.
- All script serialization must go through `toJsonLdString()` or `toJsonLdScriptTag()`.

## Identity and linking
- Every major node should have a stable `@id` derived from canonical URL fragments via `canonicalId.*`.
- Inputs may optionally override IDs via `schemaId` fields; mappers must honor overrides.

## Product / Offer (commerce)
- `Product` must emit `name`, `description`, `image`, and `offers`.
- `Offer` must emit `price`, `priceCurrency`, `availability`.
- Quantity must be represented (including `0`) via `inventoryLevel`.
- Shipping and returns should map to `OfferShippingDetails` and `MerchantReturnPolicy` when provided.

## Content
- `Article` must emit `headline`, `description`, `datePublished`, `dateModified`, `author`.
- `FAQPage` must emit `mainEntity` questions/answers.

## WebSite
- `WebSite` should emit `potentialAction` SearchAction for sitelinks search when configured.

## Regression tests
- Golden tests must validate:
  - No per-mapper `@context`
  - Stable canonical `@id` formation
  - `schemaId` overrides
  - `createGraph()` dedupe and context behavior
