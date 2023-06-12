import { RequiredProviderInputs } from '../types';
import axios from 'axios';

export const getProviderConfig = async (providerUrl: string) => {
  providerUrl += `/resourcesTypes`;
  const resourceTypeMetadata = await axios.get(providerUrl);
  return resourceTypeMetadata.data;
};

export const getProviderSchema = async (requiredProviderInputs: RequiredProviderInputs) => {
  const { providerUrl, resourceType } = requiredProviderInputs;

  const providerUrlFullPath = `${providerUrl}/resourcesTypes/${resourceType}/schema`;
  const resourceTypeMetadata = await axios.get(providerUrlFullPath);
  return resourceTypeMetadata.data;
};

export const getProviderResources = async (requiredProviderInputs: RequiredProviderInputs) => {
  const { providerUrl, resourceType, shopName, accessToken } = requiredProviderInputs;
  const providerUrlFullPath = `${providerUrl}/resourcesTypes/${resourceType}/resources`;

  const providerResources = await axios.get(providerUrlFullPath, {
    headers: {
      'x-storefront-access-token': accessToken,
      'x-shop-name': shopName,
    },
  });
  return providerResources.data;
};

export const getOneProviderResource = async (requiredProviderInputs: RequiredProviderInputs) => {
  const { providerUrl, resourceType, shopName, accessToken, resourceId } = requiredProviderInputs;

  if (!resourceId) throw new Error('Missing resourceId');

  const encodedResourceId = encodeURIComponent(resourceId);
  const providerUrlFullPath = `${providerUrl}/resourcesTypes/${resourceType}/resources/${encodedResourceId}`;
  const providerResources = await axios.get(providerUrlFullPath, {
    headers: {
      'x-storefront-access-token': accessToken,
      'x-shop-name': shopName,
    },
  });
  return providerResources.data;
};
