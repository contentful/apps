import { FieldAppSDK } from '@contentful/app-sdk';
import { ExternalResourceLink } from '../types';

const mockValue = (sdk: FieldAppSDK) =>
  ({
    sys: {
      urn: crypto.randomUUID(),
      type: 'ResourceLink',
      linkType: sdk.parameters.instance.linkType,
    },
    metadata: {
      resourceType: 'Commerce:Product',
    },
  } as ExternalResourceLink);

export default mockValue;
