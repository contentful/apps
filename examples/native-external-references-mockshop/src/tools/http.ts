import { createClient, CursorPaginatedCollectionProp, ResourceProviderProps, ResourceTypeProps } from 'contentful-management';
import { accessToken, appDefinitionId, manifest, organizationId, contentfulHost } from './imports';

type APIError = {
  sys: { type: 'Error'; id: string };
  message: string;
  details: {
    errors: { name: string; reason: string }[];
  };
};

type ResourceProviderResult = APIError | ResourceProviderProps;
type ResourceTypeResult = APIError | ResourceTypeProps;

const client = createClient({ accessToken }, { type: 'plain' });
const host = contentfulHost || 'api.contentful.com';

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

const del = async <T>({ url }: { url: string }) => {
  return client.raw.delete<T>(url).catch((err: Error) => {
    console.error('error:' + err);
    throw err;
  });
};

export const getResourceProvider = async () => {
  const url = `https://${host}/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider`;

  return get<ResourceProviderResult>({ url });
};

export const createResourceProvider = async (resourceProvider: ResourceProviderProps) => {
  const url = `https://${host}/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider`;

  const resourceProviderWithFunctionId: ResourceProviderProps = {
    ...resourceProvider,
    function: {
      ...resourceProvider.function,
      sys: {
        ...resourceProvider.function.sys,
        id: manifest.functions[0].id,
      },
    },
  };

  const body = JSON.stringify(resourceProviderWithFunctionId);

  return put<ResourceProviderResult>({
    resource: body,
    url,
  });
};

export const listResourceTypes = async () => {
  const url = `https://${host}/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider/resource_types`;

  return get<CursorPaginatedCollectionProp<ResourceTypeResult>>({ url });
};

export const createResourceType = async (resourceType: ResourceTypeProps) => {
  const url = `https://${host}/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider/resource_types/${resourceType.sys.id}`;

  const body = JSON.stringify({ ...resourceType, sys: undefined });

  return put<ResourceTypeResult>({
    resource: body,
    url,
  });
};

export const deleteResourceProvider = async () => {
  const url = `https://${host}/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider`;

  return del<ResourceProviderResult>({
    url,
  });
};

export const deleteResourceType = async (resourceType: ResourceTypeProps) => {
  const url = `https://${host}/organizations/${organizationId}/app_definitions/${appDefinitionId}/resource_provider/resource_types/${resourceType.sys.id}`;

  return del<ResourceTypeResult>({
    url,
  });
};
