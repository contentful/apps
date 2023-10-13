import type {
  ProductProjection,
  AttributeDefinition,
  Attribute,
} from '@commercetools/platform-sdk';
import { Pagination } from '@contentful/ecommerce-app-base';
import { CommerceToolsProduct, ConfigurationParameters } from '../types';
import { createClient } from './client';
import { getLocalizedValue } from './localisation-helpers';

const MAX_LIMIT = 500;

function getProductAttributes(definitions: AttributeDefinition[], attributes: Attribute[]) {
  const indexedDefinitions = definitions.reduce(
    (acc, definition) => {
      acc[definition.name] = definition;

      return acc;
    },
    {} as Record<string, AttributeDefinition>
  );
  const productAttributes: { name: string; value: string }[] = [];

  for (const attribute of attributes) {
    const attributeDefinition = indexedDefinitions[attribute.name] ?? {};
    const name = getLocalizedValue(attributeDefinition.label) ?? attribute.name;
    let value = attribute.value;

    if (typeof value === 'object' && value !== undefined) {
      value = getLocalizedValue(value);
    }

    productAttributes.push({ name, value: String(value) });
  }

  return productAttributes;
}

function productTransformer({ projectKey, locale, mcUrl }: ConfigurationParameters) {
  return (item: ProductProjection): CommerceToolsProduct => {
    const merchantCenterBaseUrl =
      mcUrl && mcUrl.length > 0 ? mcUrl : 'https://mc.europe-west1.gcp.commercetools.com';
    const id = item.id ?? '';
    const externalLink =
      (projectKey && id && `${merchantCenterBaseUrl}/${projectKey}/products/${id}/general`) || '';

    const attributeDefinitions = item.productType.obj?.attributes ?? [];
    const attributes = item.masterVariant.attributes ?? [];

    return {
      id,
      image: item.masterVariant?.images?.[0]?.url ?? '',
      name: getLocalizedValue(item.name) ?? '',
      sku: item.masterVariant?.sku ?? '',
      externalLink,
      description: getLocalizedValue(item.description),
      additionalData: {
        createdAt: item.createdAt,
        updatedAt: item.lastModifiedAt,
        attributes: getProductAttributes(attributeDefinitions, attributes),
      },
    };
  };
}

export async function fetchProductPreviews(
  skus: string[],
  config: ConfigurationParameters
): Promise<CommerceToolsProduct[]> {
  if (skus.length === 0) {
    return [];
  }

  const client = createClient(config);
  const response = await client
    .productProjections()
    .search()
    .get({
      queryArgs: {
        expand: ['description', 'productType'],
        'filter.query': [`variants.sku:${skus.map((sku) => `"${sku}"`).join(',')}`],
        limit: MAX_LIMIT,
      },
    })
    .execute();

  if (response.statusCode === 200) {
    const products = response.body.results.map(productTransformer(config));
    const foundSKUs = products.map((product: CommerceToolsProduct) => product.sku);
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
  search: string,
  pagination: { offset: number; limit: number }
): Promise<{
  pagination: Pagination;
  products: CommerceToolsProduct[];
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
