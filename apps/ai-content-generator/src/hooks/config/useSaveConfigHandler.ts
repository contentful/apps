import { AppInstallationParameters } from '@locations/ConfigScreen';
import { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useCallback, useContext } from 'react';
import { generateEditorInterfaceAssignments } from '@utils/config/contentTypeHelpers';
import { SegmentAnalyticsContext } from '@providers/segmentAnalyticsProvider';
import { SegmentAction } from '@configs/segment/segmentEvent';

/**
 * This hook is used to save the parameters of the app.
 *
 * @param parameters the parameters to be saved
 * @param validateParams function to handle any parameter validations and returns an array of error messages
 * @returns void
 */
const useSaveConfigHandler = (
  parameters: AppInstallationParameters,
  validateParams: (params: AppInstallationParameters) => Promise<string[]>,
  contentTypes: Set<string>
) => {
  const sdk = useSDK<ConfigAppSDK>();
  const { trackEvent } = useContext(SegmentAnalyticsContext);

  const getCurrentState = useCallback(async () => {
    const notifierErrors = await validateParams(parameters);

    if (notifierErrors.length) {
      notifierErrors.forEach((error) => sdk.notifier.error(error));
      return false;
    }

    const currentState = await sdk.app.getCurrentState();

    const currentEditorInterface = currentState?.EditorInterface || {};

    // Assign the app to the sidebar for saved content types
    const newEditorInterfaceAssignments = generateEditorInterfaceAssignments(
      currentEditorInterface,
      Array.from(contentTypes),
      'sidebar',
      1
    );

    trackEvent(SegmentAction.CONFIG_SAVED);
    const newAppState: AppState = {
      EditorInterface: newEditorInterfaceAssignments,
    };

    return {
      parameters,
      targetState: newAppState,
    };
  }, [trackEvent, contentTypes, parameters, sdk.app, sdk.notifier, validateParams]);

  const changeSaveConfigHandler = useCallback(() => {
    sdk.app.onConfigure(() => getCurrentState());
  }, [getCurrentState, sdk.app]);

  useEffect(() => {
    changeSaveConfigHandler();
  }, [parameters, changeSaveConfigHandler]);
};

export default useSaveConfigHandler;
