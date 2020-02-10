import { ConfigurationParameters, Product } from './../interfaces';
import { createRequestBuilder } from '@commercetools/api-request-builder';
import { makeCommerceToolsClient } from './makeCommercetoolsClient';
import { categoryTransformer } from './dataTransformers';

export async function fetchCategoryPreviews(
  ids: string[],
  config: ConfigurationParameters
): Promise<Product[]> {
  if (!ids.length) {
    return [];
  }

  const client = makeCommerceToolsClient({ parameters: { installation: config } });
  const requestBuilder = (createRequestBuilder as any)({ projectKey: config.projectKey });
  const uri = requestBuilder.categories
    .where(`id in (${ids.map(id => `"${id}"`).join(',')})`)
    .build();
  const response = await client.execute({ uri, method: 'GET' });

  if (response.statusCode === 200) {
    const products = response.body.results.map(categoryTransformer(config));
    return products;
  }
  throw new Error(response.statusCode);
}
