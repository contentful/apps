import differenceBy from 'lodash/differenceBy';
import { collectionDataTransformer } from './dataTransformer';
import { makeShopifyClient } from './skuResolvers';

const PER_PAGE = 20;

class Pagination {
  freshSearch = true;

  hasNextProductPage = false;
  collections = [];

  prevSearch = '';

  constructor(sdk) {
    this.sdk = sdk;
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

    const collections = await this._fetchMoreCollections(search);

    return {
      pagination: {
        hasNextPage: this.hasNextProductPage
      },
      products: collections.map(collectionDataTransformer)
    };
  }

  /**
   * This method will either fetch the first batch of collections or the next page
   * in the pagination based on the user search and depending on whether the user
   * has already requested an initial batch of collections or not
   */
  async _fetchMoreCollections(search) {
    const noProductsFetchedYet = this.collections.length === 0;
    const nextCollections = noProductsFetchedYet
      ? await this._fetchCollections(search)
      : await this._fetchNextPage(this.collections);
    this.hasNextProductPage = nextCollections.length === PER_PAGE;
    this.freshSearch = false;

    const newCollections = differenceBy(nextCollections, this.collections, 'id');

    this.collections = [...this.collections, ...newCollections];

    return newCollections;
  }

  /**
   * This method is used when the user is fetching collections for the first time.
   * i.e. when they just opened the product picker widget or when they just applied
   * a new search term.
   */
  async _fetchCollections(search) {
    const query = { query: search };
    return await this.shopifyClient.collection.fetchQuery({
      first: PER_PAGE,
      sortBy: 'TITLE',
      reverse: true,
      ...(search.length && query)
    });
  }

  /**
   * This method is used when the user has already fetched a batch of collections
   * and now want to render the next page.
   */
  async _fetchNextPage(collections) {
    return (await this.shopifyClient.fetchNextPage(collections)).model;
  }

  _resetPagination() {
    this.collections = [];
    this.freshSearch = true;
  }
}

const makePagination = async sdk => {
  const pagination = new Pagination(sdk);
  await pagination.init();
  return pagination;
};

export default makePagination;
