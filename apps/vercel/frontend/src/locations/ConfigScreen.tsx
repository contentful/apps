import { useCallback, useState, useEffect, useReducer, ChangeEvent } from 'react';
import { ConfigAppSDK, ContentType } from '@contentful/app-sdk';
import { Box, Heading, Paragraph, Stack } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { styles } from './ConfigScreen.styles';
import useInitializeParameters from '@hooks/useInitializeParameters/useInitializeParameters';
import parameterReducer from '../reducers/parameterReducer';
import { ContentTypePreviewPathSection } from '@components/config-screen/ContentTypePreviewPathSection/ContentTypePreviewPathSection';
import { ProjectSelectionSection } from '@components/config-screen/ProjectSelectionSection/ProjectSelectionSection';
import { initialErrors, initialParameters } from '@constants/defaultParams';
import VercelClient from '@clients/Vercel';
import { ApiPath, Project } from '@customTypes/configPage';
import { ApiPathSelectionSection } from '@components/config-screen/ApiPathSelectionSection/ApiPathSelectionSection';
import { AuthenticationSection } from '@components/config-screen/AuthenticationSection/AuthenticationSection';
import { copies } from '@constants/copies';
import { parametersActions } from '@constants/enums';
import { ConfigPageProvider } from '@contexts/ConfigPageProvider';
import { GettingStartedSection } from '@components/config-screen/GettingStartedSection/GettingStartedSection';
import errorsReducer from '@reducers/errorsReducer';
import { useError } from '@hooks/useError/useError';
import { useFetchData } from '@hooks/useFetchData/useFetchData';

const ConfigScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasTokenBeenValidated, setHasTokenBeenValidated] = useState(false);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiPaths, setApiPaths] = useState<ApiPath[]>([]);
  const [isAppConfigurationSaved, setIsAppConfigurationSaved] = useState(true);
  const [vercelClient, setVercelClient] = useState<VercelClient | null>(null);

  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [errors, dispatchErrors] = useReducer(errorsReducer, initialErrors);
  const { isError: isAuthenticationError } = useError({ error: errors.authentication });
  const { validateToken, fetchProjects, fetchApiPaths } = useFetchData({
    dispatchErrors,
    dispatchParameters,
    vercelClient,
    teamId: parameters.teamId,
  });

  const sdk = useSDK<ConfigAppSDK>();

  const { title, description } = copies.configPage;

  useInitializeParameters(dispatchParameters);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if (!parameters.vercelAccessToken || isAuthenticationError) {
      sdk.notifier.error('A valid Vercel access token is required');
      return false;
    }

    setIsAppConfigurationSaved(true);

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk, isAuthenticationError]);

  useEffect(() => {
    if (parameters.vercelAccessToken) {
      setVercelClient(new VercelClient(parameters.vercelAccessToken));
    }
  }, [parameters.vercelAccessToken]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    setIsLoading(true);

    async function checkToken() {
      if (vercelClient) {
        validateToken(updateTokenValidityState);
      }
    }

    if (!parameters.vercelAccessToken) {
      // if there is no value set for the access token we will consider it valid
      updateTokenValidityState();
    } else {
      checkToken();
    }
  }, [parameters.vercelAccessToken, parameters.teamId, vercelClient]);

  useEffect(() => {
    async function getContentTypes() {
      const contentTypesResponse = await sdk.cma.contentType.getMany({});

      if (contentTypesResponse.items && contentTypesResponse.items.length) {
        setContentTypes(contentTypesResponse.items || []);
      }
    }

    getContentTypes();
  }, []);

  useEffect(() => {
    async function getProjects() {
      setIsLoading(true);
      fetchProjects(setProjects);
      setIsLoading(false);
    }

    if (parameters.vercelAccessToken && hasTokenBeenValidated && !isAuthenticationError) {
      getProjects();
    }
  }, [
    parameters.vercelAccessToken,
    hasTokenBeenValidated,
    isAuthenticationError,
    vercelClient,
    parameters.teamId,
  ]);

  useEffect(() => {
    async function getApiPaths() {
      setIsLoading(true);
      fetchApiPaths(setApiPaths, parameters.selectedProject);
      setIsLoading(false);
    }

    if (parameters.selectedProject) {
      getApiPaths();
    }
  }, [parameters.selectedProject, vercelClient, parameters.teamId]);

  const updateTokenValidityState = () => {
    setIsLoading(false);
    setHasTokenBeenValidated(true);
  };

  const handleTokenChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);

    dispatchParameters({
      type: parametersActions.UPDATE_VERCEL_ACCESS_TOKEN,
      payload: e.target.value,
    });

    async function checkToken() {
      validateToken(updateTokenValidityState, new VercelClient(e.target.value));
    }

    checkToken();
  };

  const handleAppConfigurationChange = () => {
    setIsAppConfigurationSaved(false);
  };

  const renderPostAuthComponents = !isAuthenticationError && parameters.vercelAccessToken;

  return (
    <ConfigPageProvider
      contentTypes={contentTypes}
      isAppConfigurationSaved={isAppConfigurationSaved}
      handleAppConfigurationChange={handleAppConfigurationChange}
      dispatchParameters={dispatchParameters}
      dispatchErrors={dispatchErrors}
      isLoading={isLoading}
      parameters={parameters}
      errors={errors}>
      <Box className={styles.body}>
        <Box>
          <Heading>{title}</Heading>
          <Paragraph>{description}</Paragraph>
        </Box>
        <hr className={styles.splitter} />
        <Stack spacing="spacingS" flexDirection="column">
          {hasTokenBeenValidated && <AuthenticationSection handleTokenChange={handleTokenChange} />}

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
