import { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect } from 'react';
import { SelectedContentTypes } from '../components/AddToSidebarSection';
import { AppInstallationParameters } from '../locations/ConfigScreen';
import { generateEditorInterfaceAssignments } from '../utils';

/**
 * This hook is used to save the parameters of the app.
 *
 * @param parameters the parameters to be saved
 * @param contentTypes the content types to be saved
 * @returns void
 */
const useSaveConfigHandler = (
  parameters: AppInstallationParameters,
  contentTypes: SelectedContentTypes
) => {
  const sdk = useSDK<ConfigAppSDK>();

  /*
    This method will be called when a user clicks on "Install"
    or "Save" in the configuration screen.
    for more details see https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#register-an-app-configuration-hook
  */
  const getCurrentState = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    const currentEditorInterface = currentState?.EditorInterface || {};

    // Assign the app to the sidebar for saved content types
    const newEditorInterfaceAssignments = generateEditorInterfaceAssignments(
      currentEditorInterface,
      contentTypes
    );

    const newAppState: AppState = {
      EditorInterface: newEditorInterfaceAssignments,
    };

    return {
      // Installation parameter values are saved here
      parameters,
      // The new state of the app (e.g. the content types where the app is assigned and instance parameter values) is saved here
      targetState: newAppState,
    };
  }, [contentTypes, parameters, sdk.app]);

  const changeSaveConfigHandler = useCallback(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => getCurrentState());
  }, [getCurrentState, sdk.app]);

  useEffect(() => {
    changeSaveConfigHandler();
  }, [parameters, contentTypes, changeSaveConfigHandler]);
};

export default useSaveConfigHandler;
