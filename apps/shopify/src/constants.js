// If one creates product with no variants in Shopify, a default variant is
// returned with this unfortunate title, and there is no other way to check
// whether the returned variant is the default one or not
export const DEFAULT_SHOPIFY_VARIANT_TITLE = 'Default Title';

export const SKU_TYPES = [
  {
    id: 'product',
    name: 'Product',
  },
  {
    id: 'variant',
    name: 'Product variant',
    default: true,
  },
  {
    id: 'collection',
    name: 'Collection',
  },
];
