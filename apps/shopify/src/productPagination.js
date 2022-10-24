import { productDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import { convertProductToBase64 } from './utils/base64';

const makePagination = async (sdk) => {
  const pagination = new BasePagination({
    sdk,
    dataTransformer: productDataTransformer,
    fetchProducts: async function (search, PER_PAGE) {
      const query = { query: `variants:['sku:${search}'] OR title:${search}` };

      const products = await this.shopifyClient.product.fetchQuery({
        first: PER_PAGE,
        sortBy: 'TITLE',
        reverse: true,
        ...(search.length && query),
      });
      return products.map((res) => convertProductToBase64(res));
    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
