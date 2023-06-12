import axios from 'axios';

export const getProviderAppInstallConfig = async (providerBaseUrl: string) => {
  providerBaseUrl += `/resourcesTypes`;
  const appInstallConfig = await axios.get(providerBaseUrl);
  return appInstallConfig.data;
};

export const getProviderConfig = async (providerBaseUrl: string) => {
  // TODO: Add resource type to headers
  const providerUrlFullPath = `${providerBaseUrl}/resourcesTypes/config`;
  const resourceTypeConfig = await axios.get(providerUrlFullPath);
  return resourceTypeConfig.data;
};

export const getProviderSchema = async (providerBaseUrl: string) => {
  // TODO: Add resource type to headers
  const providerUrlFullPath = `${providerBaseUrl}/resourcesTypes/schema`;
  const resourceTypeSchema = await axios.get(providerUrlFullPath);
  return resourceTypeSchema.data;
};

// TODO: Fix this unknown appInstallParameters type
export const getProviderResources = async (
  providerBaseUrl: string,
  appInstallationParameters: unknown
) => {
  // TODO: Add resource type to headers
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
