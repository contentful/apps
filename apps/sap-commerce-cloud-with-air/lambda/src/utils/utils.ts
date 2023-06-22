import { Hash } from '../types/types';
import get from 'lodash/get';

export const baseSiteTransformer =
  () =>
  (item: Hash): string => {
    return get(item, ['uid'], '');
  };
