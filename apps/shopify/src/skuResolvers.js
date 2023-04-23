import identity from 'lodash/identity';
import difference from 'lodash/difference';
import Client from 'shopify-buy';
import makeProductVariantPagination from './productVariantPagination';
import makeProductPagination from './productPagination';
import makeCollectionPagination from './collectionPagination';
import {
  productDataTransformer,
  collectionDataTransformer,
  removeHttpsAndTrailingSlash,
} from './dataTransformer';

import { validateParameters } from '.';
import { previewsToProductVariants } from './dataTransformer';
import { SHOPIFY_API_VERSION, SHOPIFY_ENTITY_LIMIT } from './constants';
import {
  convertStringToBase64,
  convertBase64ToString,
  convertCollectionToBase64,
  convertProductToBase64,
} from './utils/base64';

export async function makeShopifyClient(config) {
  const validationError = validateParameters(config);
  if (validationError) {
    throw new Error(validationError);
  }

  const { storefrontAccessToken, apiEndpoint } = config;

  return Client.buildClient({
    domain: removeHttpsAndTrailingSlash(apiEndpoint),
    storefrontAccessToken,
    apiVersion: SHOPIFY_API_VERSION,
  });
}

const graphqlRequest = async (config, query) => {
  const { apiEndpoint, storefrontAccessToken } = config;
  const url = `https://${removeHttpsAndTrailingSlash(
    apiEndpoint
  )}/api/${SHOPIFY_API_VERSION}/graphql`;

  const response = await window.fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-shopify-storefront-access-token': storefrontAccessToken,
    },
    body: JSON.stringify({ query }),
  });

  return await response.json();
};

const paginateGraphQLRequest = async (config, ids, queryFunction) => {
  const requests = [];
  for (let i = 0; i < ids.length; i += SHOPIFY_ENTITY_LIMIT) {
    const currentIdPage = ids.slice(i, i + (SHOPIFY_ENTITY_LIMIT - 1));
    const query = queryFunction(currentIdPage);

    requests.push(graphqlRequest(config, query));
  }

  return (await Promise.all(requests)).flatMap((res) => res.data.nodes);
};

/**
 * Fetches a maximum of 250 previews per request.
 */
const collectionQuery = (validIds) => {
  const queryIds = validIds.map((sku) => `"${sku}"`).join(',');
  return `
  {
    nodes (ids: [${queryIds}]) {
      id,
      ...on Collection {
        handle,
        title,
        image {
          src
        }
      }
    }
  }
  `;
};

/**
 * Fetches the collection previews for the collections selected by the user.
 */
export const fetchCollectionPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  const validIds = filterAndDecodeValidIds(skus, 'Collection');

  const response = await paginateGraphQLRequest(config, validIds, collectionQuery);
  const collections = response.map((res) => res && convertCollectionToBase64(res));

  return validIds.map((validId) => {
    const collection = collections.find(
      (collection) => collection?.id === convertStringToBase64(validId)
    );
    return collection
      ? collectionDataTransformer(collection, config.apiEndpoint)
      : {
          sku: convertStringToBase64(validId),
          isMissing: true,
          image: '',
          id: convertStringToBase64(validId),
          name: '',
        };
  });
};

/**
 * Fetches the product previews for the products selected by the user.
 */
export const fetchProductPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }
  const validIds = filterAndDecodeValidIds(skus, 'Product');
  const shopifyClient = await makeShopifyClient(config);

  const requests = [];
  for (let i = 0; i < validIds.length; i += SHOPIFY_ENTITY_LIMIT) {
    const currentIdPage = validIds.slice(i, i + (SHOPIFY_ENTITY_LIMIT - 1));
    requests.push(shopifyClient.product.fetchMultiple(currentIdPage));
  }

  const response = (await Promise.all(requests)).flat();
  const products = response.map((res) => res && convertProductToBase64(res));

  return validIds.map((validId) => {
    const product = products.find((product) => product?.id === convertStringToBase64(validId));

    return product
      ? productDataTransformer(product, config.apiEndpoint)
      : {
          sku: convertStringToBase64(validId),
          isMissing: true,
          image: '',
          id: convertStringToBase64(validId),
          name: '',
        };
  });
};

/**
 * Fetches 250 product variant previews for the product selected by the user.
 */
const productVariantQuery = (validIds) => {
  const queryIds = validIds.map((sku) => `"${sku}"`).join(',');
  return `
  {
    nodes (ids: [${queryIds}]) {
      id,
      ...on ProductVariant {
        sku,
        image {
          src: originalSrc
        },
        title,
        product {
          id,
          title
        }
      }
    }
  }
  `;
};

/**
 * Fetches the product variant previews for the product variants selected by the user.
 */
export const fetchProductVariantPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  const validIds = filterAndDecodeValidIds(skus, 'ProductVariant');

  const response = await paginateGraphQLRequest(config, validIds, productVariantQuery);
  const nodes = response.filter(identity).map((node) => convertProductToBase64(node));

  const variantPreviews = nodes.map(previewsToProductVariants(config));
  const missingVariants = difference(
    skus,
    variantPreviews.map((variant) => variant.sku)
  ).map((sku) => ({ sku, isMissing: true, name: '', image: '' }));

  return [...variantPreviews, ...missingVariants];
};

/**
 * Fetches the product variants searched by the user
 *
 * Shopify does not support indexed pagination, only infinite scrolling
 * @see https://community.shopify.com/c/Shopify-APIs-SDKs/How-to-display-more-than-20-products-in-my-app-when-products-are/td-p/464090 for more details (KarlOffenberger's answer)
 */
export const makeProductVariantSearchResolver = async (sdk) => {
  const pagination = await makeProductVariantPagination(sdk);
  return (search) => pagination.fetchNext(search);
};

export const makeProductSearchResolver = async (sdk) => {
  const pagination = await makeProductPagination(sdk);
  return (search) => pagination.fetchNext(search);
};

export const makeCollectionSearchResolver = async (sdk) => {
  const pagination = await makeCollectionPagination(sdk);
  return (search) => pagination.fetchNext(search);
};

export const filterAndDecodeValidIds = (skus, skuType) => {
  const validIds = skus
    .map((sku) => {
      try {
        // If not valid base64 window.atob will throw
        const decodedId = convertBase64ToString(sku);
        return decodedId;
      } catch (error) {
        return null;
      }
    })
    .filter((decodedId) => decodedId && new RegExp(`^gid.*${skuType}`).test(decodedId));
  return validIds;
};

/**
 * Selects search resolver based on skuType

 */
export const makeSkuResolver = async (sdk, skuType) => {
  if (skuType === 'product') {
    return makeProductSearchResolver(sdk);
  }

  if (skuType === 'collection') {
    return makeCollectionSearchResolver(sdk);
  }

  return makeProductVariantSearchResolver(sdk);
};
