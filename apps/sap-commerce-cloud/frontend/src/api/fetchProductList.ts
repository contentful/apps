import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { Response as ProductListResponse, SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { productTransformer } from './dataTransformers';
import { toHAAParams } from '../helpers/toHAAParams';

type FetchUrlParams = {
  baseSite: string;
  searchQuery: string;
  page: number;
  parameters: SAPParameters;
};
export type FetchProductListParams = {
  baseSite: string;
  searchQuery: string;
  page: number;
  parameters: SAPParameters;
  updateTotalPages: UpdateTotalPagesFn;
};
type FetchHAAProductListParams = FetchProductListParams & {
  ids: BaseAppSDK['ids'];
  cma: CMAClient;
};
const makeUrl = ({ baseSite, searchQuery, page, parameters }: FetchUrlParams) => {
  return (
    parameters.installation.apiEndpoint +
    '/occ/v2/' +
    baseSite +
    '/products/search' +
    '?query=' +
    searchQuery +
    '&fields=FULL&currentPage=' +
    page
  );
};
export async function fetchProductListHAA({
  baseSite,
  searchQuery,
  page,
  parameters,
  updateTotalPages,
  ids,
  cma,
}: FetchHAAProductListParams): Promise<ProductListResponse> {
  const url = makeUrl({ baseSite, searchQuery, page, parameters });
  const { response } = await cma.appActionCall.createWithResponse(
    toHAAParams('fetchProductList', ids),
    {
      parameters: {
        sapApiEndpoint: url,
        apiKey: ids.app,
      },
    }
  );
  const responseJson = JSON.parse(response.body);
  if (responseJson.success) {
    const products = responseJson['products'];
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
  const url = makeUrl({ baseSite, searchQuery, page, parameters });
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
