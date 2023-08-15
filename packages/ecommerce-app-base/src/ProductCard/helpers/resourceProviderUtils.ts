import { ExternalResourceLink } from '../types';

const getResourceProviderAndType = (resource?: ExternalResourceLink | string) => {
  let resourceProvider, resourceType;

  if (typeof resource === 'string') {
    [resourceProvider, resourceType] = resource.split(':') || [];
  } else {
    [resourceProvider, resourceType] = resource?.sys?.linkType?.split(':') || [];
  }

  return {
    resourceProvider,
    resourceType: typeof resourceType === 'string' ? resourceType.toLowerCase() : resourceType,
  };
};

export { getResourceProviderAndType };
