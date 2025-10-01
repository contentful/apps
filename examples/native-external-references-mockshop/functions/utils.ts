import { Product } from './types';

export const getMockShopUrl = (context: { appInstallationParameters?: Record<string, any> }) => {
  const mockShopUrl = context.appInstallationParameters?.apiEndpoint;

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
