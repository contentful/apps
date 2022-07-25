import { collectionDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';

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


      const collections = response.map((res) => { return { ...res, id: Buffer.from(res.id).toString('base64') } })
      return collections

    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
