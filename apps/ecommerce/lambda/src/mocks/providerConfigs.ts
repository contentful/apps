import { ProviderConfigs } from '../types';

export const PROVIDER_CONFIGS: ProviderConfigs = {
  shopify: {
    name: 'Shopify',
    description:
      'The Shopify app allows editors to select products from their Shopify account and reference them inside of Contentful entries.',
    parameterDefinitions: [
      {
        id: 'storefrontAccessToken',
        name: 'Storefront Access Token',
        description: 'The storefront access token to your Shopify store',
        type: 'Symbol',
        required: true,
      },
      {
        id: 'apiEndpoint',
        name: 'API Endpoint',
        description: 'The Shopify API endpoint',
        type: 'Symbol',
        required: true,
      },
    ],
  },
  magento: {
    name: 'Magento',
    description:
      'The Magento app allows editors to select products from their Magento account and reference them inside of Contentful entries.',
    parameterDefinitions: [
      {
        id: 'consumerKey',
        name: 'Consumer Key',
        description: 'The Magento consumer key',
        type: 'Symbol',
        required: true,
      },
      {
        id: 'consumerSecret',
        name: 'Consumer Secret',
        description: 'The Magento consumer secret',
        type: 'Symbol',
        required: true,
      },
      {
        id: 'accessToken',
        name: 'Access Token',
        description: 'The Magento access token',
        type: 'Symbol',
        required: true,
      },
      {
        id: 'tokenSecret',
        name: 'Token Secret',
        description: 'The Magento token secret',
        type: 'Symbol',
        required: true,
      },
      {
        id: 'apiEndpoint',
        name: 'API Endpoint',
        description: 'The Magento API endpoint',
        type: 'Symbol',
        required: true,
      },
    ],
  },
};
