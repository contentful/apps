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
  // const url = new URL(`${config.proxyUrl}/sap/product-list`);
  // const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET');
  // const json = await res.json();
  // return { products: json, errors: [] };

  const products = productListMockData.products.map(productTransformer(parameters.installation));
  updateTotalPages(productListMockData['pagination']['totalPages']);
  return { products, errors: [] };
}

// export async function fetchProductList(
//   baseSite: string,
//   searchQuery: string,
//   page: number,
//   parameters: SAPParameters,
//   updateTotalPages: UpdateTotalPagesFn,
//   applicationInterfaceKey: string
// ): Promise<Response> {
//   if (!baseSite.length) {
//     return {
//       products: [],
//       errors: [],
//     };
//   }
//   const headers = config.isTestEnv
//     ? {}
//     : {
//         headers: {
//           'Application-Interface-Key': applicationInterfaceKey,
//         },
//       };
//   const response: any = await fetch(
//     parameters.installation.apiEndpoint +
//       '/occ/v2/' +
//       baseSite +
//       '/products/search' +
//       '?query=' +
//       searchQuery +
//       '&fields=FULL&currentPage=' +
//       page,
//     headers
//   );
//   const responseJson = await response.json();
//   if (response.ok) {
//     const products = responseJson['products'].map(productTransformer(parameters.installation));
//     updateTotalPages(responseJson['pagination']['totalPages']);
//     if (!products.length) {
//       return {
//         products: [],
//         errors: [
//           {
//             message: `Products not found for search term ${searchQuery}`,
//             type: 'Not Found',
//           },
//         ],
//       };
//     }
//     return { products, errors: [] };
//   }
//   return { products: [], errors: responseJson['errors'] };
// }
