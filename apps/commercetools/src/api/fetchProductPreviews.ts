import difference from 'lodash/difference';
import { ConfigurationParameters, Product } from './../interfaces';
import { createRequestBuilder } from '@commercetools/api-request-builder';
import { makeCommerceToolsClient } from './makeCommercetoolsClient';
import { productTransformer } from './dataTransformers';

export async function fetchProductPreviews(
  skus: string[],
  config: ConfigurationParameters
): Promise<Product[]> {
  if (!skus.length) {
    return [];
  }

  const client = makeCommerceToolsClient({
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
  const response = await client.execute({ uri, method: 'GET' });
  if (response.statusCode === 200) {
    const products = response.body.results.map(productTransformer(config));
    const foundSKUs = products.map((product: Product) => product.sku);
    const missingProducts = difference(skus, foundSKUs).map(sku => ({
      sku,
      image: '',
      id: '',
      name: '',
      isMissing: true
    }));
    return [...products, ...missingProducts];
  }
  throw new Error(response.statusCode);
}
