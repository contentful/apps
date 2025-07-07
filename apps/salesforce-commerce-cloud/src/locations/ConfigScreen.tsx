import React, { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, TextInput, FormControl } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Layout } from '@contentful/f36-layout-alpha';
import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/react';

export interface AppInstallationParameters {
  clientId: string;
  clientSecret: string;
  organizationId: string;
  shortCode: string;
  siteId: string;
}

const styles = {
  body: css({ paddingTop: 0 }),
  form: css({
    maxWidth: tokens.contentWidthDefault,
    margin: `${tokens.spacingL} auto 0`,
  }),
};

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    clientId: '',
    clientSecret: '',
    organizationId: '',
    shortCode: '',
    siteId: '',
  });

  const [valid, setValid] = useState<any>({
    clientId: null,
    clientSecret: null,
    organizationId: null,
    shortCode: null,
    siteId: null,
  });

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

    let isValid = true;
    const validUpdate: any = {};
    for (const key of Object.keys(valid)) {
      if (parameters[key as keyof AppInstallationParameters].length) {
        validUpdate[key as keyof typeof validUpdate] = true;
      } else {
        validUpdate[key] = false;
        isValid = false;
      }
    }

    setValid(validUpdate);

    if (!isValid) {
      return false;
    }

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk, valid]);

  const salesforceInputs = [
    {
      id: 'clientId',
      label: 'Client ID',
      helpText:
        'The Client ID of the API Client to use when connecting to your Salesforce Commerce Cloud store.',
    },
    {
      id: 'clientSecret',
      label: 'Client Secret',
      helpText:
        'The Client Secret (labeled Password) to use when connecting with the above API client.',
    },
    {
      id: 'organizationId',
      label: 'Organization ID',
      helpText: 'The Organization ID for your specific Salesforce Commerce Cloud instance.',
    },
    {
      id: 'shortCode',
      label: 'Short Code',
      helpText:
        'The Short Code for your Salesforce Commerce Cloud organization, used to route data correctly.',
    },
    {
      id: 'siteId',
      label: 'Site ID',
      helpText:
        'The Site ID of the specific Salesforce Commerce Cloud site that you want to retrieve products from.',
    },
  ];

  const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setValid({
      ...valid,
      [e.currentTarget.id]: true,
    });
  };

  const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setValid({
      ...valid,
      [e.currentTarget.id]: e.currentTarget.value.length ? true : false,
    });
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // console.log({[e.currentTarget.id]: e.currentTarget.value})
    setParameters({
      ...parameters,
      [e.currentTarget.id]: e.currentTarget.value,
    });
  };

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

  return (
    <Layout variant="fullscreen" offsetTop={0}>
      <Layout.Body css={styles.body}>
        <Form css={styles.form}>
          <Heading>App Config</Heading>
          {salesforceInputs.map((input) => (
            <FormInput
              key={input.id}
              input={input}
              value={parameters[input.id as keyof AppInstallationParameters]}
              isInvalid={valid[input.id] !== null && !valid[input.id]}
              onInputChange={onInputChange}
              onInputFocus={onInputFocus}
              onInputBlur={onInputBlur}
            />
          ))}
        </Form>
      </Layout.Body>
    </Layout>
  );
};

const FormInput = (props: {
  input: {
    id: string;
    label: string;
    helpText: string;
  };
  value: string;
  isInvalid: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  onInputBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}) => {
  const input = props.input;
  return (
    <FormControl isRequired isInvalid={props.isInvalid}>
      <FormControl.Label>{input.label}</FormControl.Label>
      <TextInput
        id={input.id}
        name={input.id}
        size="small"
        value={props.value}
        onChange={props.onInputChange}
        onFocus={props.onInputFocus}
        onBlur={props.onInputBlur}
      />
      {props.isInvalid && (
        <FormControl.ValidationMessage>{input.label} is required.</FormControl.ValidationMessage>
      )}
      <FormControl.HelpText>{input.helpText}</FormControl.HelpText>
    </FormControl>
  );
};

export default ConfigScreen;
