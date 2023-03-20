import get from 'lodash/get';
import { Product, Category, Hash, ConfigurationParameters } from '../interfaces';

export const productTransformer =
  ({ projectKey, locale }: ConfigurationParameters) =>
  (item: Hash): Product => {
    const id = get(item, ['id'], '');
    const externalLink =
      (projectKey && id && `https://mc.commercetools.com/${projectKey}/products/${id}/general`) ||
      '';
    let imageUrl = get(item, ['images', 0, 'url'], '');
    imageUrl =
      'https://api.c19a91jwyt-habermaas1-d1-public.model-t.cc.commerce.ondemand.com' + imageUrl;
    return {
      id,
      image: imageUrl,
      name: get(item, ['name'], ''),
      sku: get(item, ['code'], ''),
      externalLink,
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
      name: get(item, ['name', locale], ''),
      slug: get(item, ['slug', locale], ''),
      isMissing: false,
      externalLink,
    };
  };
