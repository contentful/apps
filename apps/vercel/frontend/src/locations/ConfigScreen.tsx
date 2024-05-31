import { useCallback, useState, useEffect, useReducer, ChangeEvent, FocusEvent } from 'react';
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
import { errorTypes, errorsActions, parametersActions } from '@constants/enums';
import { ConfigPageProvider } from '@contexts/ConfigPageProvider';
import { GettingStartedSection } from '@components/config-screen/GettingStartedSection/GettingStartedSection';
import errorsReducer from '@reducers/errorsReducer';
import { useError } from '@hooks/useError/useError';
import { useFetchData } from '@hooks/useFetchData/useFetchData';
import { ContentfulPreviewSecretSection } from '@components/config-screen/ContentfulPreviewSecretSection/ContentfulPreviewSecretSection';

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

  const { isError: isAuthenticationError } = useError({
    error: errors.authentication,
  });

  const { isError: isContentfulPreviewSecretError } = useError({
    error: errors.contentfulPreviewSecret,
  });

  const { validateToken, validateContentfulPreviewSecret, fetchProjects, fetchApiPaths } =
    useFetchData({
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

    if (!parameters.contentfulPreviewSecret) {
      sdk.notifier.error('A valid Contentful preview secret is required');
      return false;
    }

    if (!vercelClient) {
      sdk.notifier.error('An error occurred while trying to authenticate with Vercel');
      return false;
    }

    if (!parameters.contentfulPreviewSecret || !isContentfulPreviewSecretError) {
      await vercelClient.updateEnvironmentVariable(
        parameters.contentfulPreviewSecret,
        'CONTENTFUL_PREVIEW_SECRET',
        parameters.selectedProject
      );

      validateEnvironmentExistence();
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

  const validateEnvironmentExistence = useCallback(async () => {
    if (vercelClient && parameters.selectedProject) {
      try {
        const res = await vercelClient.listEnvironmentVariables(parameters.selectedProject);

        if (res.ok) {
          const contentfulPreviewSecret = res.data.find(
            (envVar: { key: string }) => envVar.key === 'CONTENTFUL_PREVIEW_SECRET'
          );

          if (contentfulPreviewSecret) {
            dispatchErrors({
              type: errorsActions.UPDATE_CONTENTFUL_PREVIEW_SECRET_ERRORS,
              payload: errorTypes.ENVIRONMENT_VARIABLE_ALREADY_EXISTS,
            });
          } else {
            dispatchErrors({
              type: errorsActions.RESET_CONTENTFUL_PREVIEW_SECRET_ERRORS,
            });
          }
        }
      } catch (error) {
        dispatchErrors({
          type: errorsActions.UPDATE_CONTENTFUL_PREVIEW_SECRET_ERRORS,
          payload: errorTypes.CANNOT_FETCH_VERCEL_ENV_VARS,
        });
      }
    }
  }, [vercelClient, parameters.selectedProject, dispatchErrors]);

  useEffect(() => {
    validateEnvironmentExistence();
  }, [validateEnvironmentExistence]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    setIsLoading(true);

    async function checkToken() {
      await validateToken(updateTokenValidityState);
    }

    checkToken();
  }, [vercelClient]);

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
      await fetchProjects(setProjects);
      setIsLoading(false);
    }

    if (parameters.teamId) {
      getProjects();
    }
  }, [vercelClient, parameters.teamId]);

  useEffect(() => {
    async function getApiPaths() {
      setIsLoading(true);
      await fetchApiPaths(setApiPaths, parameters.selectedProject);
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

  const updateContentPreviewSecretValidityState = () => {
    setIsLoading(false);
  };

  const handleTokenChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setHasTokenBeenValidated(false);

    dispatchParameters({
      type: parametersActions.UPDATE_VERCEL_ACCESS_TOKEN,
      payload: e.target.value,
    });

    async function checkToken() {
      // if the token is empty, reset all authentication errors and skip validation
      if (e.target.value === '') {
        dispatchErrors({
          type: errorsActions.RESET_AUTHENTICATION_ERRORS,
        });
      } else {
        await validateToken(updateTokenValidityState, new VercelClient(e.target.value));
      }
    }

    checkToken();
  };

  const handlePreviewSecretChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatchParameters({
      type: parametersActions.UPDATE_CONTENTFUL_PREVIEW_SECRET,
      payload: e.target.value,
    });
  };

  const handlePreviewSecretBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsLoading(true);

    if (e.target.value === '') {
      dispatchErrors({
        type: errorsActions.RESET_CONTENTFUL_PREVIEW_SECRET_ERRORS,
      });
      setIsLoading(false);
    } else {
      validateContentfulPreviewSecret(
        updateContentPreviewSecretValidityState,
        parameters.selectedProject
      );
    }
  };

  const handleAppConfigurationChange = () => {
    setIsAppConfigurationSaved(false);
  };

  const renderPostAuthComponents =
    !isAuthenticationError &&
    hasTokenBeenValidated &&
    !!parameters.vercelAccessToken &&
    !!parameters.teamId;
  const renderPostProjectSelectionComponents =
    renderPostAuthComponents &&
    !errors.projectSelection.projectNotFound &&
    !errors.projectSelection.cannotFetchProjects &&
    parameters.selectedProject &&
    projects.length;

  return (
    <ConfigPageProvider
      contentTypes={contentTypes}
      isAppConfigurationSaved={isAppConfigurationSaved}
      handleAppConfigurationChange={handleAppConfigurationChange}
      dispatchParameters={dispatchParameters}
      dispatchErrors={dispatchErrors}
      isLoading={isLoading}
      parameters={parameters}
      sdk={sdk}
      vercelClient={vercelClient}
      errors={errors}>
      <Box className={styles.body}>
        <Box>
          <Heading>{title}</Heading>
          <Paragraph>{description}</Paragraph>
        </Box>
        <hr className={styles.splitter} />
        <Stack spacing="spacingS" flexDirection="column">
          <AuthenticationSection handleTokenChange={handleTokenChange} />
          {renderPostAuthComponents && <ProjectSelectionSection projects={projects} />}

          {renderPostProjectSelectionComponents && (
            <>
              <ContentfulPreviewSecretSection
                handleChange={handlePreviewSecretChange}
                handleBlur={handlePreviewSecretBlur}
                handleRetry={validateEnvironmentExistence}
              />
              <ApiPathSelectionSection paths={apiPaths} />
            </>
          )}

          {renderPostProjectSelectionComponents && parameters.selectedApiPath && (
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
