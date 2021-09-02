import { collectionDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';

const makePagination = async sdk => {
  const pagination = new BasePagination({
    sdk,
    dataTransformer: collectionDataTransformer,
    fetchProducts: async function(search, PER_PAGE) {
      const query = { query: search };

      return await this.shopifyClient.collection.fetchQuery({
        first: PER_PAGE,
        sortBy: 'TITLE',
        reverse: true,
        ...(search.length && query)
      });
    }
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
