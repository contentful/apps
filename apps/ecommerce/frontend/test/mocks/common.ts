import { ExternalResource, ExternalResourceLink } from 'types';

const externalResource: ExternalResource = {
  name: 'Kleenex',
  description: 'tissue',
  status: 'published',
  id: '1234',
};

const externalResources: ExternalResource[] = [
  {
    name: 'Charmin',
    description: 'tissue paper',
    status: 'published',
    id: '2345',
  },
  {
    name: 'Shout',
    description: 'cleaner',
    status: 'published',
    id: '3456',
  },
  externalResource,
];

const externalResourceLink: ExternalResourceLink = {
  sys: {
    type: 'ResourceLink',
    linkType: 'Shopify:Product',
    urn: 'gid://shopify/Product/8191006998814',
  },
};

export { externalResource, externalResources, externalResourceLink };
