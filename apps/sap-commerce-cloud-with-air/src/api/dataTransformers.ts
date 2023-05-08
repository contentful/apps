import get from 'lodash/get';
import { Product, Category, Hash, ConfigurationParameters } from '../interfaces';

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
    };
  };

export const categoryTransformer =
  ({ projectKey, locale }: ConfigurationParameters) =>
  (item: Hash): Category => {
    const id = get(item, ['id'], '');
    const externalLink =
      (projectKey && id && `https://mc.commercetools.com/${projectKey}/categories/${id}/general`) ||
      '';
    return {
      id,
      name: get(item, ['name', locale === undefined ? '' : locale], ''),
      slug: get(item, ['slug', locale === undefined ? '' : locale], ''),
      isMissing: false,
      sku: '',
      image: '',
      externalLink,
    };
  };

export const baseSiteTransformer =
  () =>
  (item: Hash): string => {
    return get(item, ['uid'], '');
  };
