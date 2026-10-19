import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

// Resources beyond products/categories. Each is a plain ID reference with a small summary.
type Resource = 'customerGroup' | 'promotion' | 'campaign' | 'coupon' | 'store';

// Field-level overrides passed through from the field's instance parameters.
interface ScopeOptions {
  siteId?: string;
  catalogId?: string;
  includeVariants?: boolean;
}

type Action =
  | ({ type: 'searchProducts'; query?: string } & ScopeOptions)
  | ({ type: 'searchCategories'; query?: string } & ScopeOptions)
  | ({ type: 'fetchProduct'; productId: string } & ScopeOptions)
  | ({ type: 'fetchCategory'; catalogId: string; categoryId: string } & ScopeOptions)
  | ({ type: 'searchResource'; resource: Resource; query?: string; offset?: number } & ScopeOptions)
  | ({ type: 'fetchResource'; resource: Resource; resourceId: string } & ScopeOptions);

interface InstallationParameters {
  clientId: string;
  clientSecret: string;
  organizationId: string;
  shortCode: string;
  siteId: string;
}

type SfccLocalizedText = Record<string, string>;

interface SfccImage {
  absUrl?: string;
  alt?: SfccLocalizedText;
}

interface ProductSummary {
  id: string;
  name?: SfccLocalizedText;
  image?: SfccImage;
  price?: number;
  priceCurrency?: string;
  online?: boolean;
  inStock?: boolean;
  ats?: number;
  isVariant?: boolean;
  variationValues?: Record<string, string>;
}

interface CategorySummary {
  id: string;
  catalogId?: string;
  name?: SfccLocalizedText;
  online?: boolean;
}

export interface ResourceSummary {
  id: string;
  name?: SfccLocalizedText | string;
  description?: string;
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

type SfccRecord = Record<string, unknown>;

const BASE_SCOPES = ['sfcc.catalogs', 'sfcc.products'];

// The UI only reads a handful of fields per item. Projecting down here keeps every sfccApi
// response far under the App Action platform's response size cap, regardless of how much
// SFCC includes in the full representation.
function toProductSummary(product: SfccRecord): ProductSummary {
  const type = product?.type as { variant?: boolean } | undefined;
  return {
    id: product?.id as string,
    name: product?.name as SfccLocalizedText,
    image: product?.image as SfccImage,
    price: product?.price as number | undefined,
    priceCurrency: product?.priceCurrency as string | undefined,
    online: product?.online as boolean | undefined,
    inStock: product?.inStock as boolean | undefined,
    ats: product?.ats as number | undefined,
    isVariant: type?.variant,
    variationValues: product?.variationValues as Record<string, string> | undefined,
  };
}

function toCategorySummary(category: SfccRecord): CategorySummary {
  return {
    id: category?.id as string,
    catalogId: category?.catalogId as string,
    name: category?.name as SfccLocalizedText,
    online: category?.online as boolean | undefined,
  };
}

interface ResourceConfig {
  scope: string;
  searchPath: string;
  // Fetch-by-id path; absent when the API has no single-item GET (customer groups).
  getPath?: (id: string) => string;
  idField: string;
  textFields: string[];
  summarize: (item: SfccRecord) => ResourceSummary;
}

const RESOURCES: Record<Resource, ResourceConfig> = {
  customerGroup: {
    scope: 'sfcc.customergroups',
    searchPath: 'customer/customers/v1/organizations/{org}/customer-group-search',
    idField: 'id',
    textFields: ['id', 'description'],
    summarize: (g) => ({
      id: g.id as string,
      description: g.description as string | undefined,
      memberCount: g.memberCount as number | undefined,
      groupType: g.type as string | undefined,
    }),
  },
  promotion: {
    scope: 'sfcc.promotions',
    searchPath: 'pricing/promotions/v1/organizations/{org}/promotions',
    getPath: (id) => `pricing/promotions/v1/organizations/{org}/promotions/${id}`,
    idField: 'id',
    textFields: ['id', 'name'],
    summarize: (p) => {
      const assignment = p.assignmentInformation as { active?: boolean } | undefined;
      return {
        id: p.id as string,
        name: p.name as SfccLocalizedText | undefined,
        enabled: p.enabled as boolean | undefined,
        archived: p.archived as boolean | undefined,
        active: assignment?.active,
      };
    },
  },
  campaign: {
    scope: 'sfcc.promotions',
    searchPath: 'pricing/campaigns/v1/organizations/{org}/campaigns',
    getPath: (id) => `pricing/campaigns/v1/organizations/{org}/campaigns/${id}`,
    idField: 'campaignId',
    // Campaign search rejects disjunctions, including a multi-field textQuery.
    textFields: ['campaignId'],
    summarize: (c) => ({
      id: c.campaignId as string,
      description: c.description as string | undefined,
      enabled: c.enabled as boolean | undefined,
      startDate: c.startDate as string | undefined,
      endDate: c.endDate as string | undefined,
    }),
  },
  coupon: {
    scope: 'sfcc.promotions',
    searchPath: 'pricing/coupons/v1/organizations/{org}/coupons',
    getPath: (id) => `pricing/coupons/v1/organizations/{org}/coupons/${id}`,
    idField: 'couponId',
    textFields: ['couponId', 'description'],
    summarize: (c) => ({
      id: c.couponId as string,
      description: c.description as string | undefined,
      enabled: c.enabled as boolean | undefined,
      couponType: c.type as string | undefined,
      code: c.singleCode as string | undefined,
    }),
  },
  store: {
    scope: 'sfcc.stores',
    searchPath: 'store/stores/v1/organizations/{org}/store-search',
    getPath: (id) => `store/stores/v1/organizations/{org}/stores/${id}`,
    idField: 'id',
    textFields: ['id', 'name', 'city', 'postalCode'],
    summarize: (s) => ({
      id: s.id as string,
      name: s.name as string | undefined,
      address: [s.city, s.stateCode, s.countryCode].filter(Boolean).join(', ') || undefined,
      storeLocatorEnabled: s.storeLocatorEnabled as boolean | undefined,
    }),
  },
};

// Only request the scopes an action needs, so installations whose API client has not been
// granted the newer scopes keep working for products and categories.
function scopesFor(action: Action): string[] {
  if (action.type === 'searchResource' || action.type === 'fetchResource') {
    return [...BASE_SCOPES, RESOURCES[action.resource].scope];
  }
  return BASE_SCOPES;
}

async function fetchSfccToken(params: InstallationParameters, scopes: string[]): Promise<string> {
  const authToken = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString('base64');
  const tenantId = params.organizationId.split('_').slice(2).join('_');

  const res = await fetch('https://account.demandware.com/dwsso/oauth2/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authToken}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: `SALESFORCE_COMMERCE_API:${tenantId} ${scopes.join(' ')}`,
    }),
  });

  if (!res.ok) {
    throw new Error(`SFCC token fetch failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

class SfccApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function sfccFetch(url: string, token: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new SfccApiError(res.status, `SFCC API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

function buildSearchBody(query?: string, forCategories = false, options: ScopeOptions = {}) {
  const must: unknown[] = [];

  if (forCategories) {
    must.push({ termQuery: { fields: ['online'], operator: 'is', values: [true] } });
    if (options.catalogId) {
      must.push({
        termQuery: { fields: ['catalogId'], operator: 'is', values: [options.catalogId] },
      });
    }
  } else if (options.includeVariants) {
    must.push({
      termQuery: { fields: ['type'], operator: 'one_of', values: ['master', 'variant'] },
    });
  } else {
    must.push({ termQuery: { fields: ['type'], operator: 'is', values: ['master'] } });
  }

  if (query?.length) {
    must.push({ textQuery: { fields: ['id', 'name'], searchPhrase: query } });
  }

  return {
    query: { boolQuery: { must } },
    sorts: [{ field: 'name', sortOrder: 'asc' }],
  };
}

function buildResourceSearchBody(config: ResourceConfig, query?: string, offset = 0) {
  return {
    query: query?.length
      ? { textQuery: { fields: config.textFields, searchPhrase: query } }
      : { matchAllQuery: {} },
    limit: 50,
    offset,
    sorts: [{ field: config.idField, sortOrder: 'asc' }],
  };
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', Action>,
  context: FunctionEventContext
) => {
  const params = context.appInstallationParameters as InstallationParameters;

  if (!params?.clientId || !params?.shortCode) {
    return {
      ok: false,
      error: { type: 'ConfigError', message: 'Missing SFCC installation parameters' },
    };
  }

  const action = event.body;

  if (
    action.type === 'searchResource' &&
    action.offset !== undefined &&
    (!Number.isSafeInteger(action.offset) || action.offset < 0)
  ) {
    return {
      ok: false,
      error: { type: 'ValidationError', message: 'Offset must be a non-negative integer' },
    };
  }

  if (
    (action.type === 'searchResource' || action.type === 'fetchResource') &&
    !RESOURCES[action.resource]
  ) {
    return { ok: false, error: { type: 'UnknownAction', message: 'Unknown resource type' } };
  }

  let token: string;
  try {
    token = await fetchSfccToken(params, scopesFor(action));
  } catch (e) {
    return { ok: false, error: { type: 'AuthError', message: (e as Error).message } };
  }

  const base = `https://${params.shortCode}.api.commercecloud.salesforce.com`;
  const { organizationId } = params;
  // A field can target a different site than the installation default.
  const siteId = encodeURIComponent(action.siteId || params.siteId);
  const resourceUrl = (path: string) =>
    `${base}/${path.replace('{org}', organizationId)}?siteId=${siteId}`;

  try {
    switch (action.type) {
      case 'searchProducts': {
        const url = `${base}/product/products/v1/organizations/${organizationId}/product-search?siteId=${siteId}`;
        const data = (await sfccFetch(url, token, {
          method: 'POST',
          body: JSON.stringify(buildSearchBody(action.query, false, action)),
        })) as { hits?: SfccRecord[] };
        return { ok: true, data: (data.hits ?? []).map(toProductSummary) };
      }

      case 'searchCategories': {
        const url = `${base}/product/catalogs/v1/organizations/${organizationId}/category-search`;
        const data = (await sfccFetch(url, token, {
          method: 'POST',
          body: JSON.stringify(buildSearchBody(action.query, true, action)),
        })) as { hits?: SfccRecord[] };
        return { ok: true, data: (data.hits ?? []).map(toCategorySummary) };
      }

      case 'fetchProduct': {
        const url = `${base}/product/products/v1/organizations/${organizationId}/products/${encodeURIComponent(
          action.productId
        )}?siteId=${siteId}`;
        const data = (await sfccFetch(url, token, { method: 'GET' })) as SfccRecord;
        return { ok: true, data: toProductSummary(data) };
      }

      case 'fetchCategory': {
        const url = `${base}/product/catalogs/v1/organizations/${organizationId}/catalogs/${encodeURIComponent(
          action.catalogId
        )}/categories/${encodeURIComponent(action.categoryId)}`;
        const data = (await sfccFetch(url, token, { method: 'GET' })) as SfccRecord;
        return { ok: true, data: toCategorySummary(data) };
      }

      case 'searchResource': {
        const config = RESOURCES[action.resource];
        const offset = action.offset ?? 0;
        const data = (await sfccFetch(resourceUrl(config.searchPath), token, {
          method: 'POST',
          body: JSON.stringify(buildResourceSearchBody(config, action.query, offset)),
        })) as { hits?: SfccRecord[]; total?: number };
        const hits = data.hits ?? [];
        const nextOffset = offset + hits.length;
        const hasMore =
          hits.length > 0 &&
          (data.total === undefined ? hits.length === 50 : nextOffset < data.total);
        return {
          ok: true,
          data: {
            items: hits.map(config.summarize),
            ...(hasMore ? { nextOffset } : {}),
          },
        };
      }

      case 'fetchResource': {
        const config = RESOURCES[action.resource];
        if (config.getPath) {
          const url = resourceUrl(config.getPath(encodeURIComponent(action.resourceId)));
          const data = (await sfccFetch(url, token, { method: 'GET' })) as SfccRecord;
          return { ok: true, data: config.summarize(data) };
        }
        // No single-item GET exists; look the item up by exact ID instead. The customer group
        // search answers 400 (not an empty result) when the term matches no group.
        let hit: SfccRecord | undefined;
        try {
          const data = (await sfccFetch(resourceUrl(config.searchPath), token, {
            method: 'POST',
            body: JSON.stringify({
              query: {
                termQuery: {
                  fields: [config.idField],
                  operator: 'is',
                  values: [action.resourceId],
                },
              },
              limit: 1,
            }),
          })) as { hits?: SfccRecord[] };
          hit = data.hits?.[0];
        } catch (e) {
          if (!(e instanceof SfccApiError && e.status === 400)) throw e;
        }
        if (!hit) {
          return { ok: false, error: { type: 'NotFound', message: 'Item not found' } };
        }
        return { ok: true, data: config.summarize(hit) };
      }

      default:
        return { ok: false, error: { type: 'UnknownAction', message: 'Unknown action type' } };
    }
  } catch (e) {
    const type = e instanceof SfccApiError && e.status === 404 ? 'NotFound' : 'ApiError';
    return { ok: false, error: { type, message: (e as Error).message } };
  }
};
