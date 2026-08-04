import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Stack } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PermissionsSection } from '../components/access-config';
import { usePermissions } from '../hooks/usePermissions';
import { FormHeader } from '../components/form-header/FormHeader';
import { Setup } from '../components/set-up/Setup';
import { RolesPermissionsFooter } from '../components/roles-permissions-footer';
import {
  createAppInstallationParameters,
  parseAppInstallationParameters,
} from '../utils/parameters';
import { AppInstallationParameters } from '../components/types/config';

const ConfigScreen = () => {
  const [expandedAccordions, setExpandedAccordions] = useState({
    contentLifecycle: true,
    experienceOrchestration: false,
    otherFeatures: false,
  });

  const sdk = useSDK<ConfigAppSDK>();

  const {
    contentLifecyclePermissions,
    otherFeaturesPermissions,
    setContentLifecyclePermissions,
    setOtherFeaturesPermissions,
    handleSelectAllToggle,
    handleEntityActionToggle,
    handleColumnToggle,
    handleRowToggle,
    handleOtherFeatureToggle,
  } = usePermissions();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    const parameters = createAppInstallationParameters({
      contentLifecyclePermissions,
      otherFeaturesPermissions,
    });
    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [contentLifecyclePermissions, otherFeaturesPermissions, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      // Restore saved permissions if they exist
      if (currentParameters) {
        const parsedParameters = parseAppInstallationParameters(currentParameters);

        setContentLifecyclePermissions(parsedParameters.contentLifecyclePermissions);
        setOtherFeaturesPermissions(parsedParameters.otherFeaturesPermissions);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk, setContentLifecyclePermissions, setOtherFeaturesPermissions]);

  const handleAccordionToggle = (section: string, expanded: boolean) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [section]: expanded,
    }));
  };

  return (
    <Stack
      flexDirection="column"
      alignItems="flex-start"
      spacing="spacingXl"
      style={{ maxWidth: '852px', margin: '0 auto', backgroundColor: 'white' }}
      padding="spacingL">
      <FormHeader />
      <PermissionsSection
        contentLifecyclePermissions={contentLifecyclePermissions}
        otherFeaturesPermissions={otherFeaturesPermissions}
        expandedAccordions={expandedAccordions}
        onAccordionToggle={handleAccordionToggle}
        onSelectAllToggle={handleSelectAllToggle}
        onEntityActionToggle={handleEntityActionToggle}
        onColumnToggle={handleColumnToggle}
        onRowToggle={handleRowToggle}
        onOtherFeatureToggle={handleOtherFeatureToggle}
      />
      <Setup />
      <RolesPermissionsFooter />
    </Stack>
  );
};

export default ConfigScreen;
