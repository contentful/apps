import { ResourceProviderProps, ResourceTypeProps, Link } from 'contentful-management';

export type ResourceProvider = ResourceProviderProps;

export type ResourceType = ResourceTypeProps;

export type APIResourceProvider = {
  sys: {
    id: string;
    type: 'ResourceProvider';
    createdAt: string;
    updatedAt: string;
    createdBy: Link<'User'>;
    updatedBy: Link<'User'>;
    organization: Link<'Organization'>;
    appDefinition: Link<'AppDefinition'>;
  };
  type: 'function';
  function: Link<'Function'>;
};

export type APIResourceType = {
  sys: {
    id: string;
    type: 'ResourceType';
    createdAt: string;
    updatedAt: string;
    createdBy: Link<'User'>;
    updatedBy: Link<'User'>;
    resourceProvider: Link<'ResourceProvider'>;
    appDefinition: Link<'AppDefinition'>;
  };
  name: string;
  type: 'function';
  defaultFieldMapping: {
    title: string;
    subtitle: string;
    externalUrl: string;
    image: { url: string; altText: string };
  };
};

export type APIError = {
  sys: { type: 'Error'; id: string };
  message: string;
  details: {
    errors: { name: string; reason: string }[];
  };
};
