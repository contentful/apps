import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { Response as ProductListResponse, SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { productTransformer } from './dataTransformers';
import { isHAAEnabled } from '../helpers/isHAAEnabled';
import { toHAAParams } from '../helpers/toHAAParams';

type TransformParams = {
  baseSite: string;
  searchQuery: string;
  parameters: SAPParameters;
  updateTotalPages: UpdateTotalPagesFn;
};
type ResponseOrHAAResponse = {
  ok: boolean;
  responseJson: any;
};
export async function transformResponse(
  { ok, responseJson }: ResponseOrHAAResponse,
  { baseSite, searchQuery, parameters, updateTotalPages }: TransformParams
) {
  if (ok) {
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

type FetchHAAProductListParams = {
  url: string;
  baseSite: string;
  searchQuery: string;
  parameters: SAPParameters;
  updateTotalPages: UpdateTotalPagesFn;
  ids: BaseAppSDK['ids'];
  cma: CMAClient;
};
const fetchHAAProductList = async ({
  baseSite,
  searchQuery,
  url,
  parameters,
  updateTotalPages,
  ids,
  cma,
}: FetchHAAProductListParams): Promise<ProductListResponse> => {
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
  return transformResponse(
    { ok: responseJson.success, responseJson },
    { baseSite, searchQuery, parameters, updateTotalPages }
  );
};
type FetchProductListParams = {
  baseSite: string;
  searchQuery: string;
  page: number;
  parameters: SAPParameters;
  updateTotalPages: UpdateTotalPagesFn;
  ids: BaseAppSDK['ids'];
  cma: CMAClient;
};
export async function fetchProductList({
  baseSite,
  searchQuery,
  page,
  parameters,
  updateTotalPages,
  ids,
  cma,
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
  if (isHAAEnabled(ids)) {
    return fetchHAAProductList({
      baseSite,
      searchQuery,
      url,
      parameters,
      updateTotalPages,
      ids,
      cma,
    });
  }
  const response: any = await fetch(url);
  const responseJson = await response.json();
  return transformResponse(
    { ok: response.ok, responseJson },
    { baseSite, searchQuery, parameters, updateTotalPages }
  );
}
