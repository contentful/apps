import difference from 'lodash/difference';
import { ConfigurationParameters, Product } from '../interfaces';
//import { createRequestBuilder } from '@commercetools/api-request-builder';
//import { makeCommerceToolsClient } from './makeCommercetoolsClient';
import { productTransformer } from './dataTransformers';
import { config } from '../config';

export async function fetchProductPreviews(
  skus: string[],
  parameters: any,
  params: any,
  applicationInterfaceKey: string
): Promise<Product[]> {
  if (!skus.length) {
    return [];
  }

  let totalResponse: any[] = [];
  let skuIds: string[] = [];

  const headers = config.isTestEnv
    ? {}
    : {
        headers: {
          'Application-Interface-Key': applicationInterfaceKey,
        },
      };
  for (const sku of skus) {
    const splitSku = sku.split(':');
    const baseSite = splitSku[0];
    const skuId = splitSku[1];
    skuIds.push(skuId);
    const response = await fetch(
      parameters.apiEndpoint +
        `/occ/v2/${baseSite}/products/` +
        skuId +
        '?fields=code,name,summary,price(formattedValue,DEFAULT),images(galleryIndex,FULL),averageRating,stock(DEFAULT),description,availableForPickup,url,numberOfReviews,manufacturer,categories(FULL),priceRange,multidimensional,configuratorType,configurable,tags',
      headers
    );
    if (response.ok) {
      let responseJson = await response.json();
      totalResponse.push(responseJson);
    }
  }

  const products = totalResponse.map(productTransformer(parameters));
  const foundSKUs = products.map((product: { sku: any }) => product.sku);
  const missingProducts = difference(skuIds, foundSKUs).map((sku) => ({
    sku,
    image: '',
    id: '',
    name: '',
    isMissing: true,
  }));
  return [...products, ...missingProducts];
}
