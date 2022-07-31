import { productDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import { convertIdToBase64 } from './utils/base64';

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
      //converting to base64 as still storing base64 in db
      return products.map((res) => convertIdToBase64(res));
    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
