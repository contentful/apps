import { SAPParameters } from '../interfaces';
import { config } from '../config';
import fetchWithSignedRequest from './signed-requests';
import { DialogAppSDK, FieldAppSDK } from '@contentful/app-sdk';
import { productPreviewMock } from './realMockData';

export async function fetchProductPreviews(
  skus: string[],
  parameters: SAPParameters,
  applicationInterfaceKey: string,
  sdk: FieldAppSDK,
  cma: any
) {
  const url = new URL(`${config.proxyUrl}/sap/product-preview`);
  const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET', {
    'x-skus': JSON.stringify(skus),
  });
  const json = await res.json();
  console.log('previews', json);
  return json;

  // return productPreviewMock;
}

// export async function fetchProductPreviews(
//   skus: string[],
//   parameters: SAPParameters,
//   applicationInterfaceKey: string
// ): Promise<Product[]> {
//   if (!skus.length) {
//     return [];
//   }

//   let totalResponse: any[] = [];
//   let skuIds: string[] = [];

//   const headers = config.isTestEnv
//     ? {}
//     : {
//         headers: {
//           'Application-Interface-Key': applicationInterfaceKey,
//         },
//       };
//   for (const sku of skus) {
//     skuIds.push(sku.split('/products/').pop() as string);
//     const url = `${sku}?fields=code,name,summary,price(formattedValue,DEFAULT),images(galleryIndex,FULL),averageRating,stock(DEFAULT),description,availableForPickup,url,numberOfReviews,manufacturer,categories(FULL),priceRange,multidimensional,configuratorType,configurable,tags`;
//     const response = await fetch(url, headers);
//     if (response.ok) {
//       let responseJson = await response.json();
//       totalResponse.push(responseJson);
//     }
//   }

//   const products = totalResponse.map(productTransformer(parameters.installation));
//   const foundSKUs = products.map((product: { sku: any }) => product.sku);
//   const missingProducts = difference(skuIds, foundSKUs).map((sku) => ({
//     sku: sku.split('/products/').pop(),
//     image: '',
//     id: '',
//     name: '',
//     isMissing: true,
//   }));
//   return [...products, ...missingProducts];
// }
