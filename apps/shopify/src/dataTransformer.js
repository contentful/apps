import get from 'lodash/get';
import last from 'lodash/last';
import flatten from 'lodash/flatten';

/**
 * Transforms the API response of Shopify into
 * the product schema expected by the SkuPicker component
 */
export const dataTransformer = product => {
  const image = get(product, ['image', 'src'], '');
  const sku = get(product, ['sku'], '');
  const variantSKU = get(product, ['variantSKU'], '');

  return {
    id: product.id,
    image,
    name: product.title,
    displaySKU: variantSKU !== '' ? `SKU: ${variantSKU}` : `Product ID: ${sku}`,
    sku,
  };
};

export const productsToVariantsTransformer = products =>
  flatten(
    products.map(product => {
      const variants = product.variants.map(variant => ({
        ...variant,
        variantSKU: variant.sku,
        sku: variant.id,
        productId: product.id,
        title: product.title,
      }));
      return variants;
    })
  );

export const previewsToVariants = ({ apiEndpoint }) => ({ sku, id, image, product }) => {
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
    displaySKU: sku !== '' ? `SKU: ${sku}` : `Product ID: ${id}`,
    productId: product.id,
    name: product.title,
    ...(apiEndpoint &&
      productId && {
        externalLink: `https://${apiEndpoint}${
          last(apiEndpoint) === '/' ? '' : '/'
        }admin/products/${productId}`,
      }),
  };
};
