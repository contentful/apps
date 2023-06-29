import { Response, SAPParameters, UpdateTotalPagesFn } from '../interfaces';
import { productTransformer } from './dataTransformers';
import { config } from '../config';
import fetchWithSignedRequest from './signed-requests';
import { CMAClient, DialogAppSDK } from '@contentful/app-sdk';

export async function fetchProductList(
  baseSite: string,
  searchQuery: string,
  page: number,
  parameters: SAPParameters,
  updateTotalPages: UpdateTotalPagesFn,
  applicationInterfaceKey: string,
  sdk: DialogAppSDK,
  cma: CMAClient
) {
  const url = new URL(`${config.proxyUrl}/dev/sap`);

  const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET');
  console.log(res);
  const json = await res.json();
  console.log(json);
  return { products: [], errors: [] };
}
