import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { DialogInvocationParameters } from '@locations/Dialog';
import { useEffect, useState } from 'react';

type loadingState = {
  isLoading: true;
  feature: undefined;
  entryId: undefined;
  fieldLocales: {};
};

type resolvedState = {
  isLoading: false;
} & DialogInvocationParameters;

type DialogParameters = loadingState | resolvedState;

/**
 * This hook is used to get the parameters that are passed to the dialog.
 *
 * @returns DialogInvocationParameters
 */
const useDialogParameters = (): DialogParameters => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters, DialogInvocationParameters>>();
  const [parameters, setParameters] = useState<DialogInvocationParameters | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleDialogParameters = () => {
    const newParameters = sdk.parameters.invocation;
    if (!newParameters) {
      setIsLoading(true);
      return;
    }

    setParameters(newParameters);
    setIsLoading(false);
  };
  useEffect(handleDialogParameters, [sdk.parameters.invocation]);

  return { ...parameters, isLoading } as DialogParameters;
};

export default useDialogParameters;
export type { DialogParameters };
