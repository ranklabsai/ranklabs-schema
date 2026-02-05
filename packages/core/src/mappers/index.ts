/**
 * RANKLABS MAPPERS
 * Pure functions that transform RankLabs Input -> Schema.org JSON-LD
 */

// 1. Commercial Mappers
export { mapProduct } from './product';
export { mapOffer } from './offer';
export { mapReview, mapAggregateRating } from './review';
export { mapCollectionPage, mapItemList } from './collection';

// 2. Content Mappers
export { mapArticle } from './article';
export { mapFAQPage } from './faq';

// 3. Core & Identity Mappers
export { mapOrganization } from './organization';
export { mapWebSite } from './website';
export { mapWebPage, mapBreadcrumbList } from './page';
export { mapImage, mapVideo } from './media';
export { mapBrand } from './brand';

// 4. Software Mappers
export { mapSaaS } from './saas';