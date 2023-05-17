import { FieldAppSDK } from '@contentful/app-sdk';
import { ExternalResourceLink } from 'types';

const mockValue = (sdk: FieldAppSDK) => {
  const rand = Math.ceil(Math.random() * 3);

  return {
    sys: {
      urn:
        rand === 1
          ? 'gid://shopify/Product/8191006671134'
          : rand === 2
          ? 'gid://shopify/Product/8191006736670'
          : crypto.randomUUID(),
      type: 'ResourceLink',
      linkType: sdk.parameters.instance.linkType,
    },
    metadata: {
      resourceType: 'Commerce:Product',
    },
  } as ExternalResourceLink;
};

export default mockValue;
