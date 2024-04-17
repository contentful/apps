import { useCallback, useState, useEffect, useReducer, ChangeEvent } from 'react';
import { ConfigAppSDK, ContentType } from '@contentful/app-sdk';
import { Box, Heading, Paragraph, Stack } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { styles } from './ConfigScreen.styles';
import useInitializeParameters from '@hooks/useInitializeParameters/useInitializeParameters';
import parameterReducer from '@components/parameterReducer';
import { ContentTypePreviewPathSection } from '@components/config-screen/ContentTypePreviewPathSection/ContentTypePreviewPathSection';
import { ProjectSelectionSection } from '@components/config-screen/ProjectSelectionSection/ProjectSelectionSection';
import { initialParameters } from '@constants/defaultParams';
import VercelClient from '@clients/Vercel';
import { ApiPath, Project } from '@customTypes/configPage';
import { ApiPathSelectionSection } from '@components/config-screen/ApiPathSelectionSection/ApiPathSelectionSection';
import { AuthenticationSection } from '@components/config-screen/AuthenticationSection/AuthenticationSection';
import { copies } from '@constants/copies';
import { actions } from '@constants/enums';
import { ConfigPageProvider } from '@contexts/ConfigPageProvider';

const ConfigScreen = () => {
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiPaths, setApiPaths] = useState<ApiPath[]>([]);
  const [isAppConfigurationSaved, setIsAppConfigurationSaved] = useState(true);

  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const sdk = useSDK<ConfigAppSDK>();

  const { title, description } = copies.configPage;

  useInitializeParameters(dispatchParameters);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if (!parameters.vercelAccessToken) {
      sdk.notifier.error('A valid Vercel access token is required');
      return false;
    }

    setIsAppConfigurationSaved(true);

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  const vercelClient = new VercelClient(parameters.vercelAccessToken);

  useEffect(() => {
    async function checkToken() {
      const tokenValid = await vercelClient.checkToken();
      setIsTokenValid(tokenValid);
    }

    if (parameters && parameters.vercelAccessToken) {
      checkToken();
    }
  }, [parameters.vercelAccessToken]);

  useEffect(() => {
    async function getContentTypes() {
      const contentTypesResponse = await sdk.cma.contentType.getMany({});

      if (contentTypesResponse.items && contentTypesResponse.items.length) {
        setContentTypes(contentTypesResponse.items);
      }
    }

    getContentTypes();
  }, []);

  useEffect(() => {
    async function getProjects() {
      const data = await vercelClient.listProjects();

      if (parameters.vercelAccessToken) {
        setProjects(data.projects);
      }
    }

    getProjects();
  }, [parameters.vercelAccessToken]);

  useEffect(() => {
    async function getApiPaths() {
      const data = await vercelClient.listApiPaths(parameters.selectedProject);

      if (parameters.vercelAccessToken) {
        setApiPaths(data);
      }
    }

    if (parameters.selectedProject) {
      // reset the selected api path only when the project changes
      if (apiPaths.length) {
        dispatchParameters({
          type: actions.APPLY_API_PATH,
          payload: '',
        });
      }

      getApiPaths();
    }
  }, [parameters.selectedProject]);

  const handleTokenChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatchParameters({
      type: actions.UPDATE_VERCEL_ACCESS_TOKEN,
      payload: e.target.value,
    });
  };

  const handleAppConfigurationChange = () => {
    setIsAppConfigurationSaved(false);
  };

  return (
    <ConfigPageProvider
      contentTypes={contentTypes}
      isAppConfigurationSaved={isAppConfigurationSaved}
      handleAppConfigurationChange={handleAppConfigurationChange}
      dispatch={dispatchParameters}
      parameters={parameters}>
      <Box className={styles.body}>
        <Box>
          <Heading>{title}</Heading>
          <Paragraph>{description}</Paragraph>
        </Box>
        <hr className={styles.splitter} />
        <Stack spacing="spacingS" flexDirection="column">
          <AuthenticationSection
            handleTokenChange={handleTokenChange}
            isTokenValid={isTokenValid}
          />

          {isTokenValid && <ProjectSelectionSection projects={projects} />}

          {isTokenValid && parameters.selectedProject && (
            <ApiPathSelectionSection paths={apiPaths} />
          )}

          {isTokenValid && parameters.selectedProject && parameters.selectedApiPath && (
            <ContentTypePreviewPathSection />
          )}
        </Stack>
      </Box>
    </ConfigPageProvider>
  );
};

export default ConfigScreen;
