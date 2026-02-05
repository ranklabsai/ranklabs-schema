# RankLabs Schema v1 Spec

## Goals
- Stable, authority-grade Schema.org JSON-LD output suitable for:
  - Search (Google rich results)
  - Agent consumption (LLMs)
- Centralized graph + context composition.
- Stable, canonical, URL-derived `@id` values with optional `schemaId` overrides.

## JSON-LD composition rules
- Core mappers return plain JSON-LD nodes (no `@context`).
- `createGraph()` is the default for multi-node pages.
- `withContext()` is reserved for single-node embedding.

## Identity (`@id`) rules
- If `schemaId` is provided on an input, it must be used as `@id`.
- Otherwise, `@id` is derived from canonical URLs using `canonicalId.*`.
  - Canonicalization strips hash fragments, known tracking params, and sorts query params.

## Page archetypes (fixtures)
- WebSite (homepage root)
  - `mapWebSite()` emits WebSite + optional SearchAction.
- Product page (commerce)
  - `mapProduct()` emits Product (or ProductGroup when variants exist).
  - A full product page graph should include `mapWebPage()` + `mapProduct()`.
- Collection page
  - `mapCollectionPage()` emits CollectionPage with `mainEntity` ItemList.
- FAQ page
  - `mapFAQPage()` emits FAQPage with mainEntity questions.
- Article page
  - `mapArticle()` emits Article/BlogPosting.
- SaaS/App page
  - `mapSaaS()` emits SoftwareApplication with subscription Offer.

## Regression policy
- Golden fixtures must be updated only when output changes are intentional.
- Any change that breaks fixtures should be treated as a versioning decision (additive vs breaking).
