import { collectionDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import isBase64 from './utils/isBase64';
import btoa from './utils/btoa'

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

      const collections = response.map((res) => { return { ...res, id: !isBase64(res.id) ? btoa(res.id) : res.id } })

      return collections

    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
