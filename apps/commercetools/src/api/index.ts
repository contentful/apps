import { DialogAppSDK } from '@contentful/app-sdk';
import { Pagination, ProductsFn } from '@contentful/ecommerce-app-base';
import { CommerceToolsProduct, ConfigurationParameters, SkuType } from '../types';
import { fetchCategories, fetchCategoryPreviews } from './categories';
import { fetchProductPreviews, fetchProducts } from './products';

export async function fetchPreviews(
  skus: string[],
  config: ConfigurationParameters,
  skuType?: string
): Promise<CommerceToolsProduct[]> {
  if (skuType === 'category') {
    return await fetchCategoryPreviews(skus, config);
  } else {
    return await fetchProductPreviews(skus, config);
  }
}

const LIMIT = 20;

export function createResolver(sdk: DialogAppSDK, skuType: SkuType): ProductsFn {
  let offset = 0;

  const fetchFn = skuType === 'category' ? fetchCategories : fetchProducts;

  return async (search: string, updatedPagination?: Partial<Pagination>) => {
    offset = updatedPagination?.offset ?? offset;

    const fetched = await fetchFn(sdk.parameters.installation, search, {
      offset: offset,
      limit: LIMIT,
    });

    offset += fetched.pagination.count;

    return fetched;
  };
}
