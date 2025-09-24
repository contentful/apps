import { useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { TeamsChannel } from '@customTypes/configPage';
import { assertAppActionResult } from '../utils/assertAppActionResult';
import { AppActionResultError, AppActionResultSuccess } from '../../../types';

const useGetTeamsChannels = () => {
  const [channels, setChannels] = useState<TeamsChannel[]>([]);
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState<boolean>(true);
  const sdk = useSDK<ConfigAppSDK>();

  const getAllChannels = useCallback(async () => {
    try {
      setLoading(true);
      const { sys: appActionCallSys } = await sdk.cma.appActionCall.createWithResult(
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

      if (appActionCallSys.status === 'succeeded') {
        const { result: appActionResult } = appActionCallSys;
        assertAppActionResult<TeamsChannel[]>(appActionResult);

        if (appActionResult.ok) {
          setChannels((appActionResult as AppActionResultSuccess<TeamsChannel[]>).data || []);
          setError(undefined);
        } else {
          const error = new Error(
            `Failed to fetch Teams channels: ${
              (appActionResult as AppActionResultError).error.message
            }`
          );
          setError(error);
          throw error;
        }
      } else if (appActionCallSys.status === 'failed') {
        const errorMessage = new Error(
          `There was an error invoking the app action: ${appActionCallSys.error?.message}`
        );
        setError(errorMessage);
        throw errorMessage;
      } else {
        const error = new Error('Failed to fetch Teams channels. An unknown error occurred.');
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
