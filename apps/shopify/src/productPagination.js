import { productDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';

const makePagination = async sdk => {
  const pagination = new BasePagination({
    sdk,
    dataTransformer: productDataTransformer,
    fetchProducts: async function(search, PER_PAGE) {
      const query = { query: `variants:['sku:${search}'] OR title:${search}` };

      return await this.shopifyClient.product.fetchQuery({
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
