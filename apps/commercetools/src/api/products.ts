import { ProductProjection } from '@commercetools/platform-sdk';
import { Product, Pagination } from '@contentful/ecommerce-app-base';
import { ConfigurationParameters } from '../types';
import { createClient } from './client';

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
  pagination?: { offset: number }
): Promise<ProductProjection[]> {
  if (skus.length === 0) {
    return [];
  }

  const STEP = 20;
  let nextPageProducts: ProductProjection[] = [];

  const response = await client
    .productProjections()
    .search()
    .get({
      queryArgs: {
        'filter.query': [`variants.sku:${skus.map((sku) => `"${sku}"`).join(',')}`],
        offset: pagination?.offset,
      },
    })
    .execute();

  if (response.statusCode === 200) {
    const hasNextPage = response.body.offset + response.body.count < response.body.total!;

    if (hasNextPage) {
      nextPageProducts = await fetchAllProductPreviews(
        client,
        [...products, ...response.body.results],
        skus,
        {
          offset: response.body.offset + STEP,
        }
      );

      return [...products, ...nextPageProducts];
    }

    return [...products, ...response.body.results];
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
