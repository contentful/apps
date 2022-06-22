import { Category } from '@commercetools/platform-sdk';
import { Pagination, Product } from '@contentful/ecommerce-app-base';
import { ConfigurationParameters } from '../types';
import { createClient } from './client';

function categoryTransformer({ projectKey, locale }: ConfigurationParameters) {
  return (item: Category): Product => {
    const id = item.id ?? '';
    return {
      id,
      sku: id,
      name: item.name?.[locale ?? 'en'] ?? '',
      image: item.assets?.[0]?.sources?.[0]?.uri ?? '',
      externalLink: `https://mc.commercetools.com/${projectKey}/products/${id}/general`,
    };
  };
}

const CATEGORY_ID_REGEX = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/;
export async function fetchCategoryPreviews(
  ids: string[],
  config: ConfigurationParameters
): Promise<Product[]> {
  const client = createClient(config);

  const validIds = ids.filter((id) => CATEGORY_ID_REGEX.test(id));
  const invalidIds = ids.filter((id) => !CATEGORY_ID_REGEX.test(id));

  if (validIds.length === 0) {
    return invalidIds.map((sku) => ({
      sku,
      image: '',
      id: '',
      name: '',
      isMissing: true,
    }));
  }

  const response = await client
    .categories()
    .get({
      queryArgs: {
        where: `id in (${validIds.map((id) => `"${id}"`).join(', ')})`,
      },
    })
    .execute();

  if (response.statusCode === 200) {
    const products = response.body.results.map(categoryTransformer(config));

    const foundSKUs = products.map((product: Product) => product.sku);
    const missingProducts = [
      ...validIds.filter((sku) => !foundSKUs.includes(sku)),
      ...invalidIds,
    ].map((sku) => ({
      sku,
      image: '',
      id: '',
      name: '',
      isMissing: true,
    }));
    return [...products, ...missingProducts];
  }
  throw new Error(`Request failed with status ${response.statusCode}`);
}

export async function fetchCategories(
  config: ConfigurationParameters,
  _search: string,
  pagination: { offset: number; limit: number }
): Promise<{
  pagination: Pagination;
  products: Product[];
}> {
  const client = createClient(config);
  const response = await client
    .categories()
    .get({
      queryArgs: {
        limit: pagination?.limit,
        offset: pagination?.offset,
      },
    })
    .execute();

  if (response.statusCode === 200) {
    return {
      pagination: {
        offset: response.body.offset,
        total: response.body.total!,
        count: response.body.count,
        limit: response.body.limit,
        hasNextPage: response.body.offset + response.body.count < response.body.total!,
      },
      products: response.body.results.map(categoryTransformer(config)),
    };
  }

  throw new Error(`Request failed with status ${response.statusCode}`);
}
