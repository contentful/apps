import { InstallationParameters, Product } from './types';

export const getMockShopUrl = (parameters: InstallationParameters) => {
  const mockShopUrl = parameters.apiEndpoint;

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
