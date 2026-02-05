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

export function ProductSchema({ data, id }: { data: ProductInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-product',
    data: withContext(mapProduct(data)),
  });
}

export function SoftwareApplicationSchema({ data, id }: { data: SaaSInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-saas',
    data: withContext(mapSaaS(data)),
  });
}

export function OfferSchema({ data, id }: { data: OfferInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-offer',
    data: withContext(mapOffer(data)),
  });
}

export function AggregateRatingSchema({ data, id }: { data: AggregateRatingInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-aggregate-rating',
    data: withContext(mapAggregateRating(data)),
  });
}

export function ReviewSchema({ data, id }: { data: ReviewInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-review',
    data: withContext(mapReview(data)),
  });
}

export function ArticleSchema({ data, id }: { data: ArticleInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-article',
    data: withContext(mapArticle(data)),
  });
}

export function FAQPageSchema({ data, id }: { data: FAQInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-faq',
    data: withContext(mapFAQPage(data)),
  });
}

export function WebSiteSchema({ data, id }: { data: WebSiteInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-website',
    data: withContext(mapWebSite(data)),
  });
}

export function OrganizationSchema({ data, id }: { data: OrganizationInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-organization',
    data: withContext(mapOrganization(data)),
  });
}

export function WebPageSchema({ data, id }: { data: WebPageInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-webpage',
    data: withContext(mapWebPage(data)),
  });
}

export function BreadcrumbListSchema({ data, id }: { data: BreadcrumbInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-breadcrumbs',
    data: withContext(mapBreadcrumbList(data)),
  });
}

export function CollectionPageSchema({ data, id }: { data: CollectionInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-collection-page',
    data: withContext(mapCollectionPage(data)),
  });
}

export function ItemListSchema({ data, id }: { data: CollectionInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-itemlist',
    data: withContext(mapItemList(data)),
  });
}

export function BrandSchema({ data, id }: { data: BrandInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-brand',
    data: withContext(mapBrand(data)),
  });
}

export function ImageSchema({ data, id }: { data: ImageInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-image',
    data: withContext(mapImage(data)),
  });
}

export function VideoSchema({ data, id }: { data: VideoInput; id?: string }) {
  return React.createElement(RenderJsonLd, {
    id: id || 'schema-video',
    data: withContext(mapVideo(data)),
  });
}
