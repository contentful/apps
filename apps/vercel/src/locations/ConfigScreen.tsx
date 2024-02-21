import React, { useCallback, useState, useEffect, useReducer, ChangeEvent } from 'react';
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
import VercelIcon from '../components/common/VercelIcon';
import useInitializeParameters from '../hooks/useInitializeParameters';
import parameterReducer, { actions } from '../components/parameterReducer';
import { initialParameters } from '../constants/defaultParams';
import VercelClient from '../clients/vercel';

const ConfigScreen = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [appInstalled, setIsAppInstalled] = useState(false);
  const [tokenError, setTokenError] = useState<boolean | null>();
  const [tokenValid, setTokenValid] = useState<boolean | null>();
  // TODO: figure out if deployments are infact useful here
  // const [deployments, setDeployments] = useState<Deployments>();
  const sdk = useSDK<ConfigAppSDK>();
  const vercelClient = new VercelClient(parameters.vercelAccessToken);

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

  useEffect(() => {
    async function getProjects() {
      const projects = await vercelClient.listProjects();

      console.log({ projects });
    }

    if (appInstalled && parameters && parameters.vercelAccessToken) {
      getProjects();
    }
  }, [parameters, appInstalled]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatchParameters({
      type: actions.UPDATE_VERCEL_ACCESS_TOKEN,
      payload: e.target.value,
    });
  };

  const renderStatusBadge = () => {
    if (appInstalled && parameters.vercelAccessToken && tokenValid) {
      return <Badge variant="positive">Valid access token</Badge>;
    } else if (tokenError) {
      return <Badge variant="negative">Invalid access token</Badge>;
    } else {
      return <Badge variant="warning">Token not configured</Badge>;
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

        <Stack spacing="spacingL" flexDirection="column">
          <Box style={styles.box}>
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
                onChange={handleChange}
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
            </FormControl>
            <Box style={styles.badgeContainer}>
              <Flex fullWidth flexDirection="column">
                <Text fontWeight="fontWeightDemiBold" marginRight="spacing2Xs">
                  Status
                </Text>
                <Box>{renderStatusBadge()}</Box>
              </Flex>
            </Box>
          </Box>
        </Stack>
      </Box>
      <Box style={styles.icon}>
        <Flex alignItems="center" justifyContent="center">
          <VercelIcon />
        </Flex>
      </Box>
    </>
  );
};

export default ConfigScreen;
