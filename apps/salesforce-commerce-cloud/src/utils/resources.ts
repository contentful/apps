export type FieldType =
  | 'product'
  | 'category'
  | 'customerGroup'
  | 'promotion'
  | 'campaign'
  | 'coupon'
  | 'store';

// Resources served by the generic searchResource/fetchResource function actions.
export type ResourceType = Exclude<FieldType, 'product' | 'category'>;

export type LocalizedText = Record<string, string>;

// Union of the summaries returned by the sfccApi function; see functions/index.ts.
export interface SfccItem {
  id: string;
  catalogId?: string;
  name?: LocalizedText | string;
  description?: string;
  image?: { absUrl?: string; alt?: LocalizedText };
  price?: number;
  priceCurrency?: string;
  online?: boolean;
  inStock?: boolean;
  ats?: number;
  isVariant?: boolean;
  variationValues?: Record<string, string>;
  enabled?: boolean;
  archived?: boolean;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  couponType?: string;
  code?: string;
  memberCount?: number;
  groupType?: string;
  address?: string;
  storeLocatorEnabled?: boolean;
}

export interface ScopeOptions {
  siteId?: string;
  catalogId?: string;
  includeVariants?: boolean;
}

export interface SearchPage {
  items: SfccItem[];
  nextOffset?: number;
}

const LABELS: Record<FieldType, { singular: string; plural: string }> = {
  product: { singular: 'product', plural: 'products' },
  category: { singular: 'category', plural: 'categories' },
  customerGroup: { singular: 'customer group', plural: 'customer groups' },
  promotion: { singular: 'promotion', plural: 'promotions' },
  campaign: { singular: 'campaign', plural: 'campaigns' },
  coupon: { singular: 'coupon', plural: 'coupons' },
  store: { singular: 'store', plural: 'stores' },
};

export const isResourceType = (fieldType: FieldType): fieldType is ResourceType =>
  fieldType !== 'product' && fieldType !== 'category';

export const labelFor = (fieldType: FieldType) => LABELS[fieldType] ?? LABELS.product;

export const makeSelectText = (selectMultiple: boolean, fieldType: FieldType) => {
  const label = labelFor(fieldType);
  return selectMultiple ? `Select ${label.plural}` : `Select a ${label.singular}`;
};

// Categories are stored as `catalogId:categoryId`; everything else by its plain ID.
export const itemKey = (fieldType: FieldType, item: SfccItem) =>
  fieldType === 'category' ? `${item.catalogId}:${item.id}` : item.id;

/**
 * Resolves SFCC localized text for a Contentful locale. SFCC keys localized values by its
 * own locale IDs (`en_US`, `en`, `default`), so try the closest matches before falling back.
 */
export function localize(text: LocalizedText | string | undefined, locale?: string) {
  if (!text) return undefined;
  if (typeof text === 'string') return text;

  const candidates: string[] = [];
  if (locale) {
    candidates.push(locale, locale.replace('-', '_'), locale.split(/[-_]/)[0]);
  }
  candidates.push('default');

  for (const key of candidates) {
    if (text[key]) return text[key];
  }
  return Object.values(text).find(Boolean);
}

export function formatPrice(price?: number, currency?: string) {
  if (price === undefined || price === null) return undefined;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  } catch {
    return `${price} ${currency ?? ''}`.trim();
  }
}

/** Display title and secondary detail line for an item, per field type. */
export function describeItem(fieldType: FieldType, item: SfccItem, locale?: string) {
  const name = localize(item.name, locale);
  switch (fieldType) {
    case 'product': {
      const variation = item.variationValues
        ? Object.values(item.variationValues).filter(Boolean).join(' / ')
        : '';
      const price = formatPrice(item.price, item.priceCurrency);
      return {
        title: name || 'Untitled Product',
        detail: [variation, price].filter(Boolean).join(' · '),
      };
    }
    case 'category':
      return { title: name || 'Untitled Category', detail: `Catalog: ${item.catalogId}` };
    case 'customerGroup':
      return {
        title: item.id,
        detail: [
          item.description,
          item.groupType,
          item.memberCount !== undefined ? `${item.memberCount} members` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      };
    case 'promotion':
      return { title: name || item.id, detail: '' };
    case 'campaign':
      return {
        title: item.description || item.id,
        detail: [formatDate(item.startDate), formatDate(item.endDate)].filter(Boolean).join(' – '),
      };
    case 'coupon':
      return {
        title: item.description || item.id,
        detail: [item.code ? `Code: ${item.code}` : '', item.couponType]
          .filter(Boolean)
          .join(' · '),
      };
    case 'store':
      return { title: name || item.id, detail: item.address || '' };
    default:
      return { title: name || item.id, detail: '' };
  }
}

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export type ItemStatus = { variant: 'negative' | 'warning'; label: string };

/**
 * Problems an editor should know about before publishing: the reference still resolves,
 * but the storefront would not show it (offline, expired, disabled, out of stock...).
 */
export function getItemStatus(
  fieldType: FieldType,
  item: SfccItem,
  now = new Date()
): ItemStatus[] {
  const statuses: ItemStatus[] = [];
  const startsLater = item.startDate && new Date(item.startDate) > now;
  const ended = item.endDate && new Date(item.endDate) < now;

  switch (fieldType) {
    case 'product':
      if (item.online === false) statuses.push({ variant: 'negative', label: 'Offline' });
      if (item.inStock === false) statuses.push({ variant: 'warning', label: 'Out of stock' });
      break;
    case 'category':
      if (item.online === false) statuses.push({ variant: 'negative', label: 'Offline' });
      break;
    case 'promotion':
      if (item.archived) statuses.push({ variant: 'negative', label: 'Archived' });
      if (item.enabled === false) statuses.push({ variant: 'negative', label: 'Disabled' });
      if (item.active === false) statuses.push({ variant: 'warning', label: 'Not active' });
      break;
    case 'campaign':
      if (item.enabled === false) statuses.push({ variant: 'negative', label: 'Disabled' });
      if (ended) statuses.push({ variant: 'negative', label: 'Ended' });
      if (startsLater) statuses.push({ variant: 'warning', label: 'Not started' });
      break;
    case 'coupon':
      if (item.enabled === false) statuses.push({ variant: 'negative', label: 'Disabled' });
      break;
    case 'store':
      if (item.storeLocatorEnabled === false)
        statuses.push({ variant: 'warning', label: 'Hidden from store locator' });
      break;
  }
  return statuses;
}
