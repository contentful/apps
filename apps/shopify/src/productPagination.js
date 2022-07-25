import { productDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';

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
      // converting the 'gid://shopify/ProductVariant/41' to base64 format as API format changed from 2022-04 version

      const products = response.map((res) => { return { ...res, id: Buffer.from(res.id).toString('base64') } })
      return products
    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
