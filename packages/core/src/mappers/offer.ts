import type { 
  Offer, 
  MerchantReturnPolicy, 
  OfferShippingDetails, 
  ShippingDeliveryTime,
  UnitPriceSpecification,
  ItemAvailability,
  OfferItemCondition,
  DefinedRegion
} from 'schema-dts';
import type { OfferInput, ShippingInput, ReturnPolicyInput } from '../types';
import { canonicalId } from '../id';
import {
  AVAILABILITY,
  CONDITION,
  RETURN_FEES,
  RETURN_METHOD,
} from '../constants';

/**
 * MAP OFFER
 */
export function mapOffer(input: OfferInput): Offer {
  const activePrice = input.salePrice ?? input.price;
  const strikethroughPrice =
    input.strikethroughPrice ?? (input.salePrice !== undefined ? input.price : undefined);

  const priceSpecification = mapPriceSpecification(
    typeof strikethroughPrice === 'string' || typeof strikethroughPrice === 'number'
      ? strikethroughPrice
      : undefined,
    input.currency,
  );

  return {
    '@type': 'Offer',
    '@id': input.schemaId || (input.url ? canonicalId.offer(input.url) : undefined),
    url: input.url,
    price: activePrice,
    priceCurrency: input.currency,
    priceSpecification,
    
    availability: mapAvailability(input.availability),
    itemCondition: mapCondition(input.itemCondition),
    
    inventoryLevel:
      typeof input.quantity === 'number'
        ? {
            '@type': 'QuantitativeValue',
            value: input.quantity,
          }
        : undefined,

    priceValidUntil: input.priceValidUntil,

    shippingDetails: input.shipping ? mapShipping(input.shipping, input.shipsFrom) : undefined,
    hasMerchantReturnPolicy: input.returns ? mapReturns(input.returns) : undefined,
  };
}

function mapPriceSpecification(
  strikethroughPrice: string | number | undefined,
  currency: string,
): UnitPriceSpecification | undefined {
  if (strikethroughPrice === undefined) return undefined;
  return {
    '@type': 'UnitPriceSpecification',
    price: strikethroughPrice,
    priceCurrency: currency,
    priceType: 'https://schema.org/StrikethroughPrice',
  } as UnitPriceSpecification;
}

/**
 * HELPER: AVAILABILITY
 */
function mapAvailability(status: OfferInput['availability']): ItemAvailability {
  const map: Record<string, ItemAvailability> = {
    'InStock': AVAILABILITY.IN_STOCK,
    'OutOfStock': AVAILABILITY.OUT_OF_STOCK,
    'PreOrder': AVAILABILITY.PRE_ORDER,
    'BackOrder': AVAILABILITY.BACK_ORDER,
    'Discontinued': AVAILABILITY.DISCONTINUED,
  };
  return map[status] || 'https://schema.org/InStock';
}

/**
 * HELPER: CONDITION
 */
function mapCondition(condition?: string): OfferItemCondition | undefined {
  if (!condition) return CONDITION.NEW;
  
  const map: Record<string, OfferItemCondition> = {
    'New': CONDITION.NEW,
    'Used': CONDITION.USED,
    'Refurbished': CONDITION.REFURBISHED,
    'Damaged': CONDITION.DAMAGED,
  };
  return map[condition] || CONDITION.NEW;
}

/**
 * HELPER: SHIPPING
 */
function mapShipping(
  input: ShippingInput,
  shipsFrom?: OfferInput['shipsFrom'],
): OfferShippingDetails {
  let deliveryTime: ShippingDeliveryTime | undefined;
  
  if (input.deliveryTime || input.handlingTime) {
    deliveryTime = {
      '@type': 'ShippingDeliveryTime',
      handlingTime: input.handlingTime
        ? {
            '@type': 'QuantitativeValue',
            unitCode: 'DAY',
            minValue: input.handlingTime.minDays,
            maxValue: input.handlingTime.maxDays,
          }
        : {
            '@type': 'QuantitativeValue',
            unitCode: 'DAY',
            value: 0,
          },
      transitTime: input.deliveryTime
        ? {
            '@type': 'QuantitativeValue',
            unitCode: 'DAY',
            minValue: input.deliveryTime.minDays,
            maxValue: input.deliveryTime.maxDays,
          }
        : undefined,
    };
  }

  return {
    '@type': 'OfferShippingDetails',
    shippingOrigin: shipsFrom ? mapDefinedRegion(shipsFrom) : undefined,
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: input.cost,
      currency: input.currency || 'USD',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: input.destinations,
    },
    deliveryTime,
  };
}

/**
 * HELPER: RETURNS
 */
function mapReturns(input: ReturnPolicyInput): MerchantReturnPolicy {
  const category = input.returnPolicyCategory
    ? mapReturnPolicyCategory(input.returnPolicyCategory)
    : input.type === 'FullRefund' || input.type === 'ExchangeOnly' || input.type === 'StoreCredit'
      ? 'https://schema.org/MerchantReturnFiniteReturnWindow'
      : undefined;

  const merchantReturnDays = input.merchantReturnDays ?? input.returnWindowDays ?? input.days;
  const returnFees = input.returnFees ? mapReturnFees(input.returnFees) : undefined;
  const returnMethod = input.returnMethod ? mapReturnMethod(input.returnMethod) : RETURN_METHOD.BY_MAIL;
  const merchantReturnLink = input.merchantReturnLink ?? input.returnPolicyUrl;
  const refundType = mapRefundType(input.refundType ?? input.type);

  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: input.applicableCountry,
    returnPolicyCategory: category,
    merchantReturnDays,
    merchantReturnLink,
    returnFees,
    returnMethod,
    refundType,
    returnShippingFeesAmount: input.returnShippingFeesAmount
      ? {
          '@type': 'MonetaryAmount',
          value: input.returnShippingFeesAmount.amount,
          currency: input.returnShippingFeesAmount.currency,
        }
      : undefined,
  } as MerchantReturnPolicy;
}

function mapRefundType(input: ReturnPolicyInput['type'] | ReturnPolicyInput['refundType']): string | undefined {
  if (!input) return undefined;
  const map: Record<string, string> = {
    FullRefund: 'https://schema.org/FullRefund',
    ExchangeOnly: 'https://schema.org/ExchangeRefund',
    StoreCredit: 'https://schema.org/StoreCreditRefund',
  };
  return map[input] || undefined;
}

function mapDefinedRegion(input: OfferInput['shipsFrom']): DefinedRegion {
  return {
    '@type': 'DefinedRegion',
    addressCountry: input?.addressCountry,
    addressRegion: input?.addressRegion,
    postalCode: input?.postalCode,
  } as DefinedRegion;
}

function mapReturnPolicyCategory(
  input: NonNullable<ReturnPolicyInput['returnPolicyCategory']>,
): string {
  const map: Record<string, string> = {
    FiniteReturnWindow: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    UnlimitedReturnWindow: 'https://schema.org/MerchantReturnUnlimitedWindow',
    NotPermitted: 'https://schema.org/MerchantReturnNotPermitted',
  };
  return map[input] || 'https://schema.org/MerchantReturnFiniteReturnWindow';
}

function mapReturnFees(input: NonNullable<ReturnPolicyInput['returnFees']>): string {
  const map: Record<string, string> = {
    FreeReturn: RETURN_FEES.FREE_RETURN,
    ReturnFeesCustomerResponsibility: RETURN_FEES.CUSTOMER_RESPONSIBILITY,
    ReturnShippingFees: RETURN_FEES.RETURN_SHIPPING_FEES,
  };
  return map[input] || RETURN_FEES.CUSTOMER_RESPONSIBILITY;
}

function mapReturnMethod(input: NonNullable<ReturnPolicyInput['returnMethod']>): string | string[] {
  const normalizeOne = (v: string): string => {
    const map: Record<string, string> = {
      ReturnByMail: RETURN_METHOD.BY_MAIL,
      ReturnInStore: RETURN_METHOD.IN_STORE,
      ReturnAtKiosk: RETURN_METHOD.AT_KIOSK,
    };
    return map[v] || RETURN_METHOD.BY_MAIL;
  };

  if (Array.isArray(input)) {
    return input.map(normalizeOne);
  }

  return normalizeOne(input);
}