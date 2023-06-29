import { SAPParameters } from '../interfaces';
import { config } from '../config';
import fetchWithSignedRequest from './signed-requests';
import { FieldAppSDK } from '@contentful/app-sdk';
// import { productPreviewMock } from './realMockData';

export async function fetchProductPreviews(
  skus: string[],
  parameters: SAPParameters,
  applicationInterfaceKey: string,
  sdk: FieldAppSDK,
  cma: any
) {
  // TODO: Remove in final PR
  // return productPreviewMock;

  const url = new URL(`${config.proxyUrl}/sap/product-preview`);
  const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET', {
    'x-skus': JSON.stringify(skus),
  });
  const json = await res.json();
  return json;
}
