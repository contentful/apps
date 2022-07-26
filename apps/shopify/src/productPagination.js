import { productDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import isBase64 from './utils/isBase64';
import btoa from './utils/btoa'

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
      const products = response.map((res) => { return { ...res, id: !isBase64(res.id) ? btoa(res.id) : res.id } })
      return products
    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
