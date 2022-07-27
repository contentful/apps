import { productDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import checkAndConvertToBase64 from './utils/checkAndConvertToBase64'

const makePagination = async (sdk) => {
  const pagination = new BasePagination({
    sdk,
    dataTransformer: productDataTransformer,
    fetchProducts: async function (search, PER_PAGE) {
      const query = { query: `variants:['sku:${search}'] OR title:${search}` };

      const response = await this.shopifyClient.product.fetchQuery({
        first: PER_PAGE,
        sortBy: 'TITLE',
        reverse: true,
        ...(search.length && query),
      });
      const products = response.map((res) => { return checkAndConvertToBase64(res) })
      return products
    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
