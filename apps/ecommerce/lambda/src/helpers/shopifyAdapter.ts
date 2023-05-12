import { Product } from 'shopify-buy';
import { ExternalResource } from '../types';

export const convertResponseToResource = (product: Product): ExternalResource => {
  return {
    name: product.title,
    description: product.description,
    image: product.images[0].url,
    status: product.availableForSale ? 'Available' : 'Not Available',
    extras: {},
  };
};
