import { ProductProjection } from '@commercetools/platform-sdk';
import { Product, Pagination } from '@contentful/ecommerce-app-base';
import { ConfigurationParameters } from '../types';
import { createClient } from './client';

const FETCH_LIMIT = 100;

function productTransformer({ projectKey, locale }: ConfigurationParameters) {
  return (item: ProductProjection): Product => {
    const id = item.id ?? '';
    const externalLink =
      (projectKey && id && `https://mc.commercetools.com/${projectKey}/products/${id}/general`) ||
      '';
    return {
      id,
      image: item.masterVariant?.images?.[0]?.url ?? '',
      name: item.name?.[locale ?? 'en'] ?? '',
      sku: item.masterVariant?.sku ?? '',
      externalLink,
    };
  };
}

async function fetchAllProductPreviews(
  client: ReturnType<typeof createClient>,
  products: ProductProjection[] = [],
  skus: string[],
  pagination?: { offset?: number; limit?: number }
): Promise<ProductProjection[]> {
  if (skus.length === 0) {
    return [];
  }

  let nextPageProducts: ProductProjection[] = [];

  const response = await client
    .productProjections()
    .search()
    .get({
      queryArgs: {
        'filter.query': [`variants.sku:${skus.map((sku) => `"${sku}"`).join(',')}`],
        offset: pagination?.offset || 0,
        limit: pagination?.limit || FETCH_LIMIT,
      },
    })
    .execute();

  if (response.statusCode === 200 && response.body.total) {
    const hasNextPage = response.body.offset + response.body.count < response.body.total;
    const combinedResults = [...products, ...response.body.results];

    if (hasNextPage) {
      nextPageProducts = await fetchAllProductPreviews(client, combinedResults, skus, {
        offset: response.body.count,
        limit: response.body.total - response.body.count,
      });

      return [...products, ...nextPageProducts];
    }

    return combinedResults;
  }
  throw new Error(`Request failed with status ${response.statusCode}`);
}

export async function fetchProductPreviews(
  skus: string[],
  config: ConfigurationParameters
): Promise<Product[]> {
  const client = createClient(config);
  const products = (await fetchAllProductPreviews(client, [], skus)).map(
    productTransformer(config)
  );
  const foundSKUs = products.map((product: Product) => product.sku);
  const missingProducts = skus
    .filter((sku) => !foundSKUs.includes(sku))
    .map((sku) => ({
      sku,
      image: '',
      id: '',
      name: '',
      isMissing: true,
    }));
  return [...products, ...missingProducts];
}

export async function fetchProducts(
  config: ConfigurationParameters,
  search: string,
  pagination: { offset: number; limit: number }
): Promise<{
  pagination: Pagination;
  products: Product[];
}> {
  const client = createClient(config);
  const response = await client
    .productProjections()
    .search()
    .get({
      queryArgs: {
        [`text.${config.locale}`]: search,
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
      products: response.body.results.map(productTransformer(config)),
    };
  }

  throw new Error(`Request failed with status ${response.statusCode}`);
}
