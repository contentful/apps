import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { Product } from './types';

export function withUrn(file: any) {
  return {
    ...file,
    urn: file.id,
  };
}

export function withBadge(node: Product) {
  return {
    ...node,
    badge: { variant: 'primary', label: 'it works' },
  };
}
