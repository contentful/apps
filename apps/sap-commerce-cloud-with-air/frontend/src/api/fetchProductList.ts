import { SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { config } from '../config';
import fetchWithSignedRequest from './signed-requests';
import { DialogAppSDK } from '@contentful/app-sdk';
// import { productListMockData } from './realMockData';
import { productTransformer } from './dataTransformers';

export async function fetchProductList(
  baseSite: string,
  searchQuery: string,
  page: number,
  parameters: SAPParameters,
  updateTotalPages: UpdateTotalPagesFn,
  applicationInterfaceKey: string,
  sdk: DialogAppSDK,
  cma: any
) {
  // TODO: Delete in a cleanup PR
  // const products = productListMockData.products.map(productTransformer(parameters.installation));
  // updateTotalPages(productListMockData['pagination']['totalPages']);
  // return { products, errors: [] };

  const url = new URL(`${config.proxyUrl}/sap/product-list`);
  console.log('URL from fetch product list: ' + url);
  const urlPathParams = '?query=' + searchQuery + '&fields=FULL&currentPage=' + page;
  const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET', {
    'x-path-params': JSON.stringify(urlPathParams),
  });
  const json = await res.json();
  const products = json.products.map(productTransformer(parameters.installation));
  updateTotalPages(json['pagination']['totalPages']);
  return { products, errors: [] };
}
