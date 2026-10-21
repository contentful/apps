import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { FieldType, ResourceType, ScopeOptions, SearchPage, SfccItem } from './resources';

const APP_ACTION_ID = 'sfccApi';

interface HaaParams {
  appActionId: string;
  environmentId: string;
  spaceId: string;
  appDefinitionId: string;
}

function toCallParams(ids: BaseAppSDK['ids']): HaaParams {
  return {
    appActionId: APP_ACTION_ID,
    environmentId: ids.environment,
    spaceId: ids.space,
    appDefinitionId: ids.app!,
  };
}

async function callFunction<T>(
  cma: CMAClient,
  ids: BaseAppSDK['ids'],
  body: Record<string, unknown>
): Promise<T> {
  const { response } = await cma.appActionCall.createWithResponse(toCallParams(ids) as any, {
    parameters: body,
  });
  const json = JSON.parse(response.body) as
    | { ok: true; data: T }
    | { ok: false; error: { message: string } };
  if (!json.ok) {
    throw new Error(json.error.message);
  }
  return json.data;
}

// Drop unset options so the app action only receives parameters it declares values for.
function compact(options: ScopeOptions = {}) {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined && value !== '')
  );
}

class SfccClient {
  private cma: CMAClient;
  private ids: BaseAppSDK['ids'];
  private options: ScopeOptions;

  constructor(cma: CMAClient, ids: BaseAppSDK['ids'], options: ScopeOptions = {}) {
    this.cma = cma;
    this.ids = ids;
    this.options = options;
  }

  fetchProduct = (productId: string) =>
    callFunction<SfccItem>(this.cma, this.ids, {
      type: 'fetchProduct',
      resourceId: productId,
      ...compact({ siteId: this.options.siteId }),
    });

  searchProducts = (query?: string) =>
    callFunction<SfccItem[]>(this.cma, this.ids, {
      type: 'searchProducts',
      query,
      ...compact({ siteId: this.options.siteId, includeVariants: this.options.includeVariants }),
    });

  searchCategories = (query?: string) =>
    callFunction<SfccItem[]>(this.cma, this.ids, {
      type: 'searchCategories',
      query,
      ...compact({ catalogId: this.options.catalogId }),
    });

  fetchCategory = (catalogId: string, categoryId: string) =>
    callFunction<SfccItem>(this.cma, this.ids, {
      type: 'fetchCategory',
      catalogId,
      resourceId: categoryId,
    });

  searchResource = (resource: ResourceType, query?: string, offset = 0) =>
    callFunction<SearchPage>(this.cma, this.ids, {
      type: 'searchResource',
      resource,
      query,
      offset,
      ...compact({ siteId: this.options.siteId }),
    });

  fetchResource = (resource: ResourceType, resourceId: string) =>
    callFunction<SfccItem>(this.cma, this.ids, {
      type: 'fetchResource',
      resource,
      resourceId,
      ...compact({ siteId: this.options.siteId }),
    });

  search = async (fieldType: FieldType, query?: string, offset = 0): Promise<SearchPage> => {
    if (fieldType === 'product') return { items: await this.searchProducts(query) };
    if (fieldType === 'category') return { items: await this.searchCategories(query) };
    return this.searchResource(fieldType, query, offset);
  };

  /** Fetches a stored field value (categories are stored as `catalogId:categoryId`). */
  fetchByKey = (fieldType: FieldType, key: string): Promise<SfccItem> => {
    if (fieldType === 'product') return this.fetchProduct(key);
    if (fieldType === 'category') {
      const [catalogId, categoryId] = key.split(':');
      return this.fetchCategory(catalogId, categoryId);
    }
    return this.fetchResource(fieldType, key);
  };
}

export default SfccClient;
