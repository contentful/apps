import { useCallback, useState, useEffect, useReducer, ChangeEvent } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  FormControl,
  Heading,
  HelpText,
  Paragraph,
  Stack,
  TextInput,
  TextLink,
  Text,
  Badge,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from '../components/config-screen/ConfigScreen.styles';
import useInitializeParameters from '../hooks/useInitializeParameters';
import parameterReducer, { actions } from '../components/parameterReducer';
import { initialParameters } from '../constants/defaultParams';
import VercelClient from '../clients/Vercel';
import ProjectSelect from '../components/config-screen/ProjectSelect';
import { ContentTypePreviewPathSection } from '../components/config-screen/ContentTypePreviewPathSection/ContentTypePreviewPathSection';

const ConfigScreen = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [appInstalled, setIsAppInstalled] = useState(false);
  const sdk = useSDK<ConfigAppSDK>();

  useInitializeParameters(dispatchParameters);

  const getIsAppInstalled = useCallback(async () => {
    const isInstalled = await sdk.app.isInstalled();

    setIsAppInstalled(isInstalled);
  }, [sdk]);

  useEffect(() => {
    getIsAppInstalled();
    sdk.app.onConfigurationCompleted(() => setIsAppInstalled(true));
  }, [sdk]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if (!parameters.vercelAccessToken) {
      sdk.notifier.error('A valid Vercel access token is required');
      return false;
    }

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

      if (tokenValid) {
        dispatchParameters({
          type: actions.UPDATE_VERCEL_ACCESS_TOKEN_STATUS,
          payload: true,
        });
      } else {
        dispatchParameters({
          type: actions.UPDATE_VERCEL_ACCESS_TOKEN_STATUS,
          payload: false,
        });
      }
    }

    if (appInstalled && parameters && parameters.vercelAccessToken) {
      checkToken();
    }
  }, [parameters.vercelAccessToken]);

  useEffect(() => {
    async function getContentTypes() {
      const contentTypesResponse = await sdk.cma.contentType.getMany({});

      if (contentTypesResponse.items && contentTypesResponse.items.length) {
        dispatchParameters({
          type: actions.UPDATE_CONTENT_TYPES,
          payload: contentTypesResponse.items,
        });
      }
    }

    getContentTypes();
  }, []);

  useEffect(() => {
    async function getProjects() {
      const data = await vercelClient.listProjects();

      if (parameters.vercelAccessToken) {
        dispatchParameters({
          type: actions.UPDATE_VERCEL_PROJECTS,
          payload: data.projects,
        });
      }
    }

    getProjects();
  }, [parameters.vercelAccessToken]);

  const handleTokenChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatchParameters({
      type: actions.UPDATE_VERCEL_ACCESS_TOKEN,
      payload: e.target.value,
    });
  };

  const renderStatusBadge = () => {
    if (appInstalled && parameters.vercelAccessToken && parameters.vercelAccessTokenStatus) {
      return <Badge variant="positive">Valid access token</Badge>;
    } else if (!parameters.vercelAccessTokenStatus) {
      return <Badge variant="negative">Invalid access token</Badge>;
    } else {
      return <Badge variant="secondary">Token not configured</Badge>;
    }
  };

  return (
    <>
      <Box className={styles.body}>
        <Box>
          <Heading>Set up the Vercel App</Heading>
          <Paragraph>
            Preview and deploy automatically and securely from the entry editor.
          </Paragraph>
        </Box>
        <hr className={styles.splitter} />
        <Stack spacing="spacingS" flexDirection="column">
          <Box className={styles.box}>
            <Heading className={styles.heading}>Connect Vercel</Heading>
            <FormControl id="accessToken" isRequired={true}>
              <FormControl.Label aria-label="accessToken" htmlFor="accessToken">
                Vercel Access Token
              </FormControl.Label>
              <TextInput
                testId="accessToken"
                spellCheck={false}
                name="accessToken"
                type="password"
                placeholder={'ex. atE2sdftcIp01O1isdfXc3QTdT4...'}
                value={parameters.vercelAccessToken}
                onChange={handleTokenChange}
              />
              <HelpText>
                Follow{' '}
                <TextLink
                  icon={<ExternalLinkIcon />}
                  alignIcon="end"
                  href="https://vercel.com/docs/rest-api#creating-an-access-token"
                  target="_blank"
                  rel="noopener noreferrer">
                  these detailed instructions
                </TextLink>{' '}
                to create an access token in the Vercel dashboard.
              </HelpText>
              <Box className={styles.badgeContainer}>
                <Flex fullWidth flexDirection="column">
                  <Text fontWeight="fontWeightDemiBold" marginRight="spacing2Xs">
                    Status
                  </Text>
                  <Box>{renderStatusBadge()}</Box>
                </Flex>
              </Box>
              <hr className={styles.splitter} />
            </FormControl>
          </Box>
          <Box className={styles.box}>
            <Heading className={styles.heading}>Configure Deployment</Heading>
            <ProjectSelect parameters={parameters} dispatch={dispatchParameters} />
            <hr className={styles.splitter} />
          </Box>
          <ContentTypePreviewPathSection
            parameters={parameters}
            dispatchParameters={dispatchParameters}
          />
        </Stack>
      </Box>
    </>
  );
};

export default ConfigScreen;
