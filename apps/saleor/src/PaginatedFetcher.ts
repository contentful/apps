import { uniq } from 'lodash';
import { ClientConfig, Identifiers, ProductVariantsData } from './types';
import { Pagination, Product } from 'shared-sku-app';
import DataParser from './DataParser';
import ApiClient from './ApiClient';
import { extractProductsAndVariantsIdentifiers } from './utils';
import { defaultPagination } from './constants';

interface FetcherPagination {
  paginationInfo?: Pagination;
  endCursor?: string;
  productIds?: Identifiers;
}

class PaginatedFetcher {
  apiClient: ApiClient;
  endCursor: string = '';
  previousCursor: string = '';
  lastSearch?: string;
  productsIds: string[] = [];
  lastPaginationInfo: Pagination = defaultPagination;

  constructor({ apiEndpoint }: ClientConfig) {
    this.apiClient = new ApiClient({ apiEndpoint });
  }

  getVariantsWithProducts = async (search: string) => {
    if (this.shouldReturnNoProducts(search)) {
      return this.getNoItemsResponse();
    }

    this.resetPagination(search);

    const data = await this.getVariantsByNameOrSKU(search);
    const parsedData = new DataParser(data, this.productsIds).getParsedData();

    this.updatePagination(data);
    return parsedData;
  };

  private getVariantsByNameOrSKU = async (search: string) => {
    const dataByName = await this.apiClient.fetchVariants({ search, endCursor: this.endCursor });

    if (dataByName.totalCount === 0) {
      const skusOfSearch = search.split(' ');
      const dataBySkus = await this.apiClient.fetchVariants({
        skus: skusOfSearch,
        endCursor: this.endCursor,
      });
      return dataBySkus;
    }

    return dataByName;
  };

  getProductsAndVariantsByIdOrSKU = async (identifiers: Identifiers) => {
    const { productIds, variantSkus } = extractProductsAndVariantsIdentifiers(identifiers);

    let result: Product[] = [];

    if (productIds.length > 0) {
      const productsData = await this.apiClient.fetchProducts({ productIds });
      const parsedProducts = new DataParser(productsData).getParsedItems();
      result = [...parsedProducts];
    }

    if (variantSkus.length > 0) {
      const variantsData = await this.apiClient.fetchVariants({ skus: variantSkus });
      const parsedVariants = new DataParser(variantsData).getParsedItems();
      result = [...result, ...parsedVariants];
    }

    return result;
  };

  // hack for avoiding doubled requests when using sku app search field
  private shouldReturnNoProducts = (search?: string) =>
    search === this.lastSearch && !this.endCursor && this.previousCursor;

  private getNoItemsResponse = () => ({
    pagination: this.lastPaginationInfo,
    products: [],
  });

  private resetPagination = (search?: string) => {
    if (search === this.lastSearch) {
      return;
    }

    this.updateSearch(search);
    this.setPagination();
  };

  private updatePagination = (data: ProductVariantsData) => {
    const dataParser = new DataParser(data);

    this.setPagination({
      paginationInfo: dataParser.getParsedData().pagination,
      endCursor: data.pageInfo.endCursor,
      productIds: uniq([
        ...this.productsIds,
        ...dataParser.getProductOfVariantsIds(),
      ]) as Identifiers,
    });
  };

  private updateSearch = (search?: string) => {
    this.lastSearch = search;
  };

  private setPagination = (
    { paginationInfo = defaultPagination, endCursor = '', productIds = [] }: FetcherPagination = {
      paginationInfo: defaultPagination,
      endCursor: '',
      productIds: [],
    }
  ) => {
    this.previousCursor = this.endCursor;
    this.endCursor = endCursor;
    this.lastPaginationInfo = paginationInfo;
    this.productsIds = productIds;
  };
}

export default PaginatedFetcher;
