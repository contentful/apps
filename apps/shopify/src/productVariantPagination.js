import last from 'lodash/last';
import uniqBy from 'lodash/uniqBy';
import sortBy from 'lodash/sortBy';
import { productVariantDataTransformer, productsToVariantsTransformer } from './dataTransformer';
import { makeShopifyClient } from './skuResolvers';
import { convertProductToBase64 } from './utils/base64';

const PER_PAGE = 20;

class Pagination {
  freshSearch = true;

  hasNextProductPage = false;
  products = [];

  variants = [];

  prevSearch = '';

  constructor(sdk) {
    this.sdk = sdk;
  }

  async init() {
    this.shopifyClient = await makeShopifyClient(this.sdk.parameters.installation);
  }

  async fetchNext(search, recursing = false) {
    const searchHasChanged = search !== this.prevSearch;
    const shouldStop = searchHasChanged && recursing;
    if (shouldStop) {
      return;
    }

    if (searchHasChanged) {
      this.prevSearch = search;
      this._resetPagination();
    }

    // If there is a satisfactory size of variants to fill the next
    // page there is no need to fetch any more products and extract their variants
    // until the next click on the "Load more" button
    const nothingLeftToFetch =
      (!!this.products.length && !last(this.products).hasNextPage) ||
      (!this.freshSearch && !this.products.length);
    const hasEnoughVariantsToConsume = this.variants.length >= PER_PAGE || nothingLeftToFetch;
    if (hasEnoughVariantsToConsume) {
      const variants = this.variants.splice(0, PER_PAGE);
      return {
        pagination: {
          // There is going to be a next page in the following two complimentary cases:
          // A). There are more products to fetch via the Shopify API
          // B). There are variants left to consume in the in-memory variants list
          hasNextPage: this.hasNextProductPage || this.variants.length > 0,
        },
        products: variants.map(productVariantDataTransformer),
      };
    }

    // When there are not enough variants to fill the page, we need to fetch more products,
    // extract their variants and then call this method recursively to render the next page.
    await this._fetchMoreProducts(search);
    return this.fetchNext(search, true);
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
    this.hasNextProductPage =
      nextProducts.length > 0 && nextProducts.every((product) => product.hasNextPage);

    const nextVariants = productsToVariantsTransformer(nextProducts);
    this.products = uniqBy([...this.products, ...nextProducts], 'id');
    this.variants = sortBy(uniqBy([...this.variants, ...nextVariants], 'id'), ['title', 'sku']);

    this.freshSearch = false;
  }

  /**
   * This method is used when the user is fetching products for the first time.
   * i.e. when they just opened the product picker widget or when they just applied
   * a new search term.
   */
  async _fetchProducts(search) {
    const query = { query: `variants:['sku:${search}'] OR title:${search}` };
    const products = await this.shopifyClient.product.fetchQuery({
      first: PER_PAGE,
      sortBy: 'TITLE',
      reverse: true,
      ...(search.length && query),
    });

    return products.map((product) => convertProductToBase64(product));
  }

  /**
   * This method is used when the user has already fetched a batch of products
   * and now want to render the next page.
   */
  async _fetchNextPage(products) {
    const nextProductVariants = (await this.shopifyClient.fetchNextPage(products)).model;
    return nextProductVariants.map((nextProductVariant) =>
      convertProductToBase64(nextProductVariant)
    );
  }

  _resetPagination() {
    this.products = [];
    this.variants = [];
    this.freshSearch = true;
  }
}

const makePagination = async (sdk) => {
  const pagination = new Pagination(sdk);
  await pagination.init();
  return pagination;
};

export default makePagination;
