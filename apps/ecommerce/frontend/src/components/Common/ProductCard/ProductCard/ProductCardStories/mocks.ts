import { ExternalResource, ExternalResourceLink } from 'types';

export const mockExternalResourceLink: ExternalResourceLink = {
  sys: {
    type: 'ResourceLink',
    linkType: 'Shopify:Product',
    urn: 'gid://shopify/Product/8191006998814',
  },
};

export const mockExternalResource: ExternalResource = {
  title: 'Cheetos',
  description: 'Tasty and cheesy! These are so delicious and they make your fingers orange.',
  image:
    'https://images.ctfassets.net/juh8bvgveao4/QoAO8rqn86a4jiH1yudiN/e518fd9263b67705c3ffb041bd217bda/imageService.webp',
  status: 'new',
  id: 'Product ID: 1029384756',
};
