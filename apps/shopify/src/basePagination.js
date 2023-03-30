import differenceBy from 'lodash/differenceBy';
import { makeShopifyClient } from './skuResolvers';
import { convertProductToBase64 } from './utils/base64';

const PER_PAGE = 20;

export default class BasePagination {
  hasNextProductPage = false;
  products = [];

  prevSearch = '';

  constructor({ sdk, dataTransformer, fetchProducts }) {
    this.sdk = sdk;
    this.dataTransformer = dataTransformer;
    this.fetchProducts = fetchProducts;
  }

  async init() {
    this.shopifyClient = await makeShopifyClient(this.sdk.parameters.installation);
  }

  async fetchNext(search) {
    const searchHasChanged = search !== this.prevSearch;

    if (searchHasChanged) {
      this.prevSearch = search;
      this._resetPagination();
    }

    const products = await this._fetchMoreProducts(search);

    return {
      pagination: {
        hasNextPage: this.hasNextProductPage,
      },
      products: products.map((product) => {
        return this.dataTransformer(product);
      }),
    };
  }

  /**
   * This method will either fetch the first batch of products or the next page
   * in the pagination based on the user search and depending on whether the user
   * has already requested an initial batch of products or not
   */
  async _fetchMoreProducts(search) {
    const noProductsFetchedYet = this.products.length === 0;
    const nextProducts = noProductsFetchedYet
      ? await this._fetchProducts(search)
      : await this._fetchNextPage(this.products);

    this.hasNextProductPage = nextProducts.length === PER_PAGE;

    const newProducts = differenceBy(nextProducts, this.products, 'id');

    this.products = [...this.products, ...newProducts];

    return newProducts;
  }

  /**
   * This method is used when the user is fetching products for the first time.
   * i.e. when they just opened the product picker widget or when they just applied
   * a new search term.
   */
  async _fetchProducts(search) {
    return this.fetchProducts(search, PER_PAGE);
  }

  /**
   * This method is used when the user has already fetched a batch of products
   * and now want to render the next page.
   */
  async _fetchNextPage(products) {
    const nextPage = (await this.shopifyClient.fetchNextPage(products)).model;
    return nextPage.map((product) => convertProductToBase64(product));
  }

  _resetPagination() {
    this.products = [];
  }
}
