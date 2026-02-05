/**
 * SCHEMA.ORG CONSTANTS
 * Centralized registry of magic strings and standardized URLs.
 */

export const SCHEMA_CONTEXT = 'https://schema.org';

// 1. AVAILABILITY
export const AVAILABILITY = {
  IN_STOCK: 'https://schema.org/InStock',
  OUT_OF_STOCK: 'https://schema.org/OutOfStock',
  PRE_ORDER: 'https://schema.org/PreOrder',
  BACK_ORDER: 'https://schema.org/BackOrder',
  DISCONTINUED: 'https://schema.org/Discontinued',
} as const;

// 2. ITEM CONDITIONS
export const CONDITION = {
  NEW: 'https://schema.org/NewCondition',
  USED: 'https://schema.org/UsedCondition',
  REFURBISHED: 'https://schema.org/RefurbishedCondition',
  DAMAGED: 'https://schema.org/DamagedCondition',
} as const;

// 3. RETURN POLICIES
export const RETURN_FEES = {
  FREE_RETURN: 'https://schema.org/FreeReturn',
  CUSTOMER_RESPONSIBILITY: 'https://schema.org/ReturnFeesCustomerResponsibility',
  RETURN_SHIPPING_FEES: 'https://schema.org/ReturnShippingFees',
} as const;

export const RETURN_METHOD = {
  BY_MAIL: 'https://schema.org/ReturnByMail',
  IN_STORE: 'https://schema.org/ReturnInStore',
  AT_KIOSK: 'https://schema.org/ReturnAtKiosk',
} as const;

// 4. LIST ORDERING
export const ITEM_LIST_ORDER = {
  ASCENDING: 'https://schema.org/ItemListOrderAscending',
  DESCENDING: 'https://schema.org/ItemListOrderDescending',
  UNORDERED: 'https://schema.org/ItemListUnordered',
} as const;

// 5. CONTACT POINT OPTIONS
export const CONTACT_OPTION = {
  TOLL_FREE: 'TollFree',
  HEARING_IMPAIRED: 'HearingImpairedSupported',
} as const;