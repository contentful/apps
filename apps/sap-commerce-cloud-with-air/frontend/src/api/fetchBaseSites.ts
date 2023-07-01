import { config } from '../config';
import { SAPParameters } from '../interfaces';
// import { baseSitesMock } from './realMockData';
import fetchWithSignedRequest from './signed-requests';
import { DialogAppSDK } from '@contentful/app-sdk';

export async function fetchBaseSites(
  parameters: SAPParameters,
  applicationInterfaceKey: string,
  sdk: DialogAppSDK,
  cma: any
): Promise<string[]> {
  // TODO: Remove in final PR
  // return baseSitesMock;

  const url = new URL(`${config.proxyUrl}/sap/base-sites`);
  console.log('URL from fetch base sites: ' + url);
  const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET', {
    'application-interface-Key': applicationInterfaceKey,
  });
  const json = await res.json();
  return json;
}
