import { ExternalResourceLink } from 'types';

const getResourceProviderAndType = (resource?: ExternalResourceLink) => {
  const [resourceProvider, resourceType] = resource?.sys?.linkType?.split(':') || [];

  return {
    resourceProvider,
    resourceType,
  };
};

export { getResourceProviderAndType };
