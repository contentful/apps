import { config } from '../config';
import { SAPParameters } from '../interfaces';
import fetchWithSignedRequest from './signed-requests';
import { DialogAppSDK } from '@contentful/app-sdk';

export async function fetchBaseSites(
  parameters: SAPParameters,
  applicationInterfaceKey: string,
  sdk: DialogAppSDK,
  cma: any
): Promise<string[]> {
  console.log('sdk.ids.app', sdk);

  const url = new URL(`${config.proxyUrl}/sap/base-sites`);
  console.log('url', url);
  console.log('sdk', sdk.ids.app);
  console.log('cma', cma);

  const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET');
  console.log(res);
  const json = await res.json();
  console.log(json);
  return json;
}

// export async function fetchBaseSites(
//   parameters: SAPParameters,
//   applicationInterfaceKey: string
// ): Promise<string[]> {
//   const url = `${parameters.installation.apiEndpoint}/occ/v2/basesites`;
//   const headers = config.isTestEnv
//     ? {}
//     : {
//         headers: {
//           'Application-Interface-Key': applicationInterfaceKey,
//         },
//       };
//   try {
//     const response = await fetch(url, headers);
//     if (response.ok) {
//       const responseJson = await response.json();
//       const baseSites = responseJson['baseSites'].map(baseSiteTransformer());
//       return baseSites;
//     }
//     throw new Error(response.statusText);
//   } catch (error) {
//     throw error;
//   }
// }
