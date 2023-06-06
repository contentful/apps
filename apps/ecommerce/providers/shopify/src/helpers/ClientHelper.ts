import { ShopifyProviderParams } from '../types/types';

export const extractShopifyClientConfigParams = (params: ShopifyProviderParams): string => {
  const { shopName, storefrontAccessToken } = params;

  if (!shopName || !storefrontAccessToken)
    throw new Error(
      'Missing required parameters. shopName and storefrontAccessToken are required.'
    );

  const domain = `${shopName}.myshopify.com`;
  if (!!domain.match(/^[-a-z0-9]{2,256}\b([-a-z0-9]+)\.myshopify\.com$/) === false) {
    throw new Error('Invalid Shopify shop name');
  }

  return domain;
};
