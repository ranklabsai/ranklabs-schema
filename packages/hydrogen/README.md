# @ranklabs/schema-hydrogen

Hydrogen adapter for `@ranklabs/schema`.

This package renders JSON-LD as a `<script type="application/ld+json">` tag, using the same core mappers and types from `@ranklabs/schema`.

## Install

```bash
pnpm add @ranklabs/schema @ranklabs/schema-hydrogen
```

## Requirements

- React: `>=18`
- Hydrogen: `>=2025.x` (optional peer)

## Usage

### Recommended: render a graph (most routes)

```tsx
import { GraphSchema } from '@ranklabs/schema-hydrogen';
import { mapWebPage, mapProduct, type ProductInput, type WebPageInput } from '@ranklabs/schema';

export function MySchema({ page, product }: { page: WebPageInput; product: ProductInput }) {
  return <GraphSchema nodes={[mapWebPage(page), mapProduct(product)]} />;
}
```

### Render a single node

```tsx
import { OrganizationSchema } from '@ranklabs/schema-hydrogen';
import type { OrganizationInput } from '@ranklabs/schema-hydrogen';

export function MyOrgJsonLd({ org }: { org: OrganizationInput }) {
  return <OrganizationSchema data={org} />;
}
```

## Components

- `GraphSchema`
- `JsonLdSchema`
- Typed convenience components
  - `ProductSchema`
  - `SoftwareApplicationSchema`
  - `OfferSchema`
  - `AggregateRatingSchema`
  - `ReviewSchema`
  - `ArticleSchema`
  - `FAQPageSchema`
  - `WebSiteSchema`
  - `OrganizationSchema`
  - `WebPageSchema`
  - `BreadcrumbListSchema`

## Notes

- This adapter is intentionally thin. The source of truth is always `@ranklabs/schema`.
- Hydrogen is an optional peer dependency so this package can be used in non-Hydrogen React environments too.
