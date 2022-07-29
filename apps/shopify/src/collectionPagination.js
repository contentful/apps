import { collectionDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import { convertIdToBase64 } from './utils/base64';

const makePagination = async (sdk) => {
  const pagination = new BasePagination({
    sdk,
    dataTransformer: collectionDataTransformer,
    fetchProducts: async function (search, PER_PAGE) {
      const query = { query: search };

      const collections = await this.shopifyClient.collection.fetchQuery({
        first: PER_PAGE,
        sortBy: 'TITLE',
        reverse: true,
        ...(search.length && query),
      });

      //converting to base64 as still storing base64 in db
      return collections.map((collection) => convertIdToBase64(collection));
    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
