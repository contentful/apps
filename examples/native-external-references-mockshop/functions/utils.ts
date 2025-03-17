import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { Product } from './types';

export const getMockShopUrl = (context: FunctionEventContext<Record<string, any>>) => {
  const { apiEndpoint: mockShopUrl } = context.appInstallationParameters;
  if (!mockShopUrl) {
    console.warn(`No API url configured, using default: https://mock.shop/api`);
    return 'https://mock.shop/api';
  }
  return mockShopUrl;
};

export function withUrn(node: Product) {
  return {
    ...node,
    urn: node.id,
  };
}

export function withBadge(node: Product) {
  return {
    ...node,
    badge: { variant: 'primary', label: 'it works' },
  };
}
