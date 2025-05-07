import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { Product } from './types';

export function withUrn(file: any) {
  return {
    ...file,
    urn: file.id,
  };
}

export function withBadge(file: any) {
  return {
    ...file,
    badge: { variant: 'primary', label: 'it works' },
  };
}
