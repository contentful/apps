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

export async function makeShopifyClient(config) {
  const validationError = validateParameters(config);
  if (validationError) {
    throw new Error(validationError);
  }

  const { storefrontAccessToken, apiEndpoint } = config;

  return Client.buildClient({
    domain: apiEndpoint,
    storefrontAccessToken,
  });
}

/**
 * Fetches the collection previews for the collections selected by the user.
 *
 * Note: currently there is no way to fetch multiple collections by id
 * so we use fetchAll instead and then filter on the client. Besides the obvious disadvantage,
 * this could also fail if there are mo collections in the stroe than the pagination limit
 */
export const fetchCollectionPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  const shopifyClient = await makeShopifyClient(config);
  const collections = (await shopifyClient.collection.fetchAll(250)).filter((collection) =>
    skus.includes(collection.id)
  );

  return skus.map((sku) => {
    const collection = collections.find((collection) => collection.id === sku);

    return collection
      ? collectionDataTransformer(collection, config.apiEndpoint)
      : {
          sku,
          isMissing: true,
          image: '',
          id: sku,
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

  const shopifyClient = await makeShopifyClient(config);
  const products = await shopifyClient.product.fetchMultiple(skus);

  return skus.map((sku) => {
    const product = products.find((product) => product?.id === sku);

    return product
      ? productDataTransformer(product, config.apiEndpoint)
      : {
          sku,
          isMissing: true,
          image: '',
          id: sku,
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

  const validIds = skus
    .map((sku) => {
      try {
        // If not valid base64 window.atob will throw
        const unencodedId = atob(sku);
        return { unencodedId, sku };
      } catch (error) {
        return null;
      }
    })
    .filter((sku) => sku && /^gid.*ProductVariant/.test(sku.unencodedId))
    .map(({ sku }) => sku);

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

  const res = await window.fetch(`https://${apiEndpoint}/api/2019-10/graphql`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-shopify-storefront-access-token': storefrontAccessToken,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();

  const nodes = get(data, ['data', 'nodes'], []).filter(identity);

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
