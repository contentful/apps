/**
 * Used to sort fetched products previews in the same
 * order that the SKUs were added to the field value.
 * @see https://gist.github.com/ecarter/1423674
 */
import { Product } from './types';

export const mapSort = <T extends Product, K extends keyof T>(
  array: T[],
  order: (T[K] | string)[],
  key: K
): T[] => {
  return array.slice().sort((a, b) => {
    const A = a[key];
    const B = b[key];
    return order.indexOf(A) > order.indexOf(B) ? 1 : -1;
  });
};
