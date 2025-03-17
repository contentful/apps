import { createClient, ResourceProviderProps, ResourceTypeProps } from 'contentful-management';
import { accessToken, appDefinitionId, manifest, organizationId, contentfulHost } from './imports';

const client = createClient({ accessToken }, { type: 'plain' });
const host = contentfulHost || 'api.contentful.com';

export const getResourceProvider = async () => {
  return client.resourceProvider.get({ organizationId, appDefinitionId });
};

export const createResourceProvider = async (resourceProvider: ResourceProviderProps) => {
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

  return client.resourceProvider.upsert(
    { organizationId, appDefinitionId },
    resourceProviderWithFunctionId
  );
};

export const deleteResourceProvider = async () => {
  return client.resourceProvider.delete({ organizationId, appDefinitionId });
};

export const createResourceType = async (resourceType: ResourceTypeProps) => {
  const { sys, ...data } = resourceType;

  return client.resourceType.upsert(
    { organizationId, appDefinitionId, resourceTypeId: resourceType.sys.id },
    data
  );
};

export const listResourceTypes = async () => {
  return client.resourceType.getMany({ organizationId, appDefinitionId });
};

export const deleteResourceType = async (resourceType: ResourceTypeProps) => {
  return client.resourceType.delete({
    organizationId,
    appDefinitionId,
    resourceTypeId: resourceType.sys.id,
  });
};
