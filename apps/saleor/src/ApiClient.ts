import { print } from 'graphql/language/printer';
import { DocumentNode } from 'graphql';
import { fetchProductsQuery, fetchProductVariantsQuery } from './queries';
import { ClientConfig, Identifiers, ProductsData, ProductVariantsData } from './types';

type FetchVariantsParams = {
  search?: string;
  skus?: Identifiers;
  endCursor?: string;
};

type FetchProductsParams = {
  productIds?: Identifiers;
};

class ApiClient {
  private apiEndpoint: string;

  constructor({ apiEndpoint }: ClientConfig) {
    this.apiEndpoint = apiEndpoint;
  }

  fetchVariants = async ({
    search,
    skus,
    endCursor
  }: FetchVariantsParams): Promise<ProductVariantsData> => {
    const res = await this.fetch(fetchProductVariantsQuery(search, skus, endCursor));

    const {
      data: { productVariants }
    } = await res.json();

    return productVariants;
  };

  fetchProducts = async ({ productIds }: FetchProductsParams): Promise<ProductsData> => {
    const res = await this.fetch(fetchProductsQuery(productIds));

    const {
      data: { products }
    } = await res.json();

    return products;
  };

  private fetch = (query: DocumentNode) =>
    window.fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: print(query) })
    });
}

export default ApiClient;
