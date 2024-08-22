import difference from 'lodash/difference';
import { Product, SAPParameters } from '../interfaces';
import { productTransformer } from './dataTransformers';
import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { isHAAEnabled } from '../helpers/isHAAEnabled';
import { toHAAParams } from '../helpers/toHAAParams';

const fetchHAAProductPreviews = async (
  skus: string[],
  parameters: SAPParameters,
  ids: BaseAppSDK['ids'],
  cma: CMAClient
): Promise<Product[]> => {
  const { response } = await cma.appActionCall.createWithResponse(
    toHAAParams('fetchProductPreview', ids),
    {
      parameters: {
        sapApiEndpoint: parameters.installation.apiEndpoint,
        apiKey: ids.app,
        skus: JSON.stringify(skus),
      },
    }
  );
  return JSON.parse(response.body).products;
};
export async function fetchProductPreviews(
  skus: string[],
  parameters: SAPParameters,
  ids: BaseAppSDK['ids'],
  cma: CMAClient
): Promise<Product[]> {
  if (!skus.length) {
    return [];
  }

  if (isHAAEnabled(ids)) {
    return fetchHAAProductPreviews(skus, parameters, ids, cma);
  }

  let totalResponse: any[] = [];
  let skuIds: string[] = [];
  let skuIdsToSkusMap: { [key: string]: string } = {};

  for (const sku of skus) {
    const skuId = sku.split('/products/').pop() as string;
    skuIds.push(skuId);
    skuIdsToSkusMap[skuId] = sku;

    const url = `${sku}?fields=code,name,summary,price(formattedValue,DEFAULT),images(galleryIndex,FULL),averageRating,stock(DEFAULT),description,availableForPickup,url,numberOfReviews,manufacturer,categories(FULL),priceRange,multidimensional,configuratorType,configurable,tags`;
    const response = await fetch(url);
    if (response.ok) {
      let responseJson = await response.json();
      totalResponse.push(responseJson);
    }
  }

  const products = totalResponse.map(productTransformer(parameters.installation, skuIdsToSkusMap));
  const foundSKUs = products.map((product: { sku: any }) => product.sku);
  const missingProducts = difference(skuIds, foundSKUs).map((sku) => ({
    sku: sku.split('/products/').pop(),
    image: '',
    id: '',
    name: '',
    isMissing: true,
    productUrl: skuIdsToSkusMap[sku],
  }));
  return [...products, ...missingProducts];
}
