import difference from 'lodash/difference';
import { Product, SAPParameters } from '../interfaces';
import { productTransformer } from './dataTransformers';
import { BaseAppSDK, CMAClient } from '@contentful/app-sdk';
import { toHAAParams } from '../helpers/toHAAParams';

export const fetchProductPreviewsHAA = async (
  skus: string[],
  ids: BaseAppSDK['ids'],
  cma: CMAClient
): Promise<Product[]> => {
  const { response } = await cma.appActionCall.createWithResponse(
    toHAAParams('fetchProductPreview', ids),
    {
      parameters: {
        skus: JSON.stringify(skus),
      },
    }
  );
  const jsonResponse = JSON.parse(response.body);
  if (!jsonResponse.success) {
    return [];
  }
  return jsonResponse.products;
};
export async function fetchProductPreviews(
  skus: string[],
  parameters: SAPParameters
): Promise<Product[]> {
  if (!skus.length) {
    return [];
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
