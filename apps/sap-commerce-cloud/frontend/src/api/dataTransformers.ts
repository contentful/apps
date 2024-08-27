import get from 'lodash/get';
import { Product, Hash, ConfigurationParameters } from '../interfaces';

export const productTransformer =
  (
    { apiEndpoint }: ConfigurationParameters,
    skuIdsToSkusMap: { [key: string]: string },
    baseSite?: string
  ) =>
  (item: Hash): Product => {
    const id = get(item, ['id'], '');
    let imageUrl = get(item, ['images', 0, 'url'], '');
    if (imageUrl.length > 0) {
      imageUrl = apiEndpoint + imageUrl;
    }
    const sku = get(item, ['code'], '');
    const productUrl = skuIdsToSkusMap[sku]
      ? skuIdsToSkusMap[sku]
      : baseSite
      ? `${apiEndpoint}/occ/v2/${baseSite}/products/${sku}`
      : '';

    return {
      id,
      image: imageUrl,
      name: get(item, ['name'], '')
        .replaceAll('<em class="search-results-highlight">', '')
        .replaceAll('</em>', ''),
      sku,
      productUrl: productUrl,
    };
  };

export const baseSiteTransformer =
  () =>
  (item: Hash): string => {
    return get(item, ['uid'], '');
  };

export const productDetailsTransformer =
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
