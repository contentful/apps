import { ExternalResource, ExternalResourceLink } from 'types';

const externalResource: ExternalResource = {
  title: 'Cheetos',
  description: 'yummy styrofoam snack',
  status: 'published',
  id: '1234',
  image:
    'https://images.ctfassets.net/juh8bvgveao4/QoAO8rqn86a4jiH1yudiN/e518fd9263b67705c3ffb041bd217bda/imageService.webp',
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

const externalResourceLinks: ExternalResourceLink[] = [
  {
    sys: {
      type: 'ResourceLink',
      linkType: 'Shopify:Product',
      urn: 'gid://shopify/Product/8191006998814',
    },
  },
  {
    sys: {
      type: 'ResourceLink',
      linkType: 'Shopify:Product',
      urn: 'gid://shopify/Product/123498742354',
    },
  },
];

export { externalResource, externalResources, externalResourceLink, externalResourceLinks };
