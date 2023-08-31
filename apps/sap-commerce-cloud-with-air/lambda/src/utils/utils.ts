import { Request } from 'express';
import { Hash, Product } from '../types/types';
import get from 'lodash/get';

export const baseSiteTransformer =
  () =>
  (item: Hash): string => {
    return get(item, ['uid'], '');
  };

export const productTransformer =
  (apiEndpoint: string) =>
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

export const getHost = (req: Request): string => {
  const crn = req.header('x-contentful-crn');
  const partition = crn?.split(':')[1];

  switch (partition) {
    case 'contentful':
      return 'api.contentful.com';
    case 'contentful-eu':
      return 'api.eu.contentful.com';
    default:
      return 'api.contentful.com';
  }
};
