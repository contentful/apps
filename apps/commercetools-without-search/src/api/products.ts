import { ProductProjection } from '@commercetools/platform-sdk';
import { Product, Pagination } from '@contentful/ecommerce-app-base';
import { ConfigurationParameters } from '../types';
import { createClient } from './client';

function productTransformer({ projectKey, locale, mcUrl }: ConfigurationParameters) {
  return (item: ProductProjection): Product => {
    const merchantCenterBaseUrl =
      mcUrl && mcUrl.length > 0 ? mcUrl : 'https://mc.europe-west1.gcp.commercetools.com';
    const id = item.id ?? '';
    const externalLink =
      (projectKey && id && `${merchantCenterBaseUrl}/${projectKey}/products/${id}/general`) || '';
    return {
      id,
      image: item.masterVariant?.images?.[0]?.url ?? '',
      name: item.name?.[locale ?? 'en'] ?? '',
      sku: item.masterVariant?.sku ?? '',
      externalLink,
    };
  };
}

export async function fetchProductPreviews(
  skus: string[],
  config: ConfigurationParameters
): Promise<Product[]> {
  if (skus.length === 0) {
    return [];
  }

  const searchQuery = skus
    ? {
        queryArgs: {
          where: `masterVariant(sku in (${skus.map((sku) => `"${sku}"`).join(',')}))`,
        },
      }
    : {};

  const client = createClient(config);
  const response = await client.productProjections().get(searchQuery).execute();

  if (response.statusCode === 200) {
    const products = response.body.results.map(productTransformer(config));
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
  throw new Error(`Request failed with status ${response.statusCode}`);
}

export async function fetchProducts(
  config: ConfigurationParameters,
  search: string
): Promise<{
  pagination: Pagination;
  products: Product[];
}> {
  const searchQuery = search
    ? {
        queryArgs: {
          where: `name(${config.locale ?? 'en'}="${search}")`,
        },
      }
    : {};

  const client = createClient(config);
  const response = await client.productProjections().get(searchQuery).execute();

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
