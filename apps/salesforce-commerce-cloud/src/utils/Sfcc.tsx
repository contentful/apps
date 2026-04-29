import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';

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

class SfccClient {
  private cma: CMAClient;
  private ids: BaseAppSDK['ids'];

  constructor(cma: CMAClient, ids: BaseAppSDK['ids']) {
    this.cma = cma;
    this.ids = ids;
  }

  fetchProduct = (productId: string) =>
    callFunction(this.cma, this.ids, { type: 'fetchProduct', productId });

  searchProducts = (query?: string) =>
    callFunction<unknown[]>(this.cma, this.ids, { type: 'searchProducts', query });

  searchCategories = (query?: string) =>
    callFunction<unknown[]>(this.cma, this.ids, { type: 'searchCategories', query });

  fetchCategory = (catalogId: string, categoryId: string) =>
    callFunction(this.cma, this.ids, { type: 'fetchCategory', catalogId, categoryId });
}

export default SfccClient;
