import { ExternalResource, ExternalResourceLink } from 'types';

const externalResource: ExternalResource = {
  title: 'Kleenex',
  description: 'tissue',
  status: 'published',
  id: '1234',
};

const externalResources: ExternalResource[] = [
  {
    title: 'Charmin',
    description: 'tissue paper',
    status: 'published',
    id: '2345',
  },
  {
    title: 'Shout',
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
