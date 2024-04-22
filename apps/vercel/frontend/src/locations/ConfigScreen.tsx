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
import { GettingStartedSection } from '@components/config-screen/GettingStartedSection/GettingStartedSection';

const ConfigScreen = () => {
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTokenBeenValidated, setHasTokenBeenValidated] = useState(false);
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

  const vercelClient = new VercelClient(parameters.vercelAccessToken);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    setIsLoading(true);

    async function checkToken() {
      const response = await vercelClient.checkToken();
      if (response) setIsLoading(false);

      setIsTokenValid(response);
      setHasTokenBeenValidated(true);
    }

    if (!hasTokenBeenValidated) {
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
      setIsLoading(true);
      const data = await vercelClient.listProjects();
      setProjects(data.projects);
      setIsLoading(false);
    }

    if (parameters.vercelAccessToken && hasTokenBeenValidated && isTokenValid) getProjects();
  }, [parameters.vercelAccessToken, hasTokenBeenValidated, isTokenValid]);

  useEffect(() => {
    async function getApiPaths() {
      setIsLoading(true);
      const data = await vercelClient.listApiPaths(parameters.selectedProject);

      if (parameters.vercelAccessToken) {
        setApiPaths(data);
      }

      setIsLoading(false);
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
    setIsLoading(true);

    dispatchParameters({
      type: actions.UPDATE_VERCEL_ACCESS_TOKEN,
      payload: e.target.value,
    });

    async function checkToken() {
      const tokenValid = await new VercelClient(e.target.value).checkToken();
      setIsTokenValid(tokenValid);
      setIsLoading(false);
      setHasTokenBeenValidated(true);
    }

    checkToken();
  };

  const handleAppConfigurationChange = () => {
    setIsAppConfigurationSaved(false);
  };

  const renderPostAuthComponents = isTokenValid && parameters.vercelAccessToken;

  return (
    <ConfigPageProvider
      contentTypes={contentTypes}
      isAppConfigurationSaved={isAppConfigurationSaved}
      handleAppConfigurationChange={handleAppConfigurationChange}
      dispatch={dispatchParameters}
      isLoading={isLoading}
      parameters={parameters}>
      <Box className={styles.body}>
        <Box>
          <Heading>{title}</Heading>
          <Paragraph>{description}</Paragraph>
        </Box>
        <hr className={styles.splitter} />
        <Stack spacing="spacingS" flexDirection="column">
          {hasTokenBeenValidated && (
            <AuthenticationSection
              handleTokenChange={handleTokenChange}
              isTokenValid={isTokenValid}
            />
          )}

          {renderPostAuthComponents && <ProjectSelectionSection projects={projects} />}

          {renderPostAuthComponents && parameters.selectedProject && (
            <ApiPathSelectionSection paths={apiPaths} />
          )}

          {renderPostAuthComponents && parameters.selectedProject && parameters.selectedApiPath && (
            <>
              <ContentTypePreviewPathSection />
              <hr className={styles.splitter} />
              <GettingStartedSection />
            </>
          )}
        </Stack>
      </Box>
    </ConfigPageProvider>
  );
};

export default ConfigScreen;
