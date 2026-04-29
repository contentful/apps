import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

type Action =
  | { type: 'searchProducts'; query?: string }
  | { type: 'searchCategories'; query?: string }
  | { type: 'fetchProduct'; productId: string }
  | { type: 'fetchCategory'; catalogId: string; categoryId: string };

interface InstallationParameters {
  clientId: string;
  clientSecret: string;
  organizationId: string;
  shortCode: string;
  siteId: string;
}

async function fetchSfccToken(params: InstallationParameters): Promise<string> {
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
      scope: `SALESFORCE_COMMERCE_API:${tenantId} sfcc.catalogs sfcc.products`,
    }),
  });

  if (!res.ok) {
    throw new Error(`SFCC token fetch failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
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
    throw new Error(`SFCC API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

function buildSearchBody(query?: string, forCategories = false): unknown {
  const must: unknown[] = [];

  if (forCategories) {
    must.push({ termQuery: { fields: ['online'], operator: 'is', values: [true] } });
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

  let token: string;
  try {
    token = await fetchSfccToken(params);
  } catch (e) {
    return { ok: false, error: { type: 'AuthError', message: (e as Error).message } };
  }

  const base = `https://${params.shortCode}.api.commercecloud.salesforce.com`;
  const { organizationId, siteId } = params;
  const action = event.body;

  try {
    switch (action.type) {
      case 'searchProducts': {
        const url = `${base}/product/products/v1/organizations/${organizationId}/product-search?siteId=${siteId}`;
        const data = (await sfccFetch(url, token, {
          method: 'POST',
          body: JSON.stringify(buildSearchBody(action.query)),
        })) as { hits?: unknown[] };
        return { ok: true, data: data.hits ?? [] };
      }

      case 'searchCategories': {
        const url = `${base}/product/catalogs/v1/organizations/${organizationId}/category-search`;
        const data = (await sfccFetch(url, token, {
          method: 'POST',
          body: JSON.stringify(buildSearchBody(action.query, true)),
        })) as { hits?: unknown[] };
        return { ok: true, data: data.hits ?? [] };
      }

      case 'fetchProduct': {
        const url = `${base}/product/products/v1/organizations/${organizationId}/products/${action.productId}?siteId=${siteId}`;
        const data = await sfccFetch(url, token, { method: 'GET' });
        return { ok: true, data };
      }

      case 'fetchCategory': {
        const url = `${base}/product/catalogs/v1/organizations/${organizationId}/catalogs/${action.catalogId}/categories/${action.categoryId}`;
        const data = await sfccFetch(url, token, { method: 'GET' });
        return { ok: true, data };
      }

      default:
        return { ok: false, error: { type: 'UnknownAction', message: 'Unknown action type' } };
    }
  } catch (e) {
    return { ok: false, error: { type: 'ApiError', message: (e as Error).message } };
  }
};
