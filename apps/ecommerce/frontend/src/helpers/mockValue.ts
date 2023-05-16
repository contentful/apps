import { FieldAppSDK } from '@contentful/app-sdk';
import { ExternalResourceLink } from 'types';

const rand = Math.ceil(Math.random() * 3);

const mockValue = (sdk: FieldAppSDK) =>
  ({
    sys: {
      urn: rand >= 1 ? 'gid://shopify/Product/8191006671134' : crypto.randomUUID(),
      type: 'ResourceLink',
      linkType: sdk.parameters.instance.linkType,
    },
    metadata: {
      resourceType: 'Commerce:Product',
    },
  } as ExternalResourceLink);

export default mockValue;
