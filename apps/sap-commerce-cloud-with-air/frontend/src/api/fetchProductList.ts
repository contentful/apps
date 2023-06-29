import { SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { config } from '../config';
import fetchWithSignedRequest from './signed-requests';
import { DialogAppSDK } from '@contentful/app-sdk';
import { productListMockData } from './realMockData';
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
  // const products = productListMockData.products.map(productTransformer(parameters.installation));
  // updateTotalPages(productListMockData['pagination']['totalPages']);
  // return { products, errors: [] };

  const url = new URL(`${config.proxyUrl}/sap/product-list`);
  const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET');
  const json = await res.json();
  return { products: json, errors: [] };
}
