import React from 'react';
import {
  mapAggregateRating,
  mapArticle,
  mapBrand,
  mapBreadcrumbList,
  mapCollectionPage,
  mapFAQPage,
  mapImage,
  mapItemList,
  mapOffer,
  mapOrganization,
  mapProduct,
  mapReview,
  mapSaaS,
  mapVideo,
  mapWebPage,
  mapWebSite,
  withContext,
  type AggregateRatingInput,
  type ArticleInput,
  type BrandInput,
  type BreadcrumbInput,
  type CollectionInput,
  type FAQInput,
  type ImageInput,
  type OfferInput,
  type OrganizationInput,
  type ProductInput,
  type ReviewInput,
  type SaaSInput,
  type VideoInput,
  type WebPageInput,
  type WebSiteInput,
} from '@ranklabs/schema';
import { RenderJsonLd } from './render';

/**
 * The per-entity components below are retained for backward compatibility but
 * are deprecated in favor of `GraphSchema`. Each component below emits its own
 * `<script>` with a duplicated `@context`; a page using several of them ships
 * multiple JSON-LD blocks that cannot share `@id`s. `GraphSchema` takes an
 * array of nodes, composes them into a single `@graph`, and dedupes. That
 * is the intended architecture of this package.
 *
 * Migrate with:
 *   <ProductSchema data={p} />
 *   →  <GraphSchema nodes={[mapProduct(p)]} />
 */

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function ProductSchema({ data, id }: { data: ProductInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-product',
    data: withContext(mapProduct(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function SoftwareApplicationSchema({ data, id }: { data: SaaSInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-saas',
    data: withContext(mapSaaS(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function OfferSchema({ data, id }: { data: OfferInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-offer',
    data: withContext(mapOffer(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function AggregateRatingSchema({ data, id }: { data: AggregateRatingInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-aggregate-rating',
    data: withContext(mapAggregateRating(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function ReviewSchema({ data, id }: { data: ReviewInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-review',
    data: withContext(mapReview(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function ArticleSchema({ data, id }: { data: ArticleInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-article',
    data: withContext(mapArticle(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function FAQPageSchema({ data, id }: { data: FAQInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-faq',
    data: withContext(mapFAQPage(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function WebSiteSchema({ data, id }: { data: WebSiteInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-website',
    data: withContext(mapWebSite(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function OrganizationSchema({ data, id }: { data: OrganizationInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-organization',
    data: withContext(mapOrganization(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function WebPageSchema({ data, id }: { data: WebPageInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-webpage',
    data: withContext(mapWebPage(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function BreadcrumbListSchema({ data, id }: { data: BreadcrumbInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-breadcrumbs',
    data: withContext(mapBreadcrumbList(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function CollectionPageSchema({ data, id }: { data: CollectionInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-collection-page',
    data: withContext(mapCollectionPage(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function ItemListSchema({ data, id }: { data: CollectionInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-itemlist',
    data: withContext(mapItemList(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function BrandSchema({ data, id }: { data: BrandInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-brand',
    data: withContext(mapBrand(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function ImageSchema({ data, id }: { data: ImageInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-image',
    data: withContext(mapImage(data)),
  });
}

/** @deprecated Prefer `GraphSchema` with an array of nodes. */
export function VideoSchema({ data, id }: { data: VideoInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-video',
    data: withContext(mapVideo(data)),
  });
}
