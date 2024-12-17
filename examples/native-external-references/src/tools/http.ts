import {
  createClient,
  CursorPaginatedCollectionProp
} from 'contentful-management';
import type {
  APIError,
  APIResourceProvider,
  APIResourceType,
  ResourceProvider,
  ResourceType
} from './types';
import {
  accessToken,
  appDefinitionId,
  manifest,
  organizationId
} from './imports';

type ResourceProviderResult = APIError | APIResourceProvider;
type ResourceTypeResult = APIError | APIResourceType;

const client = createClient({ accessToken }, { type: 'plain' });

const put = async <T>({ resource, url }: { resource: string; url: string }) => {
  return client.raw.put<T>(url, resource).catch((err: Error) => {
    console.error('error:' + err);
    throw err;
  });
};

const get = async <T>({ url }: { url: string }) => {
  return client.raw.get<T>(url).catch((err: Error) => {
    console.error('error:' + err);
    throw err;
  });
};

export const getResourceProvider = async () => {
  const url = `https://api.contentful.com/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider`;

  return get<ResourceProviderResult>({ url });
};

export const createResourceProvider = async (
  resourceProvider: ResourceProvider
) => {
  const url = `https://api.contentful.com/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider`;

  const resourceProviderWithFunctionId: ResourceProvider = {
    ...resourceProvider,
    function: {
      ...resourceProvider.function,
      sys: {
        ...resourceProvider.function.sys,
        id: manifest.functions[0].id
      }
    }
  };

  const body = JSON.stringify(resourceProviderWithFunctionId);

  return put<ResourceProviderResult>({
    resource: body,
    url
  });
};

export const listResourceTypes = async () => {
  const url = `https://api.contentful.com/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider/resource_types`;

  return get<CursorPaginatedCollectionProp<ResourceTypeResult>>({ url });
};

export const createResourceType = async (resourceType: ResourceType) => {
  const url = `https://api.contentful.com/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider/resource_types/${resourceType.sys.id}`;

  const body = JSON.stringify({ ...resourceType, sys: undefined });

  return put<ResourceTypeResult>({
    resource: body,
    url
  });
};
