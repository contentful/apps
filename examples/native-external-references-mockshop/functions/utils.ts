import { FunctionEventContext } from "@contentful/functions-types";
import { Product } from "./types";

export const getMockShopUrl = (context: FunctionEventContext<Record<string, any>>) => {
  const { apiEndpoint } = context.appInstallationParameters;
  let mockShopUrl = apiEndpoint;
  if (!mockShopUrl) {
    mockShopUrl = 'https://mock.shop/api';
    console.warn(`No API url configured, falling back to '${mockShopUrl}'`);
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
