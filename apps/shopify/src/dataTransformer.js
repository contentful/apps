import get from 'lodash/get';
import last from 'lodash/last';
import flatten from 'lodash/flatten';
import { DEFAULT_SHOPIFY_VARIANT_TITLE } from './constants';

/**
 * Transforms the API response of Shopify collections into
 * the product schema expected by the SkuPicker component
 */
export const collectionDataTransformer = (collection, apiEndpoint) => {
  const image = get(collection, ['image', 'src'], '');
  const handle = get(collection, ['handle'], undefined);

  let externalLink;

  if (apiEndpoint) {
    try {
      const collectionIdDecoded = atob(collection.id);
      const collectionId =
        collectionIdDecoded && collectionIdDecoded.slice(collectionIdDecoded.lastIndexOf('/') + 1);

      if (apiEndpoint && collectionId) {
        externalLink = `https://${apiEndpoint}${
          last(apiEndpoint) === '/' ? '' : '/'
        }admin/collections/${collectionId}`;
      }
    } catch {}
  }

  return {
    id: collection.id,
    image,
    name: collection.title,
    displaySKU: handle ? `Handle: ${handle}` : `Collection ID: ${collection.id}`,
    sku: collection.id,
    ...(externalLink ? { externalLink } : {}),
  };
};

/**
 * Transforms the API response of Shopify products into
 * the product schema expected by the SkuPicker component
 */
export const productDataTransformer = (product, apiEndpoint) => {
  const image = get(product, ['images', 0, 'src'], '');
  const sku = get(product, ['variants', 0, 'sku'], undefined);
  let externalLink;

  if (apiEndpoint) {
    try {
      const productIdDecoded = atob(product.id);
      const productId =
        productIdDecoded && productIdDecoded.slice(productIdDecoded.lastIndexOf('/') + 1);

      if (apiEndpoint && productId) {
        externalLink = `https://${apiEndpoint}${
          last(apiEndpoint) === '/' ? '' : '/'
        }admin/products/${productId}`;
      }
    } catch {}
  }

  return {
    id: product.id,
    image,
    name: product.title,
    displaySKU: sku ? `SKU: ${sku}` : `Product ID: ${product.id}`,
    sku: product.id,
    ...(externalLink ? { externalLink } : {}),
  };
};

/**
 * Transforms the API response of Shopify product variants into
 * the product schema expected by the SkuPicker component
 */
export const productVariantDataTransformer = (product) => {
  const image = get(product, ['image', 'src'], '');
  const sku = get(product, ['sku'], '');
  const variantSKU = get(product, ['variantSKU'], '');

  return {
    id: product.id,
    image,
    name: product.title,
    displaySKU: variantSKU ? `SKU: ${variantSKU}` : `Product ID: ${sku}`,
    sku,
  };
};

export const productsToVariantsTransformer = (products) =>
  flatten(
    products.map((product) => {
      const variants = product.variants.map((variant) => ({
        ...variant,
        variantSKU: variant.sku,
        sku: variant.id,
        productId: product.id,
        title:
          variant.title === DEFAULT_SHOPIFY_VARIANT_TITLE
            ? product.title
            : `${product.title} (${variant.title})`,
      }));
      return variants;
    })
  );

export const previewsToProductVariants =
  ({ apiEndpoint }) =>
  ({ sku, id, image, product, title }) => {
    const productIdDecoded = atob(product.id);
    const productId =
      productIdDecoded && productIdDecoded.slice(productIdDecoded.lastIndexOf('/') + 1);
    return {
      id,
      image: get(image, ['src'], ''),
      // TODO: Remove sku:id when @contentful/ecommerce-app-base supports internal IDs
      // as an alternative piece of info to persist instead of the SKU.
      // For now this is a temporary hack.
      sku: id,
      displaySKU: sku ? `SKU: ${sku}` : `Product ID: ${id}`,
      productId: product.id,
      name: title === DEFAULT_SHOPIFY_VARIANT_TITLE ? product.title : `${product.title} (${title})`,
      ...(apiEndpoint &&
        productId && {
          externalLink: `https://${apiEndpoint}${
            last(apiEndpoint) === '/' ? '' : '/'
          }admin/products/${productId}`,
        }),
    };
  };
