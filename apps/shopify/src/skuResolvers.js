import identity from 'lodash/identity';
import difference from 'lodash/difference';
import get from 'lodash/get';
import Client from 'shopify-buy';
import makeProductVariantPagination from './productVariantPagination';
import makeProductPagination from './productPagination';
import makeCollectionPagination from './collectionPagination';
import { productDataTransformer, collectionDataTransformer } from './dataTransformer';

import { validateParameters } from '.';
import { previewsToProductVariants } from './dataTransformer';
import { SHOPIFY_API_VERSION } from './constants';
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
    domain: apiEndpoint,
    storefrontAccessToken,
    apiVersion: SHOPIFY_API_VERSION,
  });
}

/**
 * Fetches the collection previews for the collections selected by the user.
 *
 * Note: currently there is no way to fetch multiple collections by id
 * so we use fetchAll instead and then filter on the client. Besides the obvious disadvantage,
 * this could also fail if there are no collections in the store than the pagination limit
 */
export const fetchCollectionPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  const validIds = filterAndDecodeValidIds(skus, 'Collection');

  const shopifyClient = await makeShopifyClient(config);

  const response = await shopifyClient.collection.fetchAll(250);
  const collections = response.map((res) => convertCollectionToBase64(res));

  return validIds.map((validId) => {
    const collection = collections.find(
      (collection) => collection.id === convertStringToBase64(validId)
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
 *
 * Note: currently there is no way to cover the edge case where the user
 *       would have more than 250 products selected. In such a case their
 *       selection would be cut off after product no. 250.
 */
export const fetchProductPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  const validIds = filterAndDecodeValidIds(skus, 'Product');
  const shopifyClient = await makeShopifyClient(config);
  const response = await shopifyClient.product.fetchMultiple(validIds);
  const products = response.map((res) => convertProductToBase64(res));
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
 * Fetches the product variant previews for the product variants selected by the user.
 *
 * Note: currently there is no way to cover the edge case where the user
 *       would have more than 250 variants selected. In such a case their
 *       selection would be cut off after variant no. 250.
 */
export const fetchProductVariantPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  const validIds = filterAndDecodeValidIds(skus, 'ProductVariant');
  const queryIds = validIds.map((sku) => `"${sku}"`).join(',');
  const query = `
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

  const { apiEndpoint, storefrontAccessToken } = config;

  const res = await window.fetch(`https://${apiEndpoint}/api/${SHOPIFY_API_VERSION}/graphql`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-shopify-storefront-access-token': storefrontAccessToken,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();

  const nodes = get(data, ['data', 'nodes'], [])
    .filter(identity)
    .map((node) => convertProductToBase64(node));

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
