# Changelog

All notable changes to `@ranklabs/schema`, `@ranklabs/schema-hydrogen`, and
`@ranklabs/schema-next` are documented here. The three packages ship together
at matching minor and major versions.

This project follows [Semantic Versioning](https://semver.org/).

## 1.1.0 (2026-04-19)

Feature release. The most user-visible change: image alt text now lands on
`ImageObject.name` instead of `caption`. Snapshot tests of the JSON-LD output
will need their fixtures updated. Everything else is additive.

### Added

**Core: new public API**

- `validateRichResults(value)`: an opt-in richness validator. Walks a node or
  a `@graph` and reports REQUIRED and RECOMMENDED issues per Schema.org type,
  using Google's rich-result rules as the baseline. Covers Product,
  ProductGroup, Offer, Article (plus BlogPosting, NewsArticle, TechArticle),
  Organization, LocalBusiness, WebSite, SearchAction, AggregateRating,
  BreadcrumbList, FAQPage, Review, WebPage, CollectionPage, ItemList, and
  HowTo. Pair it with `validateJsonLd` (structural) for a full pre-flight.
  Exported from `@ranklabs/schema`.
- `formatRichResultIssues(issues)`: readable formatter for CI logs, matching
  the style of `formatValidationIssues`.
- `RichResultIssue` and `RichResultSeverity` types.

**Core: new mapper**

- `mapHowTo(input: HowToInput)` plus `HowToInput` and `HowToStepInput` types
  for step-based instructional content (care guides, setup walkthroughs,
  tutorials). Supports `steps`, `supplies`, `tools`, `totalTime`,
  `estimatedCost`, and per-step image, video, and url. Adds the
  `canonicalId.howTo(pageUrl)` helper.

**Core: new fields on existing types**

- `OfferInput.availabilityStarts` and `OfferInput.availabilityEnds` (ISO 8601)
  for PreOrder and BackOrder windows. Emitted on the Offer.
- `ProductInput.countryOfOrigin` and `ProductInput.countryOfAssembly`
  (ISO 3166-1 alpha-2). Emitted on the Product as a `Country` node for
  origin, and as a plain string for assembly.
- `ProductInput.audience` (single string, emitted as an `Audience` node with
  `audienceType`), `ProductInput.award` (string or string array).
- `ProductInput.mentions`, `isRelatedTo`, and `isSimilarTo` for entity
  linking. `mentions` is the back-link that closes bidirectional graphs
  (Article `about` a product, Product `mentions` the article).
- `ProductInput.additionalProperties`: freeform `PropertyValue` array for
  specs that don't fit the built-in fields (thread count, certifications,
  material weight, etc.).
- `ProductInput.keywords`: comma-joined topical tags, mirror of
  `ArticleInput.keywords`, for product-focused LLM retrieval.
- `ProductInput.mainEntityOfPage`, `ArticleInput.mainEntityOfPage`,
  `WebPageInput.mainEntityOfPage`: primary-subject signal accepting a URL
  or a WebPage ref, used by LLMs and crawlers to disambiguate which entity
  a multi-entity page is really about.
- `ReviewInput.itemReviewed` and `AggregateRatingInput.itemReviewed`:
  Schema.org-required back-links so LLMs can tie reviews and ratings back
  to the product (or other thing) they describe.
- `ReviewInput.language` and `FAQInput.language`: BCP-47 tags emitted as
  `inLanguage` on the Review and FAQPage, closing a multi-locale gap.
- `CollectionInput.pagination`: `totalItems`, `currentPage`, `totalPages`,
  `previousUrl`, `nextUrl`. The mapper emits `CollectionPage.previousItem`
  and `nextItem` for pagination hints, and `ItemList.numberOfItems` now
  reflects the full collection size when paginated.
- Exported types `MappedProduct` and `MappedProductGroup`: the actual
  return shape of `mapProduct`, including the Thing-inherited fields
  (`mentions`, `isRelatedTo`, `audience`, `hasMeasurement`, etc.) that
  `schema-dts`'s stricter types omit. Removes the need for `as Product`
  casts at call sites.
- `ProductInput.measurements`: structured numeric measurements emitted as
  `hasMeasurement: QuantitativeValue[]` (width, length, weight, screen
  size, etc.). Use alongside or instead of `additionalProperties` when the
  attribute is a number with a unit.
- `ProductInput.certifications`: emitted as `hasCertification:
  Certification[]` with optional `issuedBy` Organization reference. Useful
  for Fair Trade, B Corp, Oeko-Tex, ISO, and similar trust signals.
- `OfferInput.eligibleRegion`: ISO 3166-1 alpha-2 code (or array, or
  free-form region name) for multi-locale storefronts that need to scope
  an offer to specific markets.
- `OrganizationInput.knowsLanguage`: BCP-47 language tag array
  (e.g. `["en-US", "fr-CA"]`).
- `OrganizationInput.areaServed`: country codes or free-form region names.
- `ArticleInput.keywords` (array, emitted comma-joined), `.speakable`
  (SpeakableSpecification selectors for voice and LLM citation),
  `.citations` (EntityReference array for source attribution),
  `.articleSection`, `.wordCount`, `.isAccessibleForFree`, `.isPartOf`
  (links an article to its Blog or series so LLMs and search engines can
  cluster your editorial content).
- `OrganizationInput.publishingPrinciples` (URL to editorial standards, an
  E-E-A-T signal) and `.award` (string or string array).
- `WebPageInput.lastReviewed` (ISO 8601 freshness signal distinct from
  `dateModified`), `WebPageInput.speakable` (same shape as on Article).
- `ImageInput.creditText` for photographer or source attribution.
- BCP-47 JSDoc guidance on `ArticleInput.language` and
  `WebPageInput.language`.

**Core: utilities**

- `stripHtmlForSchema(html, { mode })`: dependency-free HTML stripper with
  `'plain-text'` (default) and `'google-faq'` (keeps Google's FAQPage
  allowlist) modes. Drops `<script>` and `<style>` contents, decodes the
  standard HTML entities, and collapses whitespace. Meant for trusted CMS
  sources, not untrusted input.
- `stripLocalePrefix(urlOrPath, locale)` and
  `detectLocale(urlOrPath, supportedLocales)`: multi-locale URL helpers for
  integration code that needs consistent canonical `@id`s across
  `/us/...`, `/au/...`, etc.

**Core: dev-mode warnings (silent in production)**

All routed through a shared `devWarn` helper that checks `NODE_ENV`:

- Unknown `Offer.availability` values (falls back to `InStock`).
- Unknown `Offer.itemCondition` values (falls back to `NewCondition`).
- `SearchAction.target` missing the placeholder token declared by
  `queryInput` (default `{search_term_string}`).
- `Article.publisher` typed as Person (Google requires Organization).
- `Article.publisher` missing `image`/`logo` (required for Article rich
  results).
- First `mapFAQPage` call: reminds you that Google restricts FAQ rich
  results to gov and health sites since Aug 2023. Other engines and LLMs
  still ingest FAQPage.

**Other**

- Comprehensive JSDoc on `FAQInput.answer` describing Google's allowed HTML
  subset and the need to sanitize CMS input.

### Changed

- **Output-shape change**: `mapImage` now emits alt text on
  `ImageObject.name` (semantically correct per Schema.org) instead of
  `caption`. If the caller sets `ImageInput.caption` explicitly for a
  long-form description, the mapper emits that on `caption` alongside
  `name`. Crawlers and LLMs already prefer `name` for alt semantics, so
  this is a correctness fix, but downstream code reading the JSON-LD
  directly for `caption` will need to read `name` instead.
- `validateJsonLd` behavior is unchanged. Continue using it for structural
  checks. Use `validateRichResults` for semantic and richness checks.
- `cleanJsonLd` behavior is unchanged. The JSDoc now warns more loudly that
  `removeEmptyStrings: true` can strip required fields.

### Deprecated

All per-entity React components in `@ranklabs/schema-hydrogen` and
`@ranklabs/schema-next`: `ProductSchema`, `ArticleSchema`,
`OrganizationSchema`, `WebSiteSchema`, `WebPageSchema`,
`BreadcrumbListSchema`, `CollectionPageSchema`, `ItemListSchema`,
`FAQPageSchema`, `SoftwareApplicationSchema`, `OfferSchema`,
`AggregateRatingSchema`, `ReviewSchema`, `BrandSchema`, `ImageSchema`,
`VideoSchema`. Marked with `@deprecated` JSDoc. Prefer
`<GraphSchema nodes={[...]} />` so a single `@graph` per page can dedupe
`@id`s and share context. The individual components still work for
backward compatibility, but they emit separate `<script>` blocks with
duplicated `@context`.

### Security and robustness (bug-fix sweep)

- **Attribute injection in `toJsonLdScriptTag`**: the `id` and `nonce`
  options are now HTML-escaped before being interpolated into attributes.
  Previously, a caller passing user-controlled input to those options
  could break out of the attribute and inject arbitrary HTML. Regression
  test locked in.
- **Dangerous URL protocols rejected**: `canonicalizeUrl` now throws a
  `TypeError` on `javascript:`, `data:`, `file:`, and `vbscript:` URLs.
  Previously, these would flow through into JSON-LD `@id` / `url` /
  `sameAs` fields and create an open-redirect / link-injection risk for
  consumers that render URLs as hyperlinks.
- **`mapCondition` omits the field when not set**: `Offer.itemCondition`
  is now `undefined` in output when the input was not provided, instead
  of lying about the product being `NewCondition`. Unknown non-empty
  values still fall back to `NewCondition` with a dev warning.
- **`mapAvailability` rejects non-string input**: `null`, `undefined`,
  empty string, or an object now warn in dev and fall back safely to
  `InStock` instead of coercing to `"null"` / `"[object Object]"` and
  silently hitting the default branch.
- **`mapProduct` defensive guards**: `offers: undefined` from untyped
  adapter data no longer crashes; the field is omitted and
  `validateRichResults` flags the missing offer. `brand: null` / `''`
  similarly omits the field instead of throwing.
- **`stripHtmlForSchema` handles unclosed `<script>` / `<style>`**: a
  second-pass regex now removes openings that lack a matching close tag,
  so content after `<script>alert(1)` is stripped even if the close tag
  was dropped by truncation.

### Fixed

- `mapSearchAction` now includes a dev-mode check that the `target` URL
  template contains the placeholder token declared by `queryInput` (default
  `{search_term_string}`). Silent in production.
- `validateRichResults` walker skips pure entity-reference nodes (nodes
  with `@id` and only identity fields) so cross-referenced Organizations or
  People in publisher and author roles don't get flagged for missing logo
  when the full entity is defined elsewhere in the graph.
- `mapProduct` no longer uses `as Product` / `as ProductGroup` casts. The
  return type is now the precise `MappedProduct | MappedProductGroup`
  intersection, so consumers get full IntelliSense on emitted fields like
  `mentions`, `hasMeasurement`, and `hasCertification` without widening.
- `stripContext` in `jsonld.ts` tightened to use `Record<string, unknown>`
  instead of `any`.
- Test-only reset hooks `__resetFaqWarningForTests` and
  `__resetCanonicalizationWarningsForTests` are exported from the core
  package so downstream test suites can isolate module-state dev warnings
  deterministically. These are marked `@internal`.

### Removed

- Dropped the `@shopify/hydrogen` optional peer dependency from
  `@ranklabs/schema-hydrogen`. The package doesn't import from Hydrogen,
  so the peer was cosmetic. The package still works inside a Hydrogen
  storefront; it just doesn't require one.

### Testing

- `packages/core/test/v1-1-features.test.ts`: 45 tests covering every new
  public API surface and per-type rich-result rule, including recursion and
  graph-level walking.
- `packages/core/test/v1-1-additions.test.ts`: 56 tests covering Article
  keywords, speakable, citations, articleSection, wordCount,
  isAccessibleForFree, isPartOf; Product audience, mentions, award,
  additionalProperties, measurements, certifications; Offer.eligibleRegion;
  Organization publishingPrinciples, award, knowsLanguage, areaServed;
  WebPage.lastReviewed and speakable; ImageObject.creditText; the HowTo
  mapper and its rich-result rule; and the locale / HTML utilities
  (including edge cases).
- `packages/core/test/dev-warnings.test.ts`: 11 tests spying on
  `console.warn` to verify dev warnings fire under `NODE_ENV=development`
  and stay silent under `NODE_ENV=production`.
- `packages/hydrogen/test/ssr.test.ts`: 7 SSR tests using
  `react-dom/server` to verify `GraphSchema` and `JsonLdSchema` render into
  the initial HTML payload, dedupe by `@id`, handle null and undefined
  nodes, and escape `</script>` sequences to prevent tag breakouts.
- `packages/next/test/ssr.test.ts`: 1 SSR parity test for the Next adapter
  (same internals as hydrogen).
- Golden fixture JSON files updated to reflect the `name` / `caption` image
  mapping change.

- `packages/core/test/v1-1-polish.test.ts`: 18 tests covering the final
  polish round (MappedProduct / MappedProductGroup types, `itemReviewed`
  back-links, Review / FAQ language, `mainEntityOfPage` on all three
  entity types, Product.keywords, CollectionPage pagination, reset hooks).

- `packages/core/test/bug-fixes.test.ts`: 21 regression tests covering
  each of the security / robustness fixes above.

Total: 181 tests across 10 files.

## 1.0.3 (prior releases)

Initial public release history. See git log for details.
