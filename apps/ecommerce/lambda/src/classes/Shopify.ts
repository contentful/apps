import ShopifyBuy, { Product } from 'shopify-buy';

export interface ShopifyError {
  cause: {
    errno: number;
    code: string;
    syscall: string;
    hostname: string;
  };
}

export interface ShopifyParams {
  domain: string;
  storefrontAccessToken: string;
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

export class ShopifyProvider {
  client: ShopifyBuy;

  constructor(params: ShopifyParams) {
    this.client = this.makeClient(params);
  }

  private makeClient(params: ShopifyParams): ShopifyBuy {
    return ShopifyBuy.buildClient({
      ...params,
      apiVersion: '2023-04',
    });
  }

  public async fetchProduct(id: string): Promise<Product | void> {
    try {
      return await this.client.product.fetch(id);
    } catch (error: unknown) {
      if (typeof error === 'object' && !!Object.getOwnPropertyDescriptor(error, 'cause')) {
        throw new ShopifyClientError(<ShopifyError>error);
      }
    }
  }
}
