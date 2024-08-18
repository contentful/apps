import { Product } from './interfaces';
/**
 * Used to sort fetched products previews in the same
 * order that the SKUs were added to the field value.
 * @see https://gist.github.com/ecarter/1423674
 */
export const mapSort = <T extends Product, K extends keyof T>(
  array: T[],
  order: (T[K] | string)[],
  key: K,
): T[] => {
  const sorted = array.slice().sort((a, b) => {
    const A = a[key];
    const B = b[key];
    return order.indexOf(A) > order.indexOf(B) ? 1 : -1;
  });
  return sorted;
};

/**
 * Formats the product url saved to the field for the given sku
 * @param sku
 * @param apiEndpoint
 * @param baseSite
 * @returns string
 */
export const formatProductUrl = (
  apiEndpoint: string,
  baseSite: string,
  sku: string,
): string => {
  return `${apiEndpoint}/occ/v2/${baseSite}/products/${sku}`;
};
