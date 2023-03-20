import difference from 'lodash/difference';
import { ConfigurationParameters, Product } from '../interfaces';
//import { makeCommerceToolsClient } from './makeCommercetoolsClient';
import { productTransformer } from './dataTransformers';

export async function fetchProductPreviews(
  skus: string[],
  config: ConfigurationParameters
): Promise<Product[]> {
  if (!skus.length) {
    return [];
  }

  /*const client = makeCommerceToolsClient({
    parameters: { installation: config }
  });
  const requestBuilder = (createRequestBuilder as Function)({
    projectKey: config.projectKey
  });
  const uri = requestBuilder.productProjectionsSearch
    .parse({
      filter: [`variants.sku:${skus.map(sku => `"${sku}"`).join(',')}`]
    })
    .build();
  const response = await client.execute({ uri, method: 'GET' });*/
  const response = await fetch(
    'https://api.c19a91jwyt-habermaas1-d1-public.model-t.cc.commerce.ondemand.com/occ/v2/jakooDE/products/' +
      skus[0] +
      '?fields=code,name,summary,price(formattedValue,DEFAULT),images(galleryIndex,FULL),averageRating,stock(DEFAULT),description,availableForPickup,url,numberOfReviews,manufacturer,categories(FULL),priceRange,multidimensional,configuratorType,configurable,tags&lang=de&curr=EUR'
  );
  if (response.ok) {
    let responseJson = await response.json();
    responseJson = [responseJson];
    console.log(responseJson);
    const products = responseJson.map(productTransformer(config));
    const foundSKUs = products.map((product) => product.sku);
    const missingProducts = difference(skus, foundSKUs).map((sku) => ({
      sku,
      image: '',
      id: '',
      name: '',
      isMissing: true,
    }));
    return [...products, ...missingProducts];
  }
  throw new Error(response.statusText);
}
