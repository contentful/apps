import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppActionProps, CollectionProp } from 'contentful-management';
import { useCallback, useState } from 'react';

const useGetAppActions = () => {
  const [appActions, setAppActions] = useState<CollectionProp<AppActionProps>>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  const sdk = useSDK<PageAppSDK>();

  const getAllAppActions = useCallback(async () => {
    try {
      setLoading(true);
      const appActionsResponse = await sdk.cma.appAction.getMany({
        organizationId: sdk.ids.organization,
        appDefinitionId: sdk.ids.app || '',
      });
      setAppActions(appActionsResponse);
    } catch (error) {
      const err = new Error('Unable to get app actions');
      setError(err);
      console.error(error);
    }

    setLoading(false);
  }, [sdk]);

  return { getAllAppActions, appActions, loading, error };
};

export default useGetAppActions;
