import { useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { AppInstallationParameters, TeamsChannel } from '@customTypes/configPage';

const useGetTeamsChannels = () => {
  const [channels, setChannels] = useState<TeamsChannel[]>([]);
  const sdk = useSDK<ConfigAppSDK>();
  const { tenantId } = sdk.parameters.installation as AppInstallationParameters;

  const getAllChannels = useCallback(async () => {
    try {
      const { response } = await sdk.cma.appActionCall.createWithResponse(
        {
          appActionId: 'msteamsListChannels',
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
          appDefinitionId: sdk.ids.app!,
        },
        {
          parameters: {
            tenantId,
          },
        }
      );
      const body = JSON.parse(response.body);
      if (body.ok) {
        setChannels(body.data);
      } else {
        throw new Error('Failed to fetch Teams channels');
      }
    } catch (error) {
      console.error(error);
    }
  }, [sdk.cma.appActionCall, sdk.ids.environment, sdk.ids.space, sdk.ids.app, tenantId]);

  useEffect(() => {
    getAllChannels();
  }, [getAllChannels]);

  return channels;
};

export default useGetTeamsChannels;
