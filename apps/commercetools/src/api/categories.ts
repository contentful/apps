import { Category } from '@commercetools/platform-sdk';
import { Pagination } from '@contentful/ecommerce-app-base';
import { CommerceToolsProduct, ConfigurationParameters } from '../types';
import { createClient } from './client';
import { getLocalizedValue } from './localisation-helpers';

function categoryTransformer({ projectKey, locale, mcUrl }: ConfigurationParameters) {
  return (item: Category): CommerceToolsProduct => {
    const merchantCenterBaseUrl =
      mcUrl && mcUrl.length > 0 ? mcUrl : 'https://mc.europe-west1.gcp.commercetools.com';
    const id = item.id ?? '';
    const externalLink =
      (projectKey && id && `${merchantCenterBaseUrl}/${projectKey}/categories/${id}/general`) || '';

    return {
      id,
      sku: id,
      displaySKU: getLocalizedValue(item.slug),
      name: getLocalizedValue(item.name) ?? '',
      image: item.assets?.[0]?.sources?.[0]?.uri ?? '',
      externalLink,
      description: getLocalizedValue(item.description),
      additionalData: {
        createdAt: item.createdAt,
        updatedAt: item.lastModifiedAt,
        attributes: [],
      },
    };
  };
}

const CATEGORY_ID_REGEX = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/;

export async function fetchCategoryPreviews(
  ids: string[],
  config: ConfigurationParameters
): Promise<CommerceToolsProduct[]> {
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

    const foundSKUs = products.map((product: CommerceToolsProduct) => product.id);
    const missingProducts = [
      ...validIds.filter((id) => !foundSKUs.includes(id)),
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
  search: string,
  pagination: { offset: number; limit: number }
): Promise<{
  pagination: Pagination;
  products: CommerceToolsProduct[];
}> {
  const client = createClient(config);
  let response;

  if (search) {
    response = await client
      .categories()
      .get({
        queryArgs: {
          limit: pagination?.limit,
          offset: pagination?.offset,
          where: `key="${search}" or name(${config.locale}="${search}") or slug(${config.locale}="${search}")`,
        },
      })
      .execute();
  } else {
    response = await client
      .categories()
      .get({
        queryArgs: {
          limit: pagination?.limit,
          offset: pagination?.offset,
        },
      })
      .execute();
  }

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
