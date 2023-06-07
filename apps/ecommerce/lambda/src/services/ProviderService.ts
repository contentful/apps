import axios from 'axios';

export const getProviderConfig = async (proxyUrl: string) => {
  proxyUrl += `/resourcesTypes`;
  const resourceTypeMetadata = await axios.get(proxyUrl);
  return resourceTypeMetadata.data;
};

export const getProviderSchema = async (proxyUrl: string, resourceType: string) => {
  proxyUrl += `/resourcesTypes/${resourceType}/schema`;
  const resourceTypeMetadata = await axios.get(proxyUrl);
  return resourceTypeMetadata.data;
};

export const getProviderResources = async (proxyUrl: string, resourceType: string) => {
  proxyUrl += `/resourcesTypes/${resourceType}/resources`;

  const providerResources = await axios.get(proxyUrl, {
    headers: {
      'x-storefront-access-token': 'b79cc1f17a585a71595beb972771b617',
      'x-shop-name': 'contentful-test-app',
    },
  });
  return providerResources.data;
};

export const getOneProviderResource = async (
  proxyUrl: string,
  resourceType: string,
  resourceId: string
) => {
  const encodedResourceId = encodeURIComponent(resourceId);
  proxyUrl += `/resourcesTypes/${resourceType}/resources/${encodedResourceId}`;
  const providerResources = await axios.get(proxyUrl, {
    headers: {
      'x-storefront-access-token': 'b79cc1f17a585a71595beb972771b617',
      'x-shop-name': 'contentful-test-app',
    },
  });
  return providerResources.data;
};
