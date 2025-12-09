import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph, Flex, Checkbox, Stack } from '@contentful/f36-components';
import { css } from 'emotion';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { PermissionsSection } from '../components/access-config';
import { usePermissions } from '../hooks/usePermissions';

const ConfigScreen = () => {
  const [expandedAccordions, setExpandedAccordions] = useState({
    contentLifecycle: true,
    otherFeatures: false,
    migration: false,
  });

  const {
    contentLifecyclePermissions,
    otherFeaturesPermissions,
    migrationPermissions,
    handleSelectAllToggle,
    handleEntityActionToggle,
    handleColumnToggle,
    handleRowToggle,
    handleOtherFeatureToggle,
    handleMigrationToggle,
  } = usePermissions();

  const parameters = {
    contentLifecyclePermissions,
    otherFeaturesPermissions,
    migrationPermissions,
  }


  const sdk = useSDK<ConfigAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [contentLifecyclePermissions, otherFeaturesPermissions, migrationPermissions, sdk]);

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
      const currentParameters: typeof parameters | null = await sdk.app.getParameters();

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

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
      style={{ maxWidth: '720px', margin: '0 auto', padding: '24px' }}
    >
      <Heading>App Config</Heading>
      <Paragraph>Contentful Remote MCP (Public Alpha)</Paragraph>
      <PermissionsSection
        contentLifecyclePermissions={contentLifecyclePermissions}
        otherFeaturesPermissions={otherFeaturesPermissions}
        migrationPermissions={migrationPermissions}
        expandedAccordions={expandedAccordions}
        onAccordionToggle={handleAccordionToggle}
        onSelectAllToggle={handleSelectAllToggle}
        onEntityActionToggle={handleEntityActionToggle}
        onColumnToggle={handleColumnToggle}
        onRowToggle={handleRowToggle}
        onOtherFeatureToggle={handleOtherFeatureToggle}
        onMigrationToggle={handleMigrationToggle}
      />
    </Stack>
  );
};

export default ConfigScreen;
