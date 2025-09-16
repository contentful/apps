import { useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { TeamsChannel } from '@customTypes/configPage';
import { isListChannelsResult } from '../types/appActionResults';

const useGetTeamsChannels = () => {
  const [channels, setChannels] = useState<TeamsChannel[]>([]);
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState<boolean>(true);
  const sdk = useSDK<ConfigAppSDK>();

  const getAllChannels = useCallback(async () => {
    try {
      setLoading(true);
      const { result } = await sdk.cma.appActionCall.createWithResult(
        {
          appActionId: 'msteamsListChannels',
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
          appDefinitionId: sdk.ids.app!,
        },
        {
          parameters: {},
        }
      );

      if (result && isListChannelsResult(result) && result.ok) {
        setChannels(result.channels || []);
        setError(undefined);
      } else {
        const error = new Error('Failed to fetch Teams channels');
        setError(error);
        throw error;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(
        error?.message ? error : new Error('Unknown error occured. Please try again later.')
      );
      console.error(error);
    }

    setLoading(false);
  }, [sdk.cma.appActionCall, sdk.ids.environment, sdk.ids.space, sdk.ids.app]);

  useEffect(() => {
    getAllChannels();
  }, [getAllChannels]);

  return { channels, loading, error };
};

export default useGetTeamsChannels;
