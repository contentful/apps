import get from 'lodash/get';
import difference from 'lodash/difference';
import { Product, Hash, ConfigurationParameters } from '../types';

interface AppActionCallParameters {
  apiKey: string;
  sapApiEndpoint: string;
  skus: string;
}

const fields = [
  'code',
  'name',
  'summary',
  'price(formattedValue,DEFAULT)',
  'images(galleryIndex,FULL)',
  'averageRating',
  'stock(DEFAULT)',
  'description',
  'availableForPickup',
  'url',
  'numberOfReviews',
  'manufacturer',
  'categories(FULL)',
  'priceRange',
  'multidimensional',
  'configuratorType',
  'configurable',
  'tags',
];

export const handler = async (payload: AppActionCallParameters) => {
  const { sapApiEndpoint, apiKey, skus } = payload;
  try {
    const totalProducts: Product[] = [];
    const skuIds: string[] = [];
    const parsedSkus = JSON.parse(skus);

    await Promise.all(
      parsedSkus.map(async (sku: string) => {
        const id = sku.split('/products/').pop();
        const req = await fetch(`${sapApiEndpoint}/products/${id}?fields=${fields.join(',')}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'application-interface-key': apiKey,
          },
        });
        const json = await req.json();
        // @ts-ignore
        totalProducts.push(json);
        // @ts-ignore
        skuIds.push(`${json.code}`);
      })
    );

    const products = totalProducts.map(
      productTransformer({
        apiEndpoint: sapApiEndpoint,
      })
    );

    const foundSKUs = products.map((product) => product.sku);
    const missingProducts = difference(skuIds, foundSKUs).map((sku) => ({
      sku: sku.split('/products/').pop(),
      image: '',
      id: '',
      name: '',
      isMissing: true,
    }));

    return {
      status: 'Success',
      products: [...products, ...missingProducts],
    };
  } catch (err) {
    return {
      status: 'Failed',
      // @ts-ignore
      body: err.message,
    };
  }
};

export const productTransformer =
  ({ apiEndpoint }: ConfigurationParameters) =>
  (item: Hash): Product => {
    const id = get(item, ['id'], '');
    let imageUrl = get(item, ['images', 0, 'url'], '');
    if (imageUrl.length > 0) {
      imageUrl = apiEndpoint + imageUrl;
    }
    return {
      id,
      image: imageUrl,
      name: get(item, ['name'], '')
        .replaceAll('<em class="search-results-highlight">', '')
        .replaceAll('</em>', ''),
      sku: get(item, ['code'], ''),
      productUrl: '',
    };
  };
