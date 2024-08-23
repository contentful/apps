import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { Response as ProductListResponse, SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { productTransformer } from './dataTransformers';
import { toHAAParams } from '../helpers/toHAAParams';

export type FetchProductListParams = {
  baseSite: string;
  searchQuery: string;
  page: number;
  parameters: SAPParameters;
  updateTotalPages: UpdateTotalPagesFn;
};
type FetchHAAProductListParams = Omit<FetchProductListParams, 'parameters'> & {
  ids: BaseAppSDK['ids'];
  cma: CMAClient;
};
export async function fetchProductListHAA({
  baseSite,
  searchQuery,
  page,
  updateTotalPages,
  ids,
  cma,
}: FetchHAAProductListParams): Promise<ProductListResponse> {
  const { response } = await cma.appActionCall.createWithResponse(
    toHAAParams('fetchProductList', ids),
    {
      parameters: {
        baseSite,
        searchQuery,
        page,
      },
    }
  );
  const responseJson = JSON.parse(response.body);
  if (responseJson.ok) {
    const products = responseJson['data']['products'];
    updateTotalPages(responseJson['data']['pagination']['totalPages']);
    if (!products.length) {
      return {
        products: [],
        errors: [
          {
            message: `Products not found for search term ${searchQuery}`,
            type: 'Not Found',
          },
        ],
      };
    }
    return { products, errors: [] };
  }
  return { products: [], errors: responseJson['errors'] };
}

export async function fetchProductList({
  baseSite,
  searchQuery,
  page,
  parameters,
  updateTotalPages,
}: FetchProductListParams): Promise<ProductListResponse> {
  if (!baseSite.length) {
    return {
      products: [],
      errors: [],
    };
  }
  const url =
    parameters.installation.apiEndpoint +
    '/occ/v2/' +
    baseSite +
    '/products/search' +
    '?query=' +
    searchQuery +
    '&fields=FULL&currentPage=' +
    page;
  const response: any = await fetch(url);
  const responseJson = await response.json();

  if (response.ok) {
    const products = responseJson['products'].map(
      productTransformer(parameters.installation, {}, baseSite)
    );
    updateTotalPages(responseJson['pagination']['totalPages']);
    if (!products.length) {
      return {
        products: [],
        errors: [
          {
            message: `Products not found for search term ${searchQuery}`,
            type: 'Not Found',
          },
        ],
      };
    }
    return { products, errors: [] };
  }
  return { products: [], errors: responseJson['errors'] };
}
