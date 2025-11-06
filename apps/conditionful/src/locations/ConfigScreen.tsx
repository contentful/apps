import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph, Flex } from '@contentful/f36-components';
import { css } from 'emotion';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { RulesConfig } from '../types/rules';

export interface AppInstallationParameters {
  /** Rules organized by content type ID */
  rules?: RulesConfig;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
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
  }, [parameters, sdk]);

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

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  // Count rules by content type
  const rulesCount = parameters.rules
    ? Object.entries(parameters.rules).reduce((acc, [contentTypeId, rules]) => {
        acc[contentTypeId] = rules.length;
        return acc;
      }, {} as Record<string, number>)
    : {};

  const totalRules = Object.values(rulesCount).reduce((sum, count) => sum + count, 0);

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading>Conditionful - Configuration</Heading>
        <Paragraph>
          Conditionful allows you to create conditional field visibility rules for your content types.
        </Paragraph>
        
        <Heading as="h3" marginTop="spacingL">Rules Summary</Heading>
        {totalRules === 0 ? (
          <Paragraph>
            No rules configured yet. Navigate to an entry's "Conditionful" tab to create your first rule.
          </Paragraph>
        ) : (
          <>
            <Paragraph>
              Total rules configured: <strong>{totalRules}</strong>
            </Paragraph>
            <Paragraph>Rules by content type:</Paragraph>
            <ul>
              {Object.entries(rulesCount).map(([contentTypeId, count]) => (
                <li key={contentTypeId}>
                  {contentTypeId}: {count} rule{count !== 1 ? 's' : ''}
                </li>
              ))}
            </ul>
          </>
        )}

        <Heading as="h3" marginTop="spacingL">How to Use</Heading>
        <ol>
          <li>Navigate to any entry in your space</li>
          <li>Look for the "Conditionful" tab in the entry editor</li>
          <li>Create rules to show or hide fields based on conditions</li>
          <li>Switch between tabs to see rules in action</li>
        </ol>

        <Paragraph marginTop="spacingM">
          <strong>Note:</strong> Rules are stored in the app installation parameters and are shared
          across all users in this environment.
        </Paragraph>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
