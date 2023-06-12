import axios from 'axios';

export const getAppInstallConfig = async (providerBaseUrl: string) => {
  providerBaseUrl += `/resourcesTypes`;
  const resourceTypeMetadata = await axios.get(providerBaseUrl);
  return resourceTypeMetadata.data;
};

export const getProviderSchema = async (providerBaseUrl: string) => {
  // TODO: Fix this hardcoded resource type
  const providerUrlFullPath = `${providerBaseUrl}/resourcesTypes/schema`;
  const resourceTypeMetadata = await axios.get(providerUrlFullPath);
  return resourceTypeMetadata.data;
};

// TODO: Fix this unknown appInstallParameters type
export const getProviderResources = async (
  providerBaseUrl: string,
  appInstallationParameters: unknown
) => {
  // TODO: Fix this hardcoded resource type
  const providerUrlFullPath = `${providerBaseUrl}/resourcesTypes/resources`;

  const providerResources = await axios.get(providerUrlFullPath, {
    headers: {
      'x-data-provider-parameters': JSON.stringify(appInstallationParameters),
    },
  });
  return providerResources.data;
};

export const getOneProviderResource = async (
  resourceId: string,
  resourceType: string,
  providerBaseUrl: string,
  appInstallationParameters: unknown
) => {
  if (!resourceId) throw new Error('Missing resourceId');

  const encodedResourceId = encodeURIComponent(resourceId);
  const encodedResourceType = encodeURIComponent(resourceType);

  // TODO: Update this path to be cleaner in the provider
  const providerUrlFullPath = `${providerBaseUrl}/resourcesTypes/resources/single`;
  const providerResources = await axios.get(providerUrlFullPath, {
    headers: {
      'x-data-provider-parameters': JSON.stringify(appInstallationParameters),
      'x-resource-id': encodedResourceId,
      'x-resource-type': encodedResourceType,
    },
  });
  return providerResources.data;
};
