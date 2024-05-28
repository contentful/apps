import { Product } from '../types';

export type ExternalResource = Product;

// the variant states of ProductCard, for now, labeled by location
export type ProductCardType = 'field' | 'dialog';

export type ExternalResourceError = {
  error: string;
  errorMessage: string;
  errorStatus: number;
};
