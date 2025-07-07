import React, { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import {
  Button,
  Heading,
  Flex,
  FormControl,
  Paragraph,
  TextLink,
  Notification,
  Pill,
  TextInput,
  Menu,
  GlobalStyles,
} from '@contentful/f36-components';
import { Layout } from '@contentful/f36-layout-alpha';
import { css } from 'emotion';
import { fetchProjects } from '../functions/getVideos';
import { ProjectReduced, WistiaError } from './helpers/types';
import { styles } from './ConfigScreen.styles';

export interface AppInstallationParameters {
  apiBearerToken?: string;
  excludedProjects?: ProjectReduced[];
}

interface ConfigProps {
  sdk: AppExtensionSDK;
}

const Config = (props: ConfigProps) => {
  const [requiredMessage, setRequiredMessage] = useState('');
  const [showButton, setShowButton] = useState(true);
  const [fetchedProjects, setFetchedProjects] = useState<ProjectReduced[]>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    apiBearerToken: '',
    excludedProjects: [],
  });
  const [loading, setLoadingStatus] = useState(false);

  const getProjects = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const response = await fetchProjects(parameters.apiBearerToken || '');
      Notification.success('Your connection to the Wistia Data API is working.');
      // set the projects in the state (don't save all the projects in the config parameters to prevent
      // the config object to become very large and reach the size limit)
      setFetchedProjects(response);
      setShowButton(false);
      setRequiredMessage('');
      setLoadingStatus(false);
    } catch (error) {
      if (error instanceof WistiaError) {
        Notification.error(`Connection to Wistia Data API failed: ${error.message}`);
        setFetchedProjects([]);
        if (error.code && error.message) {
          setRequiredMessage(error.message);
        }
      }
    }
  }, [parameters.apiBearerToken]);

  // Updates app configuration by calling this function as a callback in the app.sdk.onConfigure function
  const configureApp = useCallback(async () => {
    const currentState = await props.sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, props.sdk]);

  // Called whenever the config changes
  useEffect(() => {
    props.sdk.app.onConfigure(() => configureApp());
  }, [props.sdk, configureApp, parameters]);

  // Called whenever the parameters.apiBearerToken in the config changes
  useEffect(() => {
    if (parameters.apiBearerToken) {
      getProjects();
    }
  }, [parameters.apiBearerToken, getProjects]);

  // Initial load for config page
  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null =
        await props.sdk.app.getParameters();

      // Set local parameter state based on the installation params
      if (currentParameters) {
        setParameters(currentParameters);
      } else {
        setParameters({
          apiBearerToken: '',
          excludedProjects: [],
        });
      }

      props.sdk.app.setReady();
    })();
  }, [props.sdk]);

  const getInputValue: () => void = async () => {
    const tokenField = document.getElementById('apiBearerTokenInput') as HTMLInputElement | null;
    if (tokenField !== null) {
      const value = tokenField?.value;
      if (!value) {
        setRequiredMessage('Please, provide a bearer token value');
      } else {
        const newParameters: { [key: string]: any } = {
          ...parameters,
        };
        newParameters['apiBearerToken'] = value;

        // in case the value provided is the same as the one stored, tries to fetch the projects anyway
        // and the buttons will disappear in both the scenarios (succesful or error response)
        if (newParameters['apiBearerToken'] === parameters.apiBearerToken) {
          getProjects();
        } else {
          setParameters(newParameters);
        }
      }
    }
  };

  const removeExcludedProject = (id: string) => {
    const newExcludedProjects = parameters.excludedProjects
      ? [...parameters.excludedProjects].filter((item) => id !== item.hashedId)
      : [];

    setParameters({
      ...parameters,
      excludedProjects: newExcludedProjects,
    });

    return;
  };

  const addExcludedProject = (item: ProjectReduced) => {
    if (
      parameters.excludedProjects?.findIndex((project) => project.hashedId === item.hashedId) !== -1
    ) {
      removeExcludedProject(item.hashedId);
      return;
    }
    const newExcludedProjects = parameters.excludedProjects
      ? [...parameters.excludedProjects, item]
      : [item];

    setParameters({
      ...parameters,
      excludedProjects: newExcludedProjects,
    });

    return;
  };

  return (
    <>
      <GlobalStyles />
      <Layout variant="fullscreen" offsetTop={0}>
        <Layout.Body className={css(styles.body)}>
          <Flex flexDirection="column" className={css(styles.form)}>
            <Heading>Wistia Videos App Configuration</Heading>
            <Paragraph>Please provide your access bearer token for the Wistia Data API.</Paragraph>
            <Flex flexDirection="column" marginTop="spacingM">
              <div style={{ marginBottom: '20px' }}>
                <FormControl id="apiBearerTokenInput">
                  <FormControl.Label>Wistia Data API access bearer token</FormControl.Label>
                  <TextInput
                    isRequired
                    name="apiBearerTokenInput"
                    onChange={() => setShowButton(true)}
                    value={parameters.apiBearerToken}
                  />
                  <FormControl.ValidationMessage>
                    {requiredMessage || ''}
                  </FormControl.ValidationMessage>
                </FormControl>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <Paragraph>
                  It's very important to provide a bearer token with "read only" permissions and the
                  "all project and video data" options enabled. The token saved in this app will be
                  accessible by the users of this Contentful space.
                </Paragraph>
              </div>
              <TextLink
                href="https://wistia.com/support/account-and-billing/setup#api-access"
                target="_blank"
                rel="noreferrer">
                How to find your access bearer token
              </TextLink>
            </Flex>
            {(!fetchedProjects?.length || showButton) && (
              <Flex marginTop="spacingL">
                <Button onClick={() => getInputValue()} isLoading={loading}>
                  Display Wistia projects
                </Button>
              </Flex>
            )}
            <Flex flexDirection="column" marginTop={'spacingXl'} fullHeight>
              {!!fetchedProjects?.length && (
                <>
                  <Flex marginBottom="spacingXs">
                    <Heading as="h2">Choose projects to exclude from the app.</Heading>
                  </Flex>
                  <Flex marginBottom="spacingL">
                    <Paragraph>
                      Choose any projects that you think aren't relevant to what editors are doing
                      in this Contentful space.
                    </Paragraph>
                  </Flex>
                  {!!parameters.excludedProjects?.length && (
                    <Flex marginBottom="spacingM" flexWrap="wrap">
                      {parameters.excludedProjects.map((item) => (
                        <Pill
                          style={{ width: 200, marginRight: 10, marginBottom: 10 }}
                          label={item.name}
                          onClose={() => removeExcludedProject(item.hashedId)}
                          key={item.id}
                        />
                      ))}
                    </Flex>
                  )}
                  {fetchedProjects.length > 0 ? (
                    <div className={css(styles.projectMenu)}>
                      <Menu
                        isOpen
                        isFullWidth
                        isAutoalignmentEnabled={false}
                        usePortal={false}
                        placement="bottom-end">
                        <Menu.List style={{ position: 'unset' }}>
                          {fetchedProjects.map((item) => (
                            <Menu.Item
                              onClick={() => addExcludedProject(item)}
                              isActive={
                                parameters.excludedProjects?.findIndex(
                                  (project) => project.hashedId === item?.hashedId
                                ) !== -1
                              }
                              key={`key-${item.id}`}>
                              {item.name}
                            </Menu.Item>
                          ))}
                        </Menu.List>
                      </Menu>
                    </div>
                  ) : null}
                </>
              )}
            </Flex>
          </Flex>
        </Layout.Body>
      </Layout>
    </>
  );
};

export default Config;
