import { BaseAppSDK } from '@contentful/app-sdk';
import { apiKey } from './config';

/**
 * Used to sort fetched products previews in the same
 * order that the SKUs were added to the field value.
 * @see https://gist.github.com/ecarter/1423674
 */
export const mapSort = (array: any[], order: any[], key: string) => {
  const sorted = array.slice().sort((a, b) => {
    const A = a[key];
    const B = b[key];
    return order.indexOf(A) > order.indexOf(B) ? 1 : -1;
  });
  return sorted;
};

export const cmaRequest = async ({
  sdk,
  appActionId,
  parameters,
}: {
  sdk: BaseAppSDK;
  appActionId: string;
  parameters: {
    [key: string]: any;
  };
}) => {
  return await sdk.cma.appActionCall.createWithResponse(
    {
      appActionId,
      environmentId: sdk.ids.environment,
      spaceId: sdk.ids.space,
      appDefinitionId: sdk.ids.app!,
    },
    {
      parameters: {
        sapApiEndpoint: `${sdk.parameters.installation.apiEndpoint}/occ/v2/${sdk.parameters.installation.baseSites}`,
        apiKey,
        ...parameters,
      },
    }
  );
};
