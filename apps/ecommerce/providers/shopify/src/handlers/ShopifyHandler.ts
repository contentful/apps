import { ShopifyClientConfig } from '../types/types';
import ShopifyBuy, { Product } from 'shopify-buy';

export interface ShopifyError {
  cause: {
    errno: number;
    code: string;
    syscall: string;
    hostname: string;
  };
}

export class ShopifyClientError implements ShopifyError {
  cause: {
    errno: number;
    code: string;
    syscall: string;
    hostname: string;
  };

  constructor(error: ShopifyError) {
    this.cause = error.cause;
  }
}

const makeClient = (params: ShopifyClientConfig): ShopifyBuy => {
  return ShopifyBuy.buildClient({
    ...params,
    apiVersion: '2023-04', // TODO: Fix this hardcoding
  });
};

export const fetchProduct = async (
  params: ShopifyClientConfig,
  id: string
): Promise<Product | void> => {
  try {
    const client = makeClient(params);
    return await client.product.fetch(id);
  } catch (error: unknown) {
    if (typeof error === 'object' && !!Object.getOwnPropertyDescriptor(error, 'cause')) {
      throw new ShopifyClientError(<ShopifyError>error);
    }
  }
};

export const fetchProducts = async (params: ShopifyClientConfig): Promise<Product[] | void> => {
  try {
    const client = makeClient(params);
    return await client.product.fetchAll();
  } catch (error: unknown) {
    if (typeof error === 'object' && !!Object.getOwnPropertyDescriptor(error, 'cause')) {
      throw new ShopifyClientError(<ShopifyError>error);
    }
  }
};
