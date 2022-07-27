import { collectionDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import checkAndConvertToBase64 from './utils/checkAndConvertToBase64'

const makePagination = async (sdk) => {
  const pagination = new BasePagination({
    sdk,
    dataTransformer: collectionDataTransformer,
    fetchProducts: async function (search, PER_PAGE) {
      const query = { query: search };

      const response = await this.shopifyClient.collection.fetchQuery({
        first: PER_PAGE,
        sortBy: 'TITLE',
        reverse: true,
        ...(search.length && query),
      });

      const collections = response.map((res) => { return checkAndConvertToBase64(res) })

      return collections

    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
